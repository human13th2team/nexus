from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from xgboost import XGBClassifier
from sqlalchemy import select
from huggingface_hub import hf_hub_download
from app.domain.simulation.simulationSchema import PredictionRequest, PredictionResponse
import os
import json
import joblib
import pickle
import numpy as np
import pandas as pd
import unicodedata
from app.models import RegionCode, AdministrativeBoundary

# 1. 환경 변수 설정 (이미 되어 있다면 생략)
REPO_ID = os.environ.get("HF_REPO_ID")
TOKEN = os.environ.get("HF_TOKEN")

# 2. 메타데이터 먼저 로드 (여기에 모델 파일 이름이 들어있음)
meta_path = hf_hub_download(
    repo_id=REPO_ID,
    filename="best_model_v7_metadata.joblib", # 파일명 v7로 변경
    token=TOKEN
)
_bundle = joblib.load(meta_path)

# 3. 메타데이터에서 정보 추출
_freq_map         = _bundle["freq_map"]        # 구/동 빈도수
_industry_map     = _bundle["업종_매핑"]       # KeyError: 'industry_map' 해결
_industry_columns = _bundle["업종_columns"]    # '업종_...' 원핫 컬럼 리스트
_best_model_name  = _bundle["best_model_name"] # 모델명
_core_model_file  = _bundle["core_model_path"] # 실제 모델 파일 경로
FEATURE_ORDER     = _bundle["feature_names"]

# 4. 핵심 모델 파일(.json) 다운로드 및 복원
model_core_path = hf_hub_download(
    repo_id=REPO_ID,
    filename=_core_model_file,
    token=TOKEN
)

# 5. 모델 객체 재생성
if _best_model_name == 'XGBoost':
    # XGBoost는 빈 객체 생성 후 load_model을 해야 바이너리 에러가 안 납니다.
    _model = XGBClassifier()
    _model.load_model(model_core_path)
    # sklearn wrapper 호환성을 위해 n_classes_ 수동 설정 (binary)
    _model.n_classes_ = 2
else:
    # RandomForest 등은 joblib으로 바로 로드
    _model = joblib.load(model_core_path)

SUCCESS_THRESHOLD = 0.35 # 사용자님 설정값 유지
THRESHOLD = SUCCESS_THRESHOLD

# 업종 리스트 생성 (프론트엔드 매핑을 위해 '업종_' 접두사 제거)
_industry_list = [v.replace("업종_", "") for v in set(_industry_map.values())]

print(f"✅ {_best_model_name} 모델 및 메타데이터 로드 완료!")

def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)

def _centroid(boundary) -> tuple[float, float]:
    coords = boundary[0] if isinstance(boundary[0][0], list) else boundary
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    return float(np.mean(xs)), float(np.mean(ys))

def _build_features(
    cx: float, cy: float,
    gu: str, dong: str,
    industry: str,
    open_date: date,
    region_code: int = 0,
) -> pd.DataFrame:
    gu_freq   = _freq_map["구"].get(gu, 0.0)
    dong_freq = _freq_map["동"].get(dong, 0.0)

    dt        = pd.Timestamp(open_date)
    month     = dt.month
    dayofweek = dt.dayofweek + 1

    row = {
        "개방자치단체코드": region_code,
        "X_log":     np.log1p(max(cx, 0)),
        "Y_log":     np.log1p(max(cy, 0)),
        "Year":      dt.year,
        "Quarter":   dt.quarter,
        "Month_sin": np.sin(2 * np.pi * month / 12),
        "Month_cos": np.cos(2 * np.pi * month / 12),
        "Day_sin":   np.sin(2 * np.pi * dayofweek / 7),
        "Day_cos":   np.cos(2 * np.pi * dayofweek / 7),
        "구_freq":   gu_freq,
        "동_freq":   dong_freq,
    }

    nfc_industry = _nfc(industry)
    for col in _industry_columns:
        # 매핑된 업종명에서 '업종_' 접두사 제거 후 비교
        target_industry = _industry_map.get(col, "").replace("업종_", "")
        row[col] = 1.0 if _nfc(target_industry) == nfc_industry else 0.0

    return pd.DataFrame([row])[FEATURE_ORDER]


def _make_message(label: str, risk_score: float, industry: str, dong: str) -> str:
    if label == "caution":
        return f"{dong} {industry} 창업은 {risk_score:.0f}% 확률로 3년 내 폐업 위험이 있습니다."
    return f"{dong} {industry} 창업은 비교적 안정적인 상권입니다. (위험도 {risk_score:.0f}%)"


async def predict_survival(
    db: AsyncSession,
    request: PredictionRequest,
) -> PredictionResponse:

    if request.industry not in _industry_list:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 업종입니다. 가능 업종: {_industry_list}"
        )

    # 1. 행정동 boundary 조회
    stmt = select(AdministrativeBoundary).where(
        AdministrativeBoundary.adm_cd == request.adm_cd
    )
    result = await db.execute(stmt)
    ab = result.scalar_one_or_none()
    if not ab:
        raise HTTPException(status_code=404, detail="행정동을 찾을 수 없습니다.")

    # 2. adm_cd 앞 5자리로 구 이름 조회
    stmt = select(RegionCode).where(
        RegionCode.region_code == int(request.adm_cd[:5])
    )
    result = await db.execute(stmt)
    rc = result.scalar_one_or_none()
    gu = rc.county_name if rc else "unknown"

    # 3. centroid → 피처 → 예측
    cx, cy = _centroid(ab.boundary)
    X      = _build_features(cx, cy, gu, ab.adm_nm, request.industry, request.open_date, region_code=int(request.adm_cd[:5]))
    prob   = float(_model.predict_proba(X)[0][1])
    pred   = prob >= THRESHOLD
    label  = "caution" if pred else "stable"

    return PredictionResponse(
        risk_score = round(prob * 100, 1),
        label      = label,
        label_kor  = "주의" if pred else "안정",
        industry   = request.industry,
        dong       = ab.adm_nm,
        gu         = gu,
        open_date  = str(request.open_date),
        message    = _make_message(label, prob * 100, request.industry, ab.adm_nm),
        threshold  = THRESHOLD,
    )

