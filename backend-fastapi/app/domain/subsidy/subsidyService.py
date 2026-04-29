import anthropic
import requests
import os
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.ai_client import GeminiClient
import json

load_dotenv()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

def get_embedding(text: str):
    return GeminiClient._local_model.encode(text).tolist()

async def get_subsidies(
        db: AsyncSession,
        region: str = None,
        industry: str = None,
        age: int = None,
        query: str = None,
        page: int = 1,
        size: int = 10
):
    conditions = []
    params = {}

    if region:
        conditions.append("region ILIKE :region")
        params["region"] = f"%{region}%"

    if industry:
        conditions.append("industry ILIKE :industry")
        params["industry"] = f"%{industry}%"

    if age:
        conditions.append("(min_age IS NULL OR min_age <= :age)")
        conditions.append("(max_age IS NULL OR max_age >= :age)")
        params["age"] = age

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    if query:
        query_embedding = get_embedding(query)
        params["query_embedding"] = query_embedding
        order = "ORDER BY embedding <=> :query_embedding::vector"
    else:
        order = "ORDER BY deadline ASC NULLS LAST"

    count_sql = f"SELECT COUNT(*) FROM subsidies {where}"
    result = await db.execute(text(count_sql), params)
    total = result.scalar()

    offset = (page - 1) * size
    params["limit"] = size
    params["offset"] = offset

    data_sql = f"""
        SELECT id, name, organization, region, industry,
               min_age, max_age, max_amount, deadline,
               description, apply_url
        FROM subsidies {where}
        {order}
        LIMIT :limit OFFSET :offset
    """
    result = await db.execute(text(data_sql), params)
    rows = result.fetchall()

    return total, rows


CRAWL_SOURCES = [
    {
        "name": "K-스타트업",
        "url": "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do",
    },
    {
        "name": "중소벤처기업부",
        "url": "https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=310",
    },
    {
        "name": "기업마당",
        "url": "https://www.bizinfo.go.kr/",
    },
]

async def crawl_page(url: str):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.get_text(separator="\n", strip=True)
    except Exception as e:
        print(f"크롤링 오류 {url}: {e}")
        return None

async def extract_subsidy_data(raw_text: str, source_name: str):
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": f"""
다음은 "{source_name}" 사이트의 창업 지원금 공고야.
아래 JSON 형식으로만 응답해줘. 없는 정보는 null로.

{{
  "name": "지원금명",
  "organization": "주관기관",
  "region": "지역 (전국이면 null)",
  "industry": "업종 (제한없으면 null)",
  "min_age": 최소나이(숫자),
  "max_age": 최대나이(숫자),
  "max_amount": 최대지원금액(숫자, 원단위),
  "deadline": "마감일 (YYYY-MM-DD)",
  "description": "상세설명 (3줄 이내)",
  "apply_url": "신청URL"
}}

공고내용:
{raw_text[:3000]}
"""
            }
        ]
    )
    text = message.content[0].text
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

async def save_subsidy(data: dict, source_url: str, db: AsyncSession):
    embed_text = f"{data['name']} {data.get('description', '')} {data.get('industry', '')}"
    embedding = get_embedding(embed_text)

    await db.execute(
        text("""
             INSERT INTO subsidies
             (name, organization, region, industry, min_age, max_age,
              max_amount, deadline, description, apply_url, source_url, embedding)
             VALUES
                 (:name, :organization, :region, :industry, :min_age, :max_age,
                  :max_amount, :deadline, :description, :apply_url, :source_url, :embedding)
             ON CONFLICT (source_url) DO UPDATE SET
                                                    deadline = EXCLUDED.deadline,
                                                    description = EXCLUDED.description,
                                                    updated_at = NOW()
             """),
        {**data, "source_url": source_url, "embedding": embedding}
    )
    await db.commit()

async def delete_expired_subsidies(db: AsyncSession):
    await db.execute(
        text("DELETE FROM subsidies WHERE deadline < :today"),
        {"today": date.today()}
    )
    await db.commit()
    print("만료된 지원금 삭제 완료")

async def collect_subsidies(db: AsyncSession):
    await delete_expired_subsidies(db)

    for source in CRAWL_SOURCES:
        print(f"{source['name']} 크롤링 중...")
        raw_text = await crawl_page(source["url"])
        if not raw_text:
            continue
        try:
            data = await extract_subsidy_data(raw_text, source["name"])
            await save_subsidy(data, source["url"], db)
            print(f"{source['name']} 저장 완료")
        except Exception as e:
            print(f"{source['name']} 오류: {e}")