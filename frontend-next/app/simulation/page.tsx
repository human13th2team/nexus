"use client";

import React, { useEffect, useState } from "react";
import SimSearchStep from "./SimSearchStep";
import SimResultStep from "./SimResultStep";
import {
  fetchSearchList,
  fetchRealEstate,
  fetchEquipPrice,
} from "./api";
import {
  SimSearchListDto,
  SimIndustCatsDto,
  SimRegCodesDto,
  ProcessedRealEstateDto,
  EquipPriceResponseDto,
} from "./types";
import styles from "./page.module.css";

type Step = "search" | "result";

export default function SimulationPage() {
  // ── 검색 목록 (초기 로드) ──
  const [searchList, setSearchList] = useState<SimSearchListDto | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── 시뮬레이션 요청 상태 ──
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // ── 결과 데이터 ──
  const [realEstateList, setRealEstateList] = useState<ProcessedRealEstateDto[]>([]);
  const [equipData, setEquipData] = useState<EquipPriceResponseDto | null>(null);

  // ── 선택 값 ──
  const [selectedIndust, setSelectedIndust] = useState<SimIndustCatsDto | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SimRegCodesDto | null>(null);

  // ── 화면 단계 ──
  const [step, setStep] = useState<Step>("search");

  // 검색 목록 초기 로드
  useEffect(() => {
    fetchSearchList()
      .then(setSearchList)
      .catch((err) => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  // 시뮬레이션 요청 실행
  const handleSubmit = async (
    industry: SimIndustCatsDto,
    region: SimRegCodesDto
  ) => {
    setSelectedIndust(industry);
    setSelectedRegion(region);
    setSimLoading(true);
    setSimError(null);

    try {
      // 두 API 병렬 호출
      const [reList, eq] = await Promise.all([
        fetchRealEstate(region.regionCode),
        fetchEquipPrice(industry.ksicCode),
      ]);
      setRealEstateList(reList);
      setEquipData(eq);
      setStep("result");
    } catch (err: unknown) {
      setSimError(err instanceof Error ? err.message : "시뮬레이션 요청 실패");
    } finally {
      setSimLoading(false);
    }
  };

  const handleBack = () => {
    setStep("search");
    setSimError(null);
  };

  // ── 초기 로딩 ──
  if (listLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>업종·지역 목록을 불러오는 중...</p>
      </div>
    );
  }

  // ── 목록 로드 에러 ──
  if (listError) {
    return (
      <div className={styles.errorScreen}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>목록 로드 실패: {listError}</p>
        <button
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 시뮬레이션 에러 토스트 */}
      {simError && (
        <div className={styles.errorToast}>
          ⚠️ {simError}
          <button className={styles.toastClose} onClick={() => setSimError(null)}>
            ×
          </button>
        </div>
      )}

      {step === "search" && (
        <SimSearchStep
          industList={searchList?.indust_cats ?? []}
          regionList={searchList?.reg_codes ?? []}
          onSubmit={handleSubmit}
          loading={simLoading}
        />
      )}

      {step === "result" && equipData && selectedIndust && selectedRegion && (
        <SimResultStep
          industName={selectedIndust.name}
          regionLabel={`${selectedRegion.cityName} ${selectedRegion.countyName}`}
          realEstateList={realEstateList}
          equipData={equipData}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
