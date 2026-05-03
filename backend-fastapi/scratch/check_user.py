import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_user():
    try:
        async with AsyncSessionLocal() as db:
            user_id = '123e4567-e89b-12d3-a456-426614174000'
            res = await db.execute(text(f"SELECT count(*) FROM users WHERE id = '{user_id}'"))
            count = res.scalar()
            print(f"USER_EXISTS: {count}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_user())
