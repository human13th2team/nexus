import asyncio
import os
import sys

# 프로젝트 루트(backend-fastapi)를 path에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_data():
    try:
        async with AsyncSessionLocal() as db:
            # 전문가와 유저가 제대로 연결되어 있는지 확인
            res = await db.execute(text("SELECT count(*) FROM expert_profiles ep JOIN users u ON ep.user_id = u.id"))
            count = res.scalar()
            print(f"DEBUG_EXPERT_COUNT: {count}")
            
            # 실제 데이터 샘플 확인
            res = await db.execute(text("SELECT u.nickname, ep.portfolio_text FROM expert_profiles ep JOIN users u ON ep.user_id = u.id LIMIT 5"))
            rows = res.fetchall()
            for i, row in enumerate(rows):
                print(f"DEBUG_SAMPLE_{i}: {row.nickname}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
