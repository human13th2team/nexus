from fastapi import APIRouter, UploadFile, File
from typing import List
import os
import uuid
import shutil

router = APIRouter()

# 저장 경로 설정 (main.py에서 생성됨)
UPLOAD_DIR = "app/static/community"

@router.get("/")
async def get_root():
    return {"message": "Hyper-local Community Domain API"}

@router.post("/upload")
async def upload_community_images(files: List[UploadFile] = File(...)):
    """커뮤니티 게시글 이미지 업로드"""
    uploaded_urls = []
    
    try:
        for file in files:
            # 고유한 파일명 생성
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            # 파일 저장
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # 접근 가능한 URL 추가 (FastAPI 서버 주소 기준)
            # 클라이언트에서는 http://localhost:8000/static/community/파일명 으로 접근
            uploaded_urls.append(f"http://localhost:8000/static/community/{unique_filename}")
            
        return {
            "status": "success",
            "message": f"{len(uploaded_urls)}개의 이미지가 업로드되었습니다.",
            "urls": uploaded_urls
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"이미지 업로드 중 오류 발생: {str(e)}"
        }
