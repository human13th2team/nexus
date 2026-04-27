"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./SimSearchStep.module.css";
import { SimIndustCatsDto, SimRegCodesDto } from "./types";

interface Props {
  industList: SimIndustCatsDto[];
  regionList: SimRegCodesDto[];
  onSubmit: (industry: SimIndustCatsDto, region: SimRegCodesDto) => void;
  loading: boolean;
}

export default function SimSearchStep({
  industList,
  regionList,
  onSubmit,
  loading,
}: Props) {
  const [industQuery, setIndustQuery] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [selectedIndust, setSelectedIndust] = useState<SimIndustCatsDto | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SimRegCodesDto | null>(null);
  const [showIndustDropdown, setShowIndustDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const industRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industRef.current && !industRef.current.contains(e.target as Node))
        setShowIndustDropdown(false);
      if (regionRef.current && !regionRef.current.contains(e.target as Node))
        setShowRegionDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredIndust = industList.filter((i) =>
    i.name.toLowerCase().includes(industQuery.toLowerCase())
  );

  const filteredRegion = regionList.filter((r) => {
    const full = `${r.cityName} ${r.countyName}`;
    return full.toLowerCase().includes(regionQuery.toLowerCase());
  });

  const handleSelectIndust = (item: SimIndustCatsDto) => {
    setSelectedIndust(item);
    setIndustQuery(item.name);
    setShowIndustDropdown(false);
  };

  const handleSelectRegion = (item: SimRegCodesDto) => {
    setSelectedRegion(item);
    setRegionQuery(`${item.cityName} ${item.countyName}`);
    setShowRegionDropdown(false);
  };

  const canSubmit = selectedIndust !== null && selectedRegion !== null && !loading;

  const handleSubmit = () => {
    if (selectedIndust && selectedRegion) onSubmit(selectedIndust, selectedRegion);
  };

  return (
    <div className={styles.wrapper}>
      {/* ─── 헤더 ─── */}
      <div className={styles.heroSection}>
        <div className={styles.heroBadge}>AI 창업 분석</div>
        <h1 className={styles.heroTitle}>
          창업 비용<br />
          <span className={styles.heroAccent}>시뮬레이션</span>
        </h1>
        <p className={styles.heroSub}>
          업종과 지역을 선택하면 AI가 부동산 시세와 필수 설비 비용을<br />
          실시간으로 분석해 드립니다.
        </p>

        {/* ─── 검색 카드 ─── */}
        <div className={styles.searchCard}>
          {/* 업종 */}
          <div className={styles.fieldGroup} ref={industRef}>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldIcon}>🏪</span> 업종 선택
            </label>
            <div className={styles.inputWrap}>
              <input
                id="sim-industry-input"
                className={styles.input}
                placeholder="ex) 한식, 카페, 편의점..."
                value={industQuery}
                onChange={(e) => {
                  setIndustQuery(e.target.value);
                  setSelectedIndust(null);
                  setShowIndustDropdown(true);
                }}
                onFocus={() => setShowIndustDropdown(true)}
                autoComplete="off"
              />
              {selectedIndust && (
                <span className={styles.selectedBadge}>{selectedIndust.ksicCode}</span>
              )}
            </div>
            {showIndustDropdown && filteredIndust.length > 0 && (
              <ul className={styles.dropdown}>
                {filteredIndust.slice(0, 8).map((item) => (
                  <li
                    key={item.ksicCode}
                    className={styles.dropdownItem}
                    onMouseDown={() => handleSelectIndust(item)}
                  >
                    <span className={styles.dropdownName}>{item.name}</span>
                    <span className={styles.dropdownCode}>{item.ksicCode}</span>
                  </li>
                ))}
              </ul>
            )}
            {showIndustDropdown && filteredIndust.length === 0 && industQuery && (
              <ul className={styles.dropdown}>
                <li className={styles.dropdownEmpty}>검색 결과가 없습니다</li>
              </ul>
            )}
          </div>

          {/* 지역 */}
          <div className={styles.fieldGroup} ref={regionRef}>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldIcon}>📍</span> 지역 선택
            </label>
            <div className={styles.inputWrap}>
              <input
                id="sim-region-input"
                className={styles.input}
                placeholder="ex) 서울 종로구, 부산 해운대구..."
                value={regionQuery}
                onChange={(e) => {
                  setRegionQuery(e.target.value);
                  setSelectedRegion(null);
                  setShowRegionDropdown(true);
                }}
                onFocus={() => setShowRegionDropdown(true)}
                autoComplete="off"
              />
              {selectedRegion && (
                <span className={styles.selectedBadge}>{selectedRegion.regionCode}</span>
              )}
            </div>
            {showRegionDropdown && filteredRegion.length > 0 && (
              <ul className={styles.dropdown}>
                {filteredRegion.slice(0, 8).map((item) => (
                  <li
                    key={item.regionCode}
                    className={styles.dropdownItem}
                    onMouseDown={() => handleSelectRegion(item)}
                  >
                    <span className={styles.dropdownName}>
                      {item.cityName} {item.countyName}
                    </span>
                    <span className={styles.dropdownCode}>{item.regionCode}</span>
                  </li>
                ))}
              </ul>
            )}
            {showRegionDropdown && filteredRegion.length === 0 && regionQuery && (
              <ul className={styles.dropdown}>
                <li className={styles.dropdownEmpty}>검색 결과가 없습니다</li>
              </ul>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            id="sim-submit-btn"
            className={`${styles.submitBtn} ${canSubmit ? styles.submitBtnActive : styles.submitBtnDisabled}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <span>시뮬레이션 요청하기</span>
                <span className={styles.btnArrow}>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── 예시 미리보기 ─── */}
      <div className={styles.previewSection}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTag}>PREVIEW</span>
          <h2 className={styles.previewTitle}>창업 비용 시뮬레이션 예시</h2>
          <p className={styles.previewSub}>실제 요청 시 아래와 같은 분석 결과를 제공합니다</p>
        </div>

        <div className={styles.previewGrid}>
          {/* 부동산 카드 */}
          <div className={styles.previewCard}>
            <div className={styles.previewCardIcon}>🏢</div>
            <div className={styles.previewCardTitle}>상업용 부동산 실거래가</div>
            <div className={styles.previewCardDesc}>선택 지역의 실제 부동산 거래 데이터를 기반으로 평균 평당 가격, 거래 면적, 건물 용도 등을 분석합니다.</div>
            <div className={styles.previewStatRow}>
              <div className={styles.previewStat}>
                <div className={styles.previewStatVal}>3.3억</div>
                <div className={styles.previewStatKey}>평균 거래금액</div>
              </div>
              <div className={styles.previewStat}>
                <div className={styles.previewStatVal}>850만</div>
                <div className={styles.previewStatKey}>평당 가격</div>
              </div>
              <div className={styles.previewStat}>
                <div className={styles.previewStatVal}>52㎡</div>
                <div className={styles.previewStatKey}>평균 면적</div>
              </div>
            </div>
          </div>

          {/* 설비 카드 */}
          <div className={styles.previewCard}>
            <div className={styles.previewCardIcon}>⚙️</div>
            <div className={styles.previewCardTitle}>필수 설비 비용</div>
            <div className={styles.previewCardDesc}>업종별 필수 설비 목록을 네이버 쇼핑·전문 DB에서 실시간 검색하여 예상 초기 설비 비용을 산출합니다.</div>
            <div className={styles.previewEquipRow}>
              {["에스프레소 머신", "냉장 쇼케이스", "POS 시스템", "제빙기"].map((eq) => (
                <span key={eq} className={styles.previewEquipTag}>{eq}</span>
              ))}
            </div>
            <div className={styles.previewTotalRow}>
              <span>예상 설비 합계</span>
              <span className={styles.previewTotalVal}>약 1,200만원~</span>
            </div>
          </div>
        </div>

        {/* 하단 단계 안내 */}
        <div className={styles.stepsRow}>
          {[
            { icon: "🔍", label: "업종·지역 선택" },
            { icon: "⚡", label: "AI 실시간 분석" },
            { icon: "📊", label: "비용 리포트 제공" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}>{s.icon}</div>
                <div className={styles.stepLabel}>{s.label}</div>
              </div>
              {i < 2 && <div className={styles.stepArrow}>›</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
