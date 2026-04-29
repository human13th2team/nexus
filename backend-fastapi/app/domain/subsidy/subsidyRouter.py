from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.database import get_db
from app.domain.subsidy.subsidySchema import SubsidyFilterRequest, SubsidyListResponse
from app.domain.subsidy.subsidyService import (
    get_subsidies,
    collect_subsidies
)

router = APIRouter()

@router.post("/recommend", response_model=SubsidyListResponse)
async def recommend_subsidies(
        request: SubsidyFilterRequest,
        db: AsyncSession = Depends(get_db)
):
    total, rows = await get_subsidies(
        db,
        region=request.region,
        industry=request.industry,
        age=request.age,
        query=request.query,
        page=request.page,
        size=request.size
    )
    return SubsidyListResponse(
        total=total,
        page=request.page,
        size=request.size,
        data=[dict(row._mapping) for row in rows]
    )

@router.post("/collect")
async def trigger_collect(db: AsyncSession = Depends(get_db)):
    await collect_subsidies(db)
    return {"message": "지원금 수집 완료"}

scheduler = AsyncIOScheduler()

def start_scheduler(db_getter):
    async def job():
        async for db in db_getter():
            await collect_subsidies(db)
    scheduler.add_job(job, "cron", hour=3)
    scheduler.start()