from typing import List, Optional

from pydantic import BaseModel


class PredictionDetailSchema(BaseModel):
    amount: int
    date: str
    confidence: float


class DailyStatSchema(BaseModel):
    date: str
    actual: int
    movingAverage: Optional[float] = None
    returnRate: Optional[float] = None




class PredictionDataSchema(BaseModel):
    predictedSales: int
    predictionDate: str
    analysisData: List[DailyStatSchema]
    analysisReport: str
    predictionMethod: Optional[str] = None
    movingAverage: Optional[float] = None
    returnRate: Optional[float] = None




class PredictionResponseSchema(BaseModel):
    status: str
    data: PredictionDataSchema
