import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_schema():
    try:
        async with AsyncSessionLocal() as db:
            # expert_match_requests 테이블의 컬럼 확인 (PostgreSQL)
            res = await db.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'expert_match_requests'
            """))
            rows = res.fetchall()
            print("--- SCHEMA: expert_match_requests ---")
            for row in rows:
                print(f"COLUMN: {row.column_name} | TYPE: {row.data_type}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_schema())
