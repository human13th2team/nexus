import requests
import os
import json
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.ai_client import GeminiClient
from dotenv import load_dotenv

load_dotenv()

SMES_API_URL = "https://www.smes.go.kr/fnct/apiReqst/extPblancInfo"
SMES_TOKEN = os.getenv("SMES_API_TOKEN")

def get_embedding(text_input: str):
    return GeminiClient._local_model.encode(text_input).tolist()


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


async def fetch_subsidies_from_api():
    today = date.today()
    params = {
        "token": SMES_TOKEN,
        "strDt": today.strftime("%Y%m%d"),
        "endDt": "20261231",
        "html": "no"
    }
    try:
        response = requests.get(SMES_API_URL, params=params, timeout=30)
        data = response.json()
        if data.get("resultCd") != "0":
            print(f"API 오류: {data.get('resultMsg')}")
            return []
        return data.get("data", [])
    except Exception as e:
        print(f"API 호출 오류: {e}")
        return []


def parse_subsidy(item: dict) -> dict:
    return {
        "name": item.get("pblancNm"),
        "organization": item.get("sportInsttNm"),
        "region": item.get("areaNm") or None,
        "industry": item.get("induty") or None,
        "min_age": item.get("minRpsntAge") or None,
        "max_age": item.get("maxRpsntAge") or None,
        "max_amount": item.get("maxSportAmt") or None,
        "deadline": item.get("pblancEndDt") or None,
        "description": item.get("sportCnts") or item.get("policyCnts"),
        "apply_url": item.get("reqstLinkInfo") or item.get("pblancDtlUrl"),
    }


async def save_subsidy(data: dict, source_url: str, db: AsyncSession):
    embed_text = f"{data['name']} {data.get('description', '') or ''} {data.get('industry', '') or ''}"
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

    print("중소벤처24 API 호출 중...")
    items = await fetch_subsidies_from_api()

    success = 0
    for item in items:
        try:
            source_url = item.get("pblancDtlUrl")
            if not source_url:
                continue
            data = parse_subsidy(item)
            await save_subsidy(data, source_url, db)
            success += 1
        except Exception as e:
            print(f"저장 오류 ({item.get('pblancNm')}): {e}")

    print(f"총 {success}/{len(items)}건 저장 완료")