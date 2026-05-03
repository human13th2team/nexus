import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def list_categories():
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(text("SELECT id, name FROM industry_categories WHERE level = 1 LIMIT 10"))
            rows = res.fetchall()
            for row in rows:
                print(f"CATEGORY: {row.name} | ID: {row.id}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(list_categories())
