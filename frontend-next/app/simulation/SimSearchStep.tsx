"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Sparkles, ArrowRight, Store, Info, CheckCircle2 } from "lucide-react";
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

  const [industActiveIndex, setIndustActiveIndex] = useState(-1);
  const [regionActiveIndex, setRegionActiveIndex] = useState(-1);

  const industRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

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
    (i.industryName || "").toLowerCase().includes(industQuery.toLowerCase())
  );

  const filteredRegion = regionList.filter((r) => {
    const full = `${r.cityName} ${r.countyName}`;
    return full.toLowerCase().includes(regionQuery.toLowerCase());
  });

  const handleSelectIndust = (item: SimIndustCatsDto) => {
    setSelectedIndust(item);
    setIndustQuery(item.industryName);
    setShowIndustDropdown(false);
    setIndustActiveIndex(-1);
  };

  const handleSelectRegion = (item: SimRegCodesDto) => {
    setSelectedRegion(item);
    setRegionQuery(`${item.cityName} ${item.countyName}`);
    setShowRegionDropdown(false);
    setRegionActiveIndex(-1);
  };

  const handleIndustKeyDown = (e: React.KeyboardEvent) => {
    if (!showIndustDropdown) return;
    if (e.key === "ArrowDown") {
      setIndustActiveIndex((prev) => (prev < filteredIndust.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setIndustActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && industActiveIndex >= 0) {
      handleSelectIndust(filteredIndust[industActiveIndex]);
    } else if (e.key === "Escape") {
      setShowIndustDropdown(false);
    }
  };

  const handleRegionKeyDown = (e: React.KeyboardEvent) => {
    if (!showRegionDropdown) return;
    if (e.key === "ArrowDown") {
      setRegionActiveIndex((prev) => (prev < filteredRegion.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setRegionActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && regionActiveIndex >= 0) {
      handleSelectRegion(filteredRegion[regionActiveIndex]);
    } else if (e.key === "Escape") {
      setShowRegionDropdown(false);
    }
  };


  const canSubmit = selectedIndust !== null && selectedRegion !== null && !loading;

  const handleSubmit = () => {
    if (selectedIndust && selectedRegion) onSubmit(selectedIndust, selectedRegion);
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] font-inter">
      {/* ─── 히어로 섹션 ─── */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--nexus-primary)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--nexus-surface-container)] rounded-full text-[var(--nexus-primary)] text-[10px] font-black tracking-[0.2em] uppercase">
            <Sparkles size={14} className="animate-pulse" />
            AI 기반 정밀 분석
          </div>
          
          <h1 className="font-manrope text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--nexus-primary)] leading-tight">
            창업 비용 <span className="text-[var(--nexus-secondary)]">시뮬레이션</span>
          </h1>
          
          <p className="text-lg opacity-70 max-w-2xl font-light leading-relaxed">
            업종과 지역을 선택하면 국토교통부 실거래가 데이터와 필수 설비 DB를<br className="hidden md:block" />
            실시간으로 매칭하여 당신만의 창업 리포트를 생성합니다.
          </p>

          {/* ─── 검색 카드 ─── */}
          <div className="w-full mt-8 bg-white p-8 md:p-12 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(11,26,125,0.08)] border border-[var(--nexus-outline-variant)]/30 flex flex-col gap-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 업종 선택 */}
              <div className="flex flex-col gap-3 relative" ref={industRef}>
                <label className="text-xs font-bold text-[var(--nexus-primary)]/60 flex items-center gap-2 px-1">
                  <Store size={14} /> 업종 선택
                </label>
                <div className="relative group">
                  <input
                    className="w-full bg-[var(--nexus-surface-low)] border-2 border-transparent focus:border-[var(--nexus-primary)] focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all duration-300 font-medium"
                    placeholder="ex) 한식, 카페, 편의점..."
                    value={industQuery}
                    onChange={(e) => {
                      setIndustQuery(e.target.value);
                      setSelectedIndust(null);
                      setShowIndustDropdown(true);
                    }}
                    onFocus={() => setShowIndustDropdown(true)}
                    onKeyDown={handleIndustKeyDown}
                  />
                  {selectedIndust && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--nexus-primary)] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      {selectedIndust.ksicCode}
                    </div>
                  )}
                  {showIndustDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-[var(--nexus-outline-variant)]/50 overflow-hidden z-50">
                      {filteredIndust.length > 0 ? (
                        <ul className="max-h-[300px] overflow-y-auto py-2">
                          {filteredIndust.map((item, idx) => (
                            <li
                              key={item.ksicCode}
                              className={`px-5 py-3 cursor-pointer flex justify-between items-center transition-colors ${
                                idx === industActiveIndex ? "bg-[var(--nexus-surface-container)]" : "hover:bg-[var(--nexus-surface-container)]"
                              }`}
                              onMouseDown={() => handleSelectIndust(item)}
                              onMouseEnter={() => setIndustActiveIndex(idx)}
                            >
                              <span className="font-semibold text-sm">{item.industryName}</span>
                              <span className="text-[10px] text-[var(--nexus-primary)]/40 font-mono">{item.ksicCode}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-5 py-8 text-center text-sm opacity-40">검색 결과가 없습니다</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 지역 선택 */}
              <div className="flex flex-col gap-3 relative" ref={regionRef}>
                <label className="text-xs font-bold text-[var(--nexus-primary)]/60 flex items-center gap-2 px-1">
                  <MapPin size={14} /> 지역 선택
                </label>
                <div className="relative group">
                  <input
                    className="w-full bg-[var(--nexus-surface-low)] border-2 border-transparent focus:border-[var(--nexus-primary)] focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all duration-300 font-medium"
                    placeholder="ex) 서울 종로구, 부산 해운대구..."
                    value={regionQuery}
                    onChange={(e) => {
                      setRegionQuery(e.target.value);
                      setSelectedRegion(null);
                      setShowRegionDropdown(true);
                    }}
                    onFocus={() => setShowRegionDropdown(true)}
                    onKeyDown={handleRegionKeyDown}
                  />
                  {selectedRegion && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--nexus-secondary)] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      {selectedRegion.regionCode}
                    </div>
                  )}
                  {showRegionDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-[var(--nexus-outline-variant)]/50 overflow-hidden z-50">
                      {filteredRegion.length > 0 ? (
                        <ul className="max-h-[300px] overflow-y-auto py-2">
                          {filteredRegion.map((item, idx) => (
                            <li
                              key={item.regionCode}
                              className={`px-5 py-3 cursor-pointer flex justify-between items-center transition-colors ${
                                idx === regionActiveIndex ? "bg-[var(--nexus-surface-container)]" : "hover:bg-[var(--nexus-surface-container)]"
                              }`}
                              onMouseDown={() => handleSelectRegion(item)}
                              onMouseEnter={() => setRegionActiveIndex(idx)}
                            >
                              <span className="font-semibold text-sm">{item.cityName} {item.countyName}</span>
                              <span className="text-[10px] text-[var(--nexus-secondary)]/40 font-mono">{item.regionCode}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-5 py-8 text-center text-sm opacity-40">검색 결과가 없습니다</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              id="sim-submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                canSubmit
                  ? "bg-[var(--nexus-primary)] text-white shadow-[0_20px_40px_-15px_rgba(11,26,125,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-[var(--nexus-surface-container)] text-[var(--nexus-primary)]/20 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  시뮬레이션 시작하기
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── 미리보기 섹션 ─── */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-[var(--nexus-surface-container-high)] rounded-lg text-[var(--nexus-primary)] text-[10px] font-black uppercase tracking-widest">
                PREVIEW
              </div>
              <h2 className="font-manrope text-3xl md:text-4xl font-bold tracking-tight">넥서스가 제공하는 분석 결과</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[32px] border border-[var(--nexus-outline-variant)]/30 hover:border-[var(--nexus-primary)]/30 transition-all duration-500 group">
              <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[var(--nexus-primary)] group-hover:text-white transition-colors">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">정밀 실거래가 분석</h3>
              <p className="text-sm opacity-60 leading-relaxed mb-8">
                국토교통부 데이터를 기반으로 해당 지역의 평균 거래가, 평당 가격, 건물 연식을 정밀 분석합니다.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-bold">LATEST DATA</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[32px] border border-[var(--nexus-outline-variant)]/30 hover:border-[var(--nexus-secondary)]/30 transition-all duration-500 group">
              <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[var(--nexus-secondary)] group-hover:text-white transition-colors">
                <Info className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">필수 설비 견적</h3>
              <p className="text-sm opacity-60 leading-relaxed mb-8">
                업종별로 필요한 주방 설비, IT 기기 등을 실시간 쇼핑 데이터와 연동하여 최저가 견적을 산출합니다.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-bold">REAL-TIME</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[32px] border border-[var(--nexus-outline-variant)]/30 hover:border-[var(--nexus-tertiary-fixed)]/30 transition-all duration-500 group">
              <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[var(--nexus-primary)] group-hover:text-white transition-colors">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">통합 비용 리포트</h3>
              <p className="text-sm opacity-60 leading-relaxed mb-8">
                부동산 매물과 설비 비용을 합산하여 최종 창업 예상 비용을 시각화된 리포트로 제공합니다.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-bold">AI REPORT</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
