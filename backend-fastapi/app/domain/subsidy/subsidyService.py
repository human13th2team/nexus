import requests
import os
import re

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.ai_client import GeminiClient
from dotenv import load_dotenv
from datetime import date, timedelta, datetime

load_dotenv()

SMES_API_URL = "https://www.smes.go.kr/fnct/apiReqst/extPblancInfo"
SMES_TOKEN = os.getenv("SMES_API_TOKEN")

def get_embedding(text_input: str):
    return GeminiClient._local_model.encode(text_input).tolist()

async def get_subsidies(
        db: AsyncSession,
        region: str = None,
        query: str = None,
        page: int = 1,
        size: int = 10
):
    conditions = ["is_active = true"]
    params = {}

    if region:
        conditions.append("(region ILIKE :region OR region IS NULL)")
        params["region"] = f"%{region}%"

    where = "WHERE " + " AND ".join(conditions)

    if query:
        query_embedding = get_embedding(query)
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        params["query_embedding"] = embedding_str
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
        SELECT id, name, organization, region,
               max_amount, deadline, description, apply_url
        FROM subsidies {where}
        {order}
        LIMIT :limit OFFSET :offset
    """
    result = await db.execute(text(data_sql), params)
    rows = result.fetchall()

    return total, rows

async def fetch_subsidies_from_api():
    today = date.today()
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y%m%d")
    params = {
        "token": SMES_TOKEN,
        "strDt": yesterday,
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

def extract_region_from_name(name: str) -> str | None:
    match = re.match(r'^[\[\(]([^\]\)]+)[\]\)]', name)
    return match.group(1) if match else None


def parse_subsidy(item: dict) -> tuple:
    pblanc_seq = item.get("pblancSeq")
    source_url = f"https://www.smes.go.kr/pblanc/{pblanc_seq}"

    biz_type = item.get("bizType", "")
    life_cycl = item.get("lifeCyclDvsn", "")
    if "창업" not in biz_type and "창업" not in life_cycl:
        return None, None

    name = item.get("pblancNm", "")
    region = item.get("areaNm") or extract_region_from_name(name) or None

    min_age_raw = item.get("minRpsntAge")
    max_age_raw = item.get("maxRpsntAge")

    return {
        "name": name,
        "organization": item.get("sportInsttNm"),
        "region": region,
        "industry": item.get("induty") or None,
        "min_age": int(min_age_raw) if min_age_raw else None,
        "max_age": int(max_age_raw) if max_age_raw else None,
        "max_amount": item.get("maxSportAmt") or None,
        "deadline": item.get("pblancEndDt") or None,
        "start_date": item.get("pblancBgnDt") or None,
        "description": item.get("policyCnts") or None,
        "support_content": item.get("sportCnts") or None,
        "target": item.get("sportTrget") or None,
        "how_to_apply": item.get("reqstRcept") or None,
        "contact": item.get("refrnc") or None,
        "apply_url": item.get("reqstLinkInfo") or item.get("pblancDtlUrl"),
    }, source_url

async def save_subsidy(data: dict, source_url: str, db: AsyncSession):
    try:
        embed_text = f"{data['name']} {data.get('description', '') or ''} {data.get('support_content', '') or ''} {data.get('industry', '') or ''}"
        embedding = get_embedding(embed_text)

        deadline = data.get("deadline")
        if deadline and isinstance(deadline, str):
            deadline = datetime.strptime(deadline, "%Y-%m-%d").date()

        start_date = data.get("start_date")
        if start_date and isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        embedding_str = "[" + ",".join(map(str, embedding)) + "]"

        await db.execute(
            text(f"""
                INSERT INTO subsidies
                    (name, organization, region, industry, min_age, max_age,
                     max_amount, deadline, start_date, description, support_content,
                     target, how_to_apply, contact, apply_url, source_url, embedding)
                VALUES
                    (:name, :organization, :region, :industry, :min_age, :max_age,
                     :max_amount, :deadline, :start_date, :description, :support_content,
                     :target, :how_to_apply, :contact, :apply_url, :source_url, '{embedding_str}'::vector)
                ON CONFLICT (source_url) DO UPDATE SET
                    deadline = EXCLUDED.deadline,
                    description = EXCLUDED.description,
                    support_content = EXCLUDED.support_content,
                    target = EXCLUDED.target,
                    how_to_apply = EXCLUDED.how_to_apply,
                    contact = EXCLUDED.contact,
                    updated_at = NOW()
            """),
            {**data, "deadline": deadline, "start_date": start_date, "source_url": source_url}
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise e

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
    fail = 0
    for item in items:
        try:
            data, source_url = parse_subsidy(item)
            if data is None:
                continue
            await save_subsidy(data, source_url, db)
            success += 1
        except Exception as e:
            fail += 1
            print(f"저장 오류 ({item.get('pblancNm')}): {e}")

    print(f"총 {success}/{len(items)}건 저장 완료, 실패 {fail}건")