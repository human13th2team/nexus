import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_embeddings():
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(text("SELECT count(*) FROM expert_profiles WHERE embedding IS NOT NULL"))
            count = res.scalar()
            print(f"DEBUG_EMBEDDING_COUNT: {count}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_embeddings())
