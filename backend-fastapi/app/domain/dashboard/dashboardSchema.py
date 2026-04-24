from pydantic import BaseModel, Field
from typing import List, Optional

class ReceiptItemSchema(BaseModel):
    name: str = Field(..., description="품목명")
    price: int = Field(0, description="단가")
    quantity: int = Field(1, description="수량")

class ReceiptDataSchema(BaseModel):
    saleNo: Optional[str] = Field(None, alias="sale_no", description="거래 번호")
    totalPrice: int = Field(0, alias="total_price", description="총 금액")
    transactionDate: Optional[str] = Field(None, description="거래 일시 (YYYY-MM-DD HH:MM:SS)")
    items: List[ReceiptItemSchema] = Field(default_factory=list, description="상세 품목 리스트")

    class Config:
        populate_by_name = True

class ReceiptResponseSchema(BaseModel):
    status: str
    data: ReceiptDataSchema
