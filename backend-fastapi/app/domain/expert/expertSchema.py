from pydantic import BaseModel
from typing import Optional, List

class ExpertMatchRequestBase(BaseModel):
    industry_category_id: Optional[str] = None
    request_content: str

class MatchedExpertItem(BaseModel):
    matched_expert_id: Optional[str] = None
    expert_name: Optional[str] = None
    match_reason: str

class ExpertMatchResponse(BaseModel):
    matches: List[MatchedExpertItem]
