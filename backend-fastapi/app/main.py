from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import os
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from app.domain.auth import authRouter as auth
from app.domain.branding import brandingRouter as branding
from app.domain.simulation import simulationRouter as simulation
from app.domain.compliance import complianceRouter as compliance
from app.domain.community import communityRouter as community
from app.domain.dashboard import dashboardRouter as dashboard
from app.core.database import get_db

app = FastAPI(
    title="Nexus API Server",
    description="Nexus 프로젝트를 위한 통합 API 서버입니다. MSA 구조의 개별 도메인 로직을 담당합니다.",
    version="1.0.0"
)

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실 운영 시에는 특정 도메인으로 제한 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 설정 (로고 이미지 등)
static_logos_path = "app/static/logos"
if not os.path.exists(static_logos_path):
    os.makedirs(static_logos_path)
app.mount("/static/logos", StaticFiles(directory=static_logos_path), name="logos")

# Spring Boot 서버 주소 (8080)
SPRING_BOOT_URL = "http://localhost:8080"

# 도메인별 라우터 등록
app.include_router(auth.router, prefix="/api/v1/ai/auth", tags=["Authentication"])
app.include_router(branding.router, prefix="/api/v1/ai/branding", tags=["AI Branding"])
app.include_router(simulation.router, prefix="/api/v1/ai/simulation", tags=["Startup Simulation"])
app.include_router(compliance.router, prefix="/api/v1/ai/compliance", tags=["Compliance & Policy"])
app.include_router(community.router, prefix="/api/v1/ai/community", tags=["Hyper-local Community"])
app.include_router(dashboard.router, prefix="/api/v1/ai/dashboard", tags=["Ops & Dashboard"])

@app.get("/")
async def root():
    return {"message": "Nexus FastAPI Server is running!"}

@app.get("/health")
async def health_check(db=Depends(get_db)):
    try:
        # DB 연결 확인
        await db.execute(text("SELECT 1"))
        return {
            "status": "UP",
            "message": "Nexus FastAPI Server is running.",
            "database": "CONNECTED"
        }
    except Exception as e:
        return {
            "status": "UP",
            "database": "DISCONNECTED",
            "error": str(e)
        }

@app.get("/call-spring")
async def call_spring():
    """Spring Boot 서버의 헬스체크 API를 호출하여 데이터를 가져옴"""
    async with httpx.AsyncClient() as client:
        try:
            # Spring Boot의 새로운 상태 확인 API 호출 (/api/v1/status/check)
            response = await client.get(f"{SPRING_BOOT_URL}/api/v1/status/check")
            if response.status_code == 200:
                return {"status": "success", "spring_response": response.json()}
            else:
                return {"status": "error", "message": f"Spring Boot returned status {response.status_code}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Spring Boot: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
