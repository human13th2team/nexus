import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base, AsyncSessionLocal, get_db
from app.core.ai_client import get_ai_client
from app.domain.branding.brandingService import initialize_industry_cache

# 도메인별 라우터 임포트 (존재하는 폴더만)
from app.domain.auth import authRouter as auth
from app.domain.branding import brandingRouter as branding
from app.domain.community import communityRouter as community
from app.domain.compliance import complianceRouter as compliance
from app.domain.dashboard import dashboardRouter as dashboard
from app.domain.simulation import simulationRouter as simulation
from app.domain.subsidy import subsidyRouter as subsidy

# 스케쥴러 임포트
from app.domain.subsidy.subsidyRouter import start_scheduler as subsidy_start_scheduler

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 실행될 로직
    print("🚀 Nexus API Server 시작 중...")
    
    # 1. AI 임베딩 모델 프리로딩
    get_ai_client("gemini") 
    
    # 2. 업종 카테고리 데이터 캐싱
    async with AsyncSessionLocal() as db:
        await initialize_industry_cache(db)

    # 3. 지원금찾기 데이터 오전 3시 스케쥴
    subsidy_start_scheduler(get_db)

    yield
    # 서버 종료 시 실행될 로직
    print("👋 Nexus API Server 종료 중...")

app = FastAPI(
    title="Nexus API Server",
    description="Nexus 프로젝트를 위한 통합 API 서버입니다. AI 및 데이터 분석 로직을 담당합니다.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(branding.router, prefix="/api/v1/branding", tags=["Branding"])
app.include_router(community.router, prefix="/api/v1/community", tags=["Community"])
app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["Compliance"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["Simulation"])
app.include_router(subsidy.router, prefix="/api/v1/subsidy", tags=["Subsidy"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Nexus API Server (FastAPI)",
        "docs": "/docs",
        "health": "OK"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
