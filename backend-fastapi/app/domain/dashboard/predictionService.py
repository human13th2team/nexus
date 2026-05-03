import os
# TimesFM(JAX)을 CPU 모드로 강제 설정
os.environ["JAX_PLATFORM_NAME"] = "cpu"

import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing
try:
    import timesfm
except ImportError:
    timesfm = None
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any
import uuid
import datetime
from app.models import Prediction, DailyPrediction, Sale
import logging

logger = logging.getLogger(__name__)

async def fetchSalesData(userId: uuid.UUID, db: AsyncSession) -> pd.DataFrame:
    """DB에서 최근 매출 데이터를 조회하여 DataFrame으로 반환합니다."""
    query = text("""
        SELECT sales_date as date, total_amount as actual 
        FROM sales WHERE user_id = :uid ORDER BY sales_date ASC
    """)
    result = await db.execute(query, {"uid": userId})
    rows = result.fetchall()
    
    if len(rows) < 2:
        raise ValueError("분석을 위한 데이터가 충분하지 않습니다. (최소 2건 필요)")
        
    df = pd.DataFrame(rows, columns=['date', 'actual'])
    # 날짜 정제: 시간대 정보를 완전히 제거하여 Naive 상태로 만듦
    df['date'] = pd.to_datetime(df['date']).dt.tz_localize(None)
    df['actual'] = df['actual'].astype(float)
    return df

# TimesFM 모델 전역 캐시 (CPU 모드 로딩은 시간이 걸리므로 처음 한 번만 수행)
_tfm_model = None

async def getTimesFmModel(context_len: int, horizon_len: int):
    """HuggingFace에서 TimesFM 모델을 로드하여 반환합니다 (싱글톤 패턴)."""
    global _tfm_model
    if _tfm_model is None:
        if timesfm is None:
            return None
        
        try:
            logger.info("HuggingFace에서 TimesFM 모델 로딩 중 (google/timesfm-1.0-200m)...")
            # 1. 모델 아키텍처 초기화
            _tfm_model = timesfm.TimesFm(
                context_len=512, # 최대 컨텍스트 길이
                horizon_len=30,  # 예측 길이
                input_patch_len=32,
                output_patch_len=128,
                model_dims=64,
                backend="cpu", # CPU 모드 강제
            )
            # 2. HuggingFace 체크포인트 로드
            # repo_id를 통해 자동으로 최신 모델 가중치를 다운로드 및 캐싱합니다.
            _tfm_model.load_from_checkpoint(repo_id="google/timesfm-1.0-200m")
            logger.info("TimesFM 모델 로딩 완료.")
        except Exception as e:
            logger.error(f"TimesFM 모델 로딩 실패: {str(e)}")
            _tfm_model = None
            
    return _tfm_model

async def predictWithTimesFm(df: pd.DataFrame) -> Dict[str, Any]:
    """HuggingFace TimesFM 모델을 사용하여 장기 매출 예측을 수행합니다."""
    # 1. 모델 가져오기
    tfm = await getTimesFmModel(context_len=512, horizon_len=30)
    
    if tfm is None:
        logger.warning("TimesFM 모델을 사용할 수 없습니다. 폴백 로직을 실행합니다.")
        return {"forecastList": [float(df['actual'].iloc[-1])] * 7, "method": "TimesFM (모델 로드 실패)"}

    try:
        # 2. 데이터 준비
        # TimesFM은 정규화된 시계열 데이터를 입력으로 받음
        actual_values = df['actual'].values.astype(np.float32)
        
        # 3. 추론 실행
        # inputs: 시계열 리스트, freq: 주계열 빈도 (0은 매일/연속 데이터 의미)
        point_forecast, _, _ = tfm.forecast(
            inputs=[actual_values],
            freq=[0] 
        )
        
        # 첫 번째 시계열의 예측값 추출 (30일치)
        forecast_list = point_forecast[0].tolist()
        
        return {
            "forecastList": [max(0, int(v)) for v in forecast_list],
            "method": "TimesFM (HuggingFace AI 분석)"
        }
    except Exception as e:
        logger.error(f"TimesFM 추론 중 오류 발생: {str(e)}")
        return {"forecastList": [float(df['actual'].iloc[-1])] * 7, "method": "TimesFM (추론 오류 폴백)"}

def analyzeStatistics(df: pd.DataFrame) -> Dict[str, Any]:
    """매출 데이터의 통계치(이동평균, 변동률)를 계산합니다."""
    df['movingAverage'] = df['actual'].rolling(window=min(7, len(df))).mean()
    df['returnRate'] = df['actual'].pct_change() * 100
    
    currentMa = df['movingAverage'].iloc[-1] if not pd.isna(df['movingAverage'].iloc[-1]) else df['actual'].mean()
    currentReturnRate = df['returnRate'].iloc[-1] if not pd.isna(df['returnRate'].iloc[-1]) else 0.0
    
    return {
        "currentMa": float(currentMa),
        "currentReturnRate": float(currentReturnRate)
    }

async def generatePrediction(df: pd.DataFrame) -> Dict[str, Any]:
    """데이터 기간에 따라 최적의 모델을 선택하여 매출을 예측합니다."""
    n_days = len(df)
    forecast_list = []
    method = ""
    
    try:
        if n_days < 30:
            # 1. 초단기 (< 30일): 단순 지수 평활법
            model = SimpleExpSmoothing(df['actual'], initialization_method="estimated").fit()
            method = "최근 추세 분석"
            df['exponentialSmoothing'] = model.fittedvalues
            forecast = model.forecast(1)
            forecast_list = [max(0, int(forecast.iloc[0]))]
            logger.info(f"Short-term model ({method}) applied.")
            
        elif n_days < 365:
            # 2. 중기 (30일 ~ 1년): 홀트-윈터스 (요일 반영)
            model = ExponentialSmoothing(
                df['actual'], 
                seasonal_periods=7, 
                trend='add', 
                seasonal='add',
                initialization_method="estimated"
            ).fit()
            method = "요일 패턴 분석"
            df['exponentialSmoothing'] = model.fittedvalues
            forecast = model.forecast(1)
            forecast_list = [max(0, int(forecast.iloc[0]))]
            logger.info(f"Medium-term model ({method}) applied.")
            
        else:
            # 3. 장기 (>= 1년): TimesFM 적용
            tfm_res = await predictWithTimesFm(df)
            forecast_list = tfm_res["forecastList"]
            method = tfm_res["method"]
            # 기존 이동평균 및 통계 유지를 위해 필요한 컬럼 채우기
            # TimesFM 사용 시 과거 피팅값은 ExponentialSmoothing으로 대체하여 대시보드 호환성 유지
            model = ExponentialSmoothing(
                df['actual'], 
                seasonal_periods=7, 
                trend='add', 
                seasonal='add',
                initialization_method="estimated"
            ).fit()
            df['exponentialSmoothing'] = model.fittedvalues
            logger.info(f"Long-term model ({method}) applied.")
            
    except Exception as e:
        logger.warning(f"Prediction modeling failed ({str(e)}). Falling back to SES.")
        model = SimpleExpSmoothing(df['actual'], initialization_method="estimated").fit()
        method = "최근 추세 분석 (시스템 폴백)"
        df['exponentialSmoothing'] = model.fittedvalues
        forecast = model.forecast(1)
        forecast_list = [max(0, int(forecast.iloc[0]))]

    lastDate = df['date'].iloc[-1]
    nextDate = lastDate + datetime.timedelta(days=1)
    
    return {
        "forecastValue": forecast_list[0] if forecast_list else 0,
        "forecastList": forecast_list,
        "nextDate": nextDate.strftime('%Y-%m-%d'),
        "method": method
    }

async def persistAnalysisResults(
    userId: uuid.UUID, df: pd.DataFrame, stats: Dict[str, Any], 
    pred: Dict[str, Any], db: AsyncSession
) -> Prediction:
    """분석 및 예측 결과를 DB에 저장합니다. 미래 예측치도 함께 저장합니다."""
    nowNaive = datetime.datetime.now().replace(tzinfo=None)
    
    # 1. Prediction 마스터 정보 저장
    newPred = Prediction(
        id=uuid.uuid4(), user_id=userId, base_date=nowNaive,
        total_sales=int(df['actual'].iloc[-1]), # 마지막 실제 매출
        predicted_cost=pred["forecastValue"],   # 대표 예측값 (익일 등)
        moving_average=stats["currentMa"], 
        return_rate=stats["currentReturnRate"]
    )
    db.add(newPred)
    await db.flush()

    # 2. 과거 데이터 저장 (이동평균 등 분석 포함)
    for _, row in df.iterrows():
        pureDate = row['date']
        if hasattr(pureDate, 'to_pydatetime'):
            pureDate = pureDate.to_pydatetime().replace(tzinfo=None)
        elif hasattr(pureDate, 'replace'):
            pureDate = pureDate.replace(tzinfo=None)
            
        daily = DailyPrediction(
            id=uuid.uuid4(), prediction_id=newPred.id, target_date=pureDate,
            pred_sales=int(row['exponentialSmoothing']), 
            actual_sales=int(row['actual']),
            moving_average=float(row['movingAverage']) if not pd.isna(row['movingAverage']) else None,
            return_rate=float(row['returnRate']) if not pd.isna(row['returnRate']) else None
        )
        db.add(daily)
    
    # 3. 미래 예측 데이터 저장 (TimesFM 등으로 계산된 미래 N일치)
    if "forecastList" in pred and len(pred["forecastList"]) > 0:
        lastDate = df['date'].iloc[-1]
        for i, val in enumerate(pred["forecastList"]):
            # 첫 번째 값은 이미 pred_sales에 포함된 익일로 간주하거나, 
            # 루프를 통해 명시적으로 미래 날짜들 저장
            futureDate = (lastDate + datetime.timedelta(days=i+1)).replace(tzinfo=None)
            
            # 미래 데이터는 실제 매출이 없으므로 actual_sales는 None
            futureDaily = DailyPrediction(
                id=uuid.uuid4(), prediction_id=newPred.id, target_date=futureDate,
                pred_sales=int(val),
                actual_sales=None,
                moving_average=None,
                return_rate=None
            )
            db.add(futureDaily)
    
    await db.commit()
    return newPred

async def getAnalysisFromDb(userId: str, db: AsyncSession) -> Dict[str, Any]:
    """메인 분석 프로세스: 프론트엔드 요구사항 및 Schema에 맞춰 반환합니다."""
    try:
        userUuid = uuid.UUID(userId)
        df = await fetchSalesData(userUuid, db)
        stats = analyzeStatistics(df)
        # generatePrediction이 async로 변경되었으므로 await 추가
        pred = await generatePrediction(df)
        await persistAnalysisResults(userUuid, df, stats, pred, db)
        
        return {
            "predictedSales": pred["forecastValue"],
            "predictionDate": pred["nextDate"],
            "analysisData": [
                {
                    "date": str(r['date'].date() if hasattr(r['date'], 'date') else r['date']), 
                    "actual": int(r['actual']),
                    "movingAverage": float(r['movingAverage']) if not pd.isna(r['movingAverage']) else None,
                    "returnRate": float(r['returnRate']) if not pd.isna(r['returnRate']) else None
                } 
                for _, r in df.iterrows()
            ],
            "analysisReport": (
                f"분석 기법: {pred['method']}. "
                f"최근 7일간의 이동평균은 {stats['currentMa']:,.0f}원이며, 현재 매출 변동률은 {stats['currentReturnRate']:.2f}%입니다. "
                "(참고: 모든 매출 데이터는 시간 정보를 배제하고 일자별로 분석되었습니다.)"
            ),
            "predictionMethod": pred['method'],
            "movingAverage": stats['currentMa'],
            "returnRate": stats['currentReturnRate']
        }
    except Exception as e:
        logger.error(f"분석 서비스 최종 오류: {str(e)}")
        await db.rollback()
        raise e
