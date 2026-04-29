from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date

class SubsidyFilterRequest(BaseModel):
    region: Optional[str] = None      # 지역
    industry: Optional[str] = None    # 업종
    age: Optional[int] = None         # 나이
    query: Optional[str] = None       # 벡터 검색
    page: int = 1
    size: int = 10

class SubsidyCardResponse(BaseModel):
    id: UUID
    name: str                          # 지원금명
    organization: str                  # 주관기관
    region: Optional[str]             # 지역
    industry: Optional[str]           # 업종
    min_age: Optional[int]            # 최소 나이
    max_age: Optional[int]            # 최대 나이
    max_amount: Optional[int]         # 지원금액
    deadline: Optional[date]          # 마감일
    description: str                   # 상세 설명
    apply_url: Optional[str]          # 신청 링크

class SubsidyListResponse(BaseModel):
    total: int
    page: int
    size: int
    data: list[SubsidyCardResponse]