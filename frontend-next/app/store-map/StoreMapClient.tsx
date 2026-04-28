"use client";

import React, { useState, useEffect, useRef } from "react";
import { Map, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Search, MapPin, BarChart3, TrendingUp, TrendingDown, Layers, Info, Sparkles } from "lucide-react";
import { fetchStoresData } from "./actions";

interface SimRegCodesDto {
  regionCode: number;
  cityName: string;
  countyName: string;
  latitude: number;
  longitude: number;
}

interface SimIndustCatsDto {
  industryName: string;
  ksicCode: string;
}

interface StoreByRegionDto {
  region_code: number;
  region_name: string;
  storeCount: number;
  latitude: number;
  longitude: number;
}

interface StoresResponseDto {
  storeByRegionDtoList: StoreByRegionDto[];
  totalStoreCount: number;
  avgStoreCount: number;
  topRegions: StoreByRegionDto[];
  bottomRegions: StoreByRegionDto[];
}

export default function StoreMapClient({ 
  kakaoApiKey,
  initialIndustries,
  initialRegions
}: { 
  kakaoApiKey: string;
  initialIndustries: SimIndustCatsDto[];
  initialRegions: SimRegCodesDto[];
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !kakaoApiKey) return;
    if (window.kakao && window.kakao.maps) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => setScriptLoaded(true));
    };
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
  }, [kakaoApiKey]);

  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<number | "">("");
  const [regionSearch, setRegionSearch] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [storesData, setStoresData] = useState<StoresResponseDto | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [storesCache, setStoresCache] = useState<Record<string, StoresResponseDto>>({});
  const [regionActiveIndex, setRegionActiveIndex] = useState(-1);
  const [industryActiveIndex, setIndustryActiveIndex] = useState(-1);
  const [mapCenter, setMapCenter] = useState({ lat: 37.570028, lng: 126.979621 });
  const [mapLevel, setMapLevel] = useState(8); 

  const filteredRegions = initialRegions.filter(r => 
    `${r.cityName} ${r.countyName}`.toLowerCase().includes(regionSearch.toLowerCase())
  );
  const filteredIndustries = initialIndustries.filter(ind =>
    ind.industryName.toLowerCase().includes(industrySearch.toLowerCase())
  );

  useEffect(() => {
    if (!selectedIndustry) {
      setStoresData(null);
      return;
    }
    if (storesCache[selectedIndustry]) {
      setStoresData(storesCache[selectedIndustry]);
      return;
    }

    const loadStores = async () => {
      setIsLoadingData(true);
      try {
        const data = await fetchStoresData(selectedIndustry);
        if (data) {
          setStoresData(data);
          setStoresCache(prev => ({ ...prev, [selectedIndustry]: data }));
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    loadStores();
  }, [selectedIndustry, storesCache]);

  useEffect(() => {
    if (!selectedRegion) return;
    const region = initialRegions.find((r) => r.regionCode === selectedRegion);
    if (region && region.latitude && region.longitude) {
      setMapCenter({ lat: region.latitude, lng: region.longitude });
      setMapLevel(5);
    }
  }, [selectedRegion, initialRegions]);

  const handleRegionKeyDown = (e: React.KeyboardEvent) => {
    if (!isRegionOpen) return;
    if (e.key === "ArrowDown") {
      setRegionActiveIndex(prev => (prev < filteredRegions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setRegionActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && regionActiveIndex >= 0) {
      const r = filteredRegions[regionActiveIndex];
      setSelectedRegion(r.regionCode);
      setRegionSearch(`${r.cityName} ${r.countyName}`);
      setIsRegionOpen(false);
      setRegionActiveIndex(-1);
    } else if (e.key === "Escape") {
      setIsRegionOpen(false);
    }
  };

  const handleIndustryKeyDown = (e: React.KeyboardEvent) => {
    if (!isIndustryOpen) return;
    if (e.key === "ArrowDown") {
      setIndustryActiveIndex(prev => (prev < filteredIndustries.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setIndustryActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && industryActiveIndex >= 0) {
      const ind = filteredIndustries[industryActiveIndex];
      setSelectedIndustry(ind.ksicCode);
      setIndustrySearch(ind.industryName);
      setIsIndustryOpen(false);
      setIndustryActiveIndex(-1);
    } else if (e.key === "Escape") {
      setIsIndustryOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--nexus-bg)] font-inter overflow-hidden">
      {/* Header Area */}
      <header className="px-8 py-6 bg-white border-b border-[var(--nexus-outline-variant)]/30 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-[var(--nexus-primary)] animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-[var(--nexus-primary)]/60 uppercase">District Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--nexus-primary)]">상권 분석 지도</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <section className="flex-1 relative">
          {scriptLoaded && !scriptError ? (
            <Map
              center={mapCenter}
              level={mapLevel}
              onZoomChanged={(map) => setMapLevel(map.getLevel())}
              className="w-full h-full"
            >
              {storesData?.storeByRegionDtoList?.map((store, idx) => {
                const isAboveAvg = store.storeCount >= storesData.avgStoreCount;
                return (
                  <CustomOverlayMap key={idx} position={{ lat: store.latitude, lng: store.longitude }}>
                    <div className="flex flex-col items-center">
                      <div className={`px-3 py-1.5 rounded-xl shadow-lg border-2 flex flex-col items-center ${
                        isAboveAvg 
                        ? "bg-[var(--nexus-primary)] border-[var(--nexus-primary-container)]" 
                        : "bg-[var(--nexus-secondary)] border-[var(--nexus-secondary-container)]"
                      }`}>
                        <span className="text-[10px] font-bold text-white/70">{store.region_name}</span>
                        <span className="text-sm font-black text-white">{store.storeCount.toLocaleString()}개</span>
                      </div>
                      <div className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
                        isAboveAvg ? "border-t-[var(--nexus-primary-container)]" : "border-t-[var(--nexus-secondary-container)]"
                      }`}></div>
                    </div>
                  </CustomOverlayMap>
                );
              })}
            </Map>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-sm opacity-50">
              {scriptError ? "지도를 불러올 수 없습니다." : "넥서스 지도를 구성하는 중..."}
            </div>
          )}

          {/* Search Controls (Floating) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-10">
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[24px] border border-[var(--nexus-outline-variant)]/30 shadow-2xl flex gap-4">
              <div className="flex-1 relative">
                <label className="text-[9px] font-black text-[var(--nexus-primary)]/40 uppercase tracking-widest px-2 mb-1 block">REGION</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--nexus-primary)]/30" />
                  <input 
                    className="w-full bg-[var(--nexus-surface-low)] border-none rounded-xl pl-12 pr-4 py-3 text-sm font-semibold focus:ring-2 ring-[var(--nexus-primary)]/20 transition-all"
                    placeholder="지역 검색..."
                    value={regionSearch}
                    onChange={(e) => { setRegionSearch(e.target.value); setIsRegionOpen(true); setRegionActiveIndex(-1); }}
                    onFocus={() => setIsRegionOpen(true)}
                    onKeyDown={handleRegionKeyDown}
                  />
                </div>
                {isRegionOpen && filteredRegions.length > 0 && (
                  <div className="absolute bottom-full mb-2 left-0 w-full bg-white rounded-2xl shadow-2xl border border-[var(--nexus-outline-variant)]/20 overflow-hidden max-h-[300px] overflow-y-auto">
                    {filteredRegions.map((r, idx) => (
                      <div key={r.regionCode} className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
                        idx === regionActiveIndex ? "bg-[var(--nexus-surface-low)]" : "hover:bg-[var(--nexus-surface-low)]"
                      }`}
                        onClick={() => { setSelectedRegion(r.regionCode); setRegionSearch(`${r.cityName} ${r.countyName}`); setIsRegionOpen(false); }}
                        onMouseEnter={() => setRegionActiveIndex(idx)}>
                        {r.cityName} {r.countyName}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 relative">
                <label className="text-[9px] font-black text-[var(--nexus-primary)]/40 uppercase tracking-widest px-2 mb-1 block">INDUSTRY</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--nexus-primary)]/30" />
                  <input 
                    className="w-full bg-[var(--nexus-surface-low)] border-none rounded-xl pl-12 pr-4 py-3 text-sm font-semibold focus:ring-2 ring-[var(--nexus-primary)]/20 transition-all"
                    placeholder="업종 검색..."
                    value={industrySearch}
                    onChange={(e) => { setIndustrySearch(e.target.value); setIsIndustryOpen(true); setIndustryActiveIndex(-1); }}
                    onFocus={() => setIsIndustryOpen(true)}
                    onKeyDown={handleIndustryKeyDown}
                  />
                </div>
                {isIndustryOpen && filteredIndustries.length > 0 && (
                  <div className="absolute bottom-full mb-2 left-0 w-full bg-white rounded-2xl shadow-2xl border border-[var(--nexus-outline-variant)]/20 overflow-hidden max-h-[300px] overflow-y-auto">
                    {filteredIndustries.map((ind, idx) => (
                      <div key={ind.ksicCode} className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
                        idx === industryActiveIndex ? "bg-[var(--nexus-surface-low)]" : "hover:bg-[var(--nexus-surface-low)]"
                      }`}
                        onClick={() => { setSelectedIndustry(ind.ksicCode); setIndustrySearch(ind.industryName); setIsIndustryOpen(false); }}
                        onMouseEnter={() => setIndustryActiveIndex(idx)}>
                        {ind.industryName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Data Section */}
        <aside className="w-[400px] bg-white border-l border-[var(--nexus-outline-variant)]/30 overflow-y-auto p-8 relative">
          {isLoadingData && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-[var(--nexus-primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-[var(--nexus-primary)]">데이터 분석 중...</p>
            </div>
          )}

          {storesData ? (
            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-2 mb-6 text-[var(--nexus-primary)]">
                  <BarChart3 size={18} />
                  <h2 className="text-xs font-black uppercase tracking-widest">전국 분포 통계</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--nexus-surface-low)] p-6 rounded-3xl">
                    <p className="text-[8px] font-black text-[var(--nexus-primary)]/40 uppercase mb-2">전체 업소 수</p>
                    <p className="text-2xl font-black text-[var(--nexus-primary)]">{storesData.totalStoreCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-[var(--nexus-surface-low)] p-6 rounded-3xl">
                    <p className="text-[8px] font-black text-[var(--nexus-primary)]/40 uppercase mb-2">지역 평균</p>
                    <p className="text-2xl font-black text-[var(--nexus-primary)]">{storesData.avgStoreCount.toFixed(1)}</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-6 text-[var(--nexus-primary)]">
                  <TrendingUp size={18} />
                  <h2 className="text-xs font-black uppercase tracking-widest">고밀도 지역 TOP</h2>
                </div>
                <div className="space-y-3">
                  {storesData.topRegions.map((region, i) => (
                    <div key={i} className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-[var(--nexus-outline-variant)]/20 shadow-sm">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-[var(--nexus-primary)]">{region.region_name}</span>
                        <span className="text-[var(--nexus-secondary)]">{region.storeCount.toLocaleString()}개</span>
                      </div>
                      <div className="h-1.5 bg-[var(--nexus-surface-low)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--nexus-secondary)] rounded-full transition-all duration-1000" 
                          style={{ width: `${(region.storeCount / storesData.topRegions[0].storeCount) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-6 text-[var(--nexus-primary)]">
                  <TrendingDown size={18} />
                  <h2 className="text-xs font-black uppercase tracking-widest">저밀도 지역 TOP</h2>
                </div>
                <div className="space-y-3">
                  {storesData.bottomRegions.map((region, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-[var(--nexus-outline-variant)]/20">
                      <span className="text-sm font-bold opacity-60">{region.region_name}</span>
                      <span className="text-sm font-black text-[var(--nexus-primary)]">{region.storeCount.toLocaleString()}개</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-6 opacity-30">
              <Layers size={48} />
              <div className="space-y-2">
                <p className="text-sm font-bold">데이터를 불러와 주세요</p>
                <p className="text-xs font-medium leading-relaxed">분석을 원하는 업종을 선택하시면<br />상권 밀집도 데이터가 표시됩니다.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
