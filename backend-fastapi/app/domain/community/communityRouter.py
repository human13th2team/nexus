from fastapi import APIRouter, UploadFile, File
from app.domain.community import communityService
from typing import List

router = APIRouter()

@router.get("/")
async def get_root():
    return {"message": "Hyper-local Community Domain API"}

@router.post("/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    urls = await communityService.save_board_images(files)
    return {"status": "success", "urls": urls}
