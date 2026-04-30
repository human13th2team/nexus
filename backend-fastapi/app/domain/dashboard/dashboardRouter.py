from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.core.database import get_db
from app.domain.dashboard.dashboardService import processReceipt
from app.domain.dashboard.dashboardSchema import ReceiptResponseSchema

router = APIRouter()

@router.get("/")
async def get_root() -> Dict[str, str]:
    return {"message": "Ops & Dashboard Domain API"}

@router.post("/upload-receipt", response_model=ReceiptResponseSchema)
async def upload_receipt(
    file: UploadFile = File(...),
    user_id: str = "3394857b-7033-4f96-8095-2022830f785b", # TODO: 인증 연동 필요
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    영수증 이미지를 업로드하여 분석하고 데이터를 저장합니다.
    """
    try:
        content = await file.read()
        result = await processReceipt(content, user_id, db)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
