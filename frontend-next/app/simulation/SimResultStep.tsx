"use client";

import React, { useMemo, useState } from "react";
import styles from "./SimResultStep.module.css";
import {
  ProcessedRealEstateDto,
  EquipPriceItem,
  EquipPriceResponseDto,
  EquipPriceItemWithQty,
} from "./types";

type PriceTab = "under" | "over";

interface Props {
  industName: string;
  regionLabel: string;
  realEstateList: ProcessedRealEstateDto[];
  equipData: EquipPriceResponseDto;
  onBack: () => void;
}

export default function SimResultStep({
  industName,
  regionLabel,
  realEstateList,
  equipData,
  onBack,
}: Props) {
  // ── 설비 목록 초기화 (qty = 1) ──
  const [equips, setEquips] = useState<EquipPriceItemWithQty[]>(() =>
    (equipData.equip_prices ?? []).map((e: EquipPriceItem) => ({ ...e, qty: 1 }))
  );

  // ── 선택된 부동산 매물 ──
  const [selectedRE, setSelectedRE] = useState<ProcessedRealEstateDto | null>(null);

  // ── 설비 수량 조정 ──
  const changeQty = (idx: number, delta: number) => {
    setEquips((prev) =>
      prev.map((e, i) =>
        i === idx ? { ...e, qty: Math.max(0, e.qty + delta) } : e
      )
    );
  };

  // ── 설비 삭제 ──
  const removeEquip = (idx: number) => {
    setEquips((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── 설비 총액 ──
  const totalEquipCost = useMemo(
    () => equips.reduce((sum, e) => sum + (e.product_price ?? 0) * e.qty, 0),
    [equips]
  );

  // ── 총 창업 비용 (선택 부동산 + 설비) ──
  const selectedREAmount = selectedRE?.dealAmount ?? 0;
  const grandTotal = (selectedREAmount as number) + totalEquipCost;

  // ── 부동산 통계 계산 ──
  const reStats = useMemo(() => {
    const validDeal = realEstateList
      .map((r) => r.dealAmount)
      .filter((v): v is number => v !== null && v > 0);
    const validPyeong = realEstateList
      .map((r) => r.pricePerPyeong)
      .filter((v): v is number => v !== null && v > 0);
    const validAr = realEstateList
      .map((r) => parseFloat(r.buildingAr ?? "0"))
      .filter((v) => v > 0);
    const validAge = realEstateList
      .map((r) => r.buildAge)
      .filter((v): v is number => v !== null && v >= 0);

    const avg = (arr: number[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    return {
      avgDeal: avg(validDeal),
      avgPyeong: avg(validPyeong),
      avgAr: avg(validAr),
      avgAge: avg(validAge),
      totalCount: realEstateList.length,
    };
  }, [realEstateList]);

  const formatWon = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  };

  // 소스 배지 색상
  const sourceBadge = (src: string) => {
    const map: Record<string, string> = {
      NAVER: styles.badgeNaver,
      RAG: styles.badgeRag,
      LLM: styles.badgeLlm,
      HUMAN: styles.badgeHuman,
    };
    return map[src?.toUpperCase()] ?? styles.badgeDefault;
  };

  // ── 1억 이하 / 초과 탭 분리 ──
  const [priceTab, setPriceTab] = useState<PriceTab>("under");
  const under100M = useMemo(
    () => realEstateList.filter((r) => r.isWithin100M === true),
    [realEstateList]
  );
  const over100M = useMemo(
    () => realEstateList.filter((r) => r.isWithin100M === false),
    [realEstateList]
  );
  const activeList = priceTab === "under" ? under100M : over100M;

  // 건물 유형 카운트 (전체 기준)
  const buildingTypeStats = useMemo(() => {
    const cnt: Record<string, number> = {};
    realEstateList.forEach((r) => {
      const k = r.buildingUse ?? "기타";
      cnt[k] = (cnt[k] ?? 0) + 1;
    });
    return Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [realEstateList]);

  return (
    <div className={styles.wrapper}>
      {/* ── 상단 헤더 ── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack} id="sim-back-btn">
          ← 다시 검색
        </button>
        <div className={styles.topBadgeRow}>
          <span className={styles.chip}>{industName}</span>
          <span className={styles.chipSep}>·</span>
          <span className={styles.chip}>{regionLabel}</span>
        </div>
      </div>

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>창업 비용 시뮬레이션 결과</h1>

        {/* ════════════════════════════════════
            SECTION 1 — 부동산 실거래가 분석
        ════════════════════════════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>01</span>
            <div>
              <h2 className={styles.sectionTitle}>상업용 부동산 실거래가 분석</h2>
              <p className={styles.sectionSub}>
                {regionLabel} 기준 최신 실거래 데이터 {reStats.totalCount}건 분석
              </p>
            </div>
          </div>

          {/* 요약 스탯 */}
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statVal}>{formatWon(reStats.avgDeal)}</div>
              <div className={styles.statKey}>평균 거래금액</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📐</div>
              <div className={styles.statVal}>{formatWon(reStats.avgPyeong)}</div>
              <div className={styles.statKey}>평균 평당가격</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏗</div>
              <div className={styles.statVal}>{reStats.avgAr}㎡</div>
              <div className={styles.statKey}>평균 건물 면적</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏳</div>
              <div className={styles.statVal}>{reStats.avgAge}년</div>
              <div className={styles.statKey}>평균 건물 연차</div>
            </div>
          </div>

          {/* 건물 용도 분포 */}
          {buildingTypeStats.length > 0 && (
            <div className={styles.distPanel}>
              <div className={styles.distTitle}>주요 건물 용도 분포</div>
              <div className={styles.distRow}>
                {buildingTypeStats.map(([type, cnt]) => {
                  const pct = Math.round((cnt / reStats.totalCount) * 100);
                  return (
                    <div key={type} className={styles.distItem}>
                      <div className={styles.distLabel}>{type}</div>
                      <div className={styles.distBarWrap}>
                        <div
                          className={styles.distBar}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className={styles.distPct}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1억 이하 / 초과 탭 */}
          {realEstateList.length > 0 && (
            <div className={styles.priceTabs}>
              <button
                className={`${styles.priceTab} ${priceTab === "under" ? styles.priceTabActive : ""}`}
                onClick={() => setPriceTab("under")}
              >
                <span className={styles.priceTabDot} style={{ background: "#60a5fa" }} />
                1억 이하
                <span className={styles.priceTabCount}>{under100M.length}건</span>
              </button>
              <button
                className={`${styles.priceTab} ${priceTab === "over" ? styles.priceTabActive : ""}`}
                onClick={() => setPriceTab("over")}
              >
                <span className={styles.priceTabDot} style={{ background: "#a78bfa" }} />
                1억 초과
                <span className={styles.priceTabCount}>{over100M.length}건</span>
              </button>
            </div>
          )}

          {/* 실거래 목록 테이블 */}
          {activeList.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }} />
                    <th>주소</th>
                    <th>건물 용도</th>
                    <th>면적(㎡)</th>
                    <th>층</th>
                    <th>거래금액</th>
                    <th>평당가격</th>
                    <th>거래일</th>
                    <th>건령</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.map((r, idx) => {
                    const isSelected = selectedRE === r;
                    return (
                      <tr
                        key={idx}
                        className={isSelected ? styles.selectedRow : ""}
                        onClick={() => setSelectedRE(isSelected ? null : r)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span className={isSelected ? styles.radioOn : styles.radioOff} />
                        </td>
                        <td>{r.address ?? "-"}</td>
                        <td>
                          <span className={styles.useTag}>{r.buildingUse ?? "-"}</span>
                        </td>
                        <td>{r.buildingAr ?? "-"}</td>
                        <td>
                          {r.floor && r.floor.trim() !== ""
                            ? `${r.floor}층`
                            : "-"}
                        </td>
                        <td className={styles.moneyCell}>
                          <div className={styles.amountWrap}>
                            {r.dealAmount ? formatWon(r.dealAmount) : "-"}
                            {r.buildingType && (
                              <span
                                className={
                                  r.buildingType === "집합"
                                    ? styles.tagJibhap
                                    : styles.tagIlban
                                }
                              >
                                {r.buildingType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={styles.moneyCell}>
                          {r.pricePerPyeong ? formatWon(r.pricePerPyeong) : "-"}
                        </td>
                        <td>{r.dealDate ?? "-"}</td>
                        <td>{r.buildAge !== null ? `${r.buildAge}년` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <span>
                {priceTab === "under" ? "1억 이하" : "1억 초과"} 거래 데이터가 없습니다.
              </span>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════
            SECTION 2 — 필수 설비 비용
        ════════════════════════════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>02</span>
            <div>
              <h2 className={styles.sectionTitle}>필수 설비 비용</h2>
              <p className={styles.sectionSub}>
                {industName} · 필수 설비 {equipData.essential_equip_cnt}종
                &nbsp;|&nbsp; 수량을 조정하면 합계가 실시간 변경됩니다
              </p>
            </div>
          </div>

          {/* 출처 배지 */}
          <div className={styles.sourceBadges}>
            {[
              { key: "NAVER", cnt: equipData.naver_sources_cnt, cls: styles.badgeNaver },
              { key: "RAG", cnt: equipData.rag_sources_cnt, cls: styles.badgeRag },
              { key: "LLM", cnt: equipData.llm_sources_cnt, cls: styles.badgeLlm },
              { key: "HUMAN", cnt: equipData.human_sources_cnt, cls: styles.badgeHuman },
            ]
              .filter((b) => b.cnt > 0)
              .map((b) => (
                <span key={b.key} className={`${styles.sourceBadge} ${b.cls}`}>
                  {b.key} {b.cnt}건
                </span>
              ))}
          </div>

          {/* 설비 목록 */}
          {equips.length > 0 ? (
            <>
              <div className={styles.equipList}>
                {equips.map((eq, idx) => (
                  <div key={idx} className={styles.equipCard}>
                    {/* 이미지 */}
                    <div className={styles.equipImg}>
                      {eq.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={eq.imageUrl} alt={eq.equip_name_kr} />
                      ) : (
                        <span className={styles.equipImgPlaceholder}>⚙️</span>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className={styles.equipInfo}>
                      <div className={styles.equipNameRow}>
                        <div className={styles.equipNameKr}>{eq.equip_name_kr}</div>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => removeEquip(idx)}
                          title="항목 제거"
                        >
                          ✕
                        </button>
                      </div>
                      <div className={styles.equipProduct}>{eq.product_name}</div>
                      {eq.detail && (
                        <div className={styles.equipDetail}>{eq.detail}</div>
                      )}
                      <div className={styles.equipMeta}>
                        <span className={`${styles.sourceBadge} ${sourceBadge(eq.source)}`}>
                          {eq.source}
                        </span>
                        {eq.link && (
                          <a
                            href={eq.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkBtn}
                          >
                            구매 링크 ↗
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 단가 + 수량 */}
                    <div className={styles.equipPriceBlock}>
                      <div className={styles.equipUnitPrice}>
                        {eq.product_price
                          ? formatWon(eq.product_price)
                          : "가격 미정"}
                        <span className={styles.equipUnitLabel}>/개</span>
                      </div>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => changeQty(idx, -1)}
                          disabled={eq.qty === 0}
                          aria-label="수량 감소"
                        >
                          −
                        </button>
                        <span className={styles.qtyVal}>{eq.qty}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => changeQty(idx, 1)}
                          aria-label="수량 증가"
                        >
                          +
                        </button>
                      </div>
                      <div className={styles.equipSubtotal}>
                        {eq.product_price && eq.qty > 0
                          ? `소계: ${formatWon(eq.product_price * eq.qty)}`
                          : eq.qty === 0
                          ? "미포함"
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 총합 바 */}
              <div className={styles.totalBar}>
                <div className={styles.totalLabel}>
                  <span>설비 총 예상 비용</span>
                  <span className={styles.totalSub}>
                    {equips.filter((e) => e.qty > 0).length}종 ×{" "}
                    {equips.reduce((s, e) => s + e.qty, 0)}개
                  </span>
                </div>
                <div className={styles.totalVal}>{formatWon(totalEquipCost)}</div>
              </div>
            </>
          ) : (
            <div className={styles.emptyBox}>
              <span>설비 데이터가 없습니다.</span>
            </div>
          )}
        </section>
      </div>

      {/* ════════════════════════════════════
          STICKY 총합 패널
      ════════════════════════════════════ */}
      <div className={styles.grandTotalBar}>
        <div className={styles.grandTotalInner}>
          {/* 부동산 */}
          <div className={styles.gtItem}>
            <div className={styles.gtLabel}>🏢 부동산 (선택)</div>
            <div className={styles.gtValue}>
              {selectedRE?.dealAmount
                ? formatWon(selectedRE.dealAmount as number)
                : <span className={styles.gtEmpty}>미선택</span>}
            </div>
            {selectedRE && (
              <div className={styles.gtSub}>
                {selectedRE.address} · {selectedRE.buildingAr}㎡
              </div>
            )}
          </div>

          <div className={styles.gtPlus}>+</div>

          {/* 설비 */}
          <div className={styles.gtItem}>
            <div className={styles.gtLabel}>⚙️ 설비 합계</div>
            <div className={styles.gtValue}>{formatWon(totalEquipCost)}</div>
            <div className={styles.gtSub}>
              {equips.filter((e) => e.qty > 0).length}종 {equips.reduce((s, e) => s + e.qty, 0)}개
            </div>
          </div>

          <div className={styles.gtEquals}>=</div>

          {/* 총합 */}
          <div className={`${styles.gtItem} ${styles.gtTotal}`}>
            <div className={styles.gtLabel}>💡 총 창업 예상 비용</div>
            <div className={styles.gtTotalValue}>{formatWon(grandTotal)}</div>
            {!selectedRE && (
              <div className={styles.gtSub}>← 부동산을 선택하면 합산됩니다</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
