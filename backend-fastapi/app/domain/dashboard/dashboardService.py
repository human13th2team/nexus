import pytesseract
from PIL import Image
import io
import ollama
import json
import datetime
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from app.models import Sale, SaleItem
from app.domain.dashboard.dashboardSchema import ReceiptDataSchema

# 컨벤션에 따른 로거 설정
logger = logging.getLogger(__name__)

async def processReceipt(content: bytes, userId: str, db: AsyncSession) -> Dict[str, Any]:
    """
    영수증 분석 및 DB 적재 프로세스 (Fallback 로직 포함)
    """
    try:
        # 1단계: OCR 실행
        ocrText = await performOcr(content)
        
        # 2단계: 메인 모델(gemma4:e2b)로 데이터 추출 시도
        extractedRaw = await extractJsonWithLlM(ocrText, modelName='gemma4:e2b')
        
        # 품목 인식 실패 시 Fallback (llama3 모델 가동)
        if not extractedRaw.get("items") or len(extractedRaw.get("items", [])) == 0:
            logger.warning("gemma4:e2b 모델이 품목 인식에 실패했습니다. 대체 모델(llama3)로 재시도합니다.")
            extractedRaw = await extractJsonWithLlM(ocrText, modelName='llama3')
            
            if not extractedRaw.get("items"):
                logger.error("모든 AI 모델이 영수증 상세 품목을 인식하는 데 실패했습니다.")
                raise ValueError("영수증 상세 내역을 추출할 수 없습니다. 이미지를 확인해주세요.")

        # 3단계: Pydantic 모델 파싱 및 DB 저장 트랜잭션 실행
        receiptObj = ReceiptDataSchema(**extractedRaw)
        await saveReceiptTransaction(userId, receiptObj, db)
        
        return receiptObj.model_dump(by_alias=True)

    except Exception as e:
        logger.error(f"영수증 프로세스 최종 실패: {str(e)}")
        raise e

async def saveReceiptTransaction(userId: str, data: ReceiptDataSchema, db: AsyncSession) -> None:
    """메인-상세(1:N) 테이블 매핑 및 트랜잭션 처리"""
    try:
        userUuid = uuid.UUID(userId)
        salesDate = _parseDate(data.transactionDate)

        # Sale (메인 테이블) 생성
        newSale = Sale(
            id=uuid.uuid4(),
            user_id=userUuid,
            sales_date=salesDate,
            total_amount=data.totalPrice,
            file_url=data.saleNo
        )
        db.add(newSale)
        
        # PK 사전 발급 (Flush)
        await db.flush()
        saleId = newSale.id

        # SaleItem (상세 테이블) 반복문 처리
        for item in data.items:
            db.add(SaleItem(
                id=uuid.uuid4(),
                sale_id=saleId,
                item_name=item.name,
                price=item.price,
                quantity=item.quantity
            ))
        
        await db.commit()
        logger.info(f"성공적으로 DB에 적재되었습니다. (Sale ID: {saleId})")

    except Exception as e:
        await db.rollback()
        raise e

async def performOcr(content: bytes) -> str:
    """Tesseract OCR을 사용하여 이미지에서 텍스트를 추출합니다."""
    image = Image.open(io.BytesIO(content))
    return pytesseract.image_to_string(image, lang='kor+eng')

async def extractJsonWithLlM(ocrText: str, modelName: str = 'gemma4:e2b') -> Dict[str, Any]:
    """지정된 Ollama 모델을 사용하여 OCR 텍스트를 JSON으로 정형화합니다."""
    prompt = f"""
    당신은 영수증 분석 전문가입니다. 아래 OCR 텍스트에서 정보를 추출하여 JSON으로만 응답하세요.
    키값: 'sale_no', 'total_price', 'transactionDate', 'items' (name, price, quantity)
    
    [OCR 텍스트]
    {ocrText}
    """
    try:
        response = ollama.generate(model=modelName, prompt=prompt, format='json')
        return json.loads(response['response'])
    except Exception as e:
        logger.error(f"모델({modelName}) 호출 오류: {str(e)}")
        return {}

def _parseDate(dateStr: Optional[str]) -> datetime.datetime:
    """날짜 문자열 파싱 유틸리티"""
    try:
        return datetime.datetime.strptime(dateStr, "%Y-%m-%d %H:%M:%S")
    except:
        return datetime.datetime.now()
