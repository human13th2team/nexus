from fastapi import FastAPI, HTTPException
import httpx
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="FastAPI Team Project Template",
    description="팀 프로젝트를 위한 FastAPI 기반 서버입니다. Swagger는 /docs에서 확인 가능합니다.",
    version="1.0.0"
)

# Spring Boot 서버 주소 (8080)
SPRING_BOOT_URL = "http://localhost:8080"

class MessageBody(BaseModel):
    message: str
    sender: Optional[str] = "FastAPI"

@app.get("/")
async def root():
    return {"message": "FastAPI Server is running!"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "fastapi"}

@app.post("/receive-from-spring")
async def receive_from_spring(data: MessageBody):
    """Spring Boot로부터 데이터를 받는 엔드포인트"""
    print(f"Received message from Spring Boot: {data.message}")
    return {"status": "success", "received": data.message, "responded_by": "FastAPI"}

@app.get("/call-spring")
async def call_spring():
    """Spring Boot 서버의 헬스체크 API를 호출하여 데이터를 가져옴"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SPRING_BOOT_URL}/health")
            if response.status_code == 200:
                return {"status": "success", "spring_response": response.json()}
            else:
                return {"status": "error", "message": f"Spring Boot returned status {response.status_code}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Spring Boot: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
