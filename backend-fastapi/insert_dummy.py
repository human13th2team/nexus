import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def insert():
    async with AsyncSessionLocal() as db:
        await db.execute(text("INSERT INTO users (id, nickname, email, passwd, created_at) VALUES ('123e4567-e89b-12d3-a456-426614174000', 'dummy', 'dummy@test.com', '123', NOW()) ON CONFLICT DO NOTHING"))
        await db.commit()
        print('Dummy user inserted')

asyncio.run(insert())
