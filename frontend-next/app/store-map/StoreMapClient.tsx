"use client";

import React, { useState, useEffect, useRef } from "react";
import { Map, CustomOverlayMap, useKakaoLoader } from "react-kakao-maps-sdk";
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
    
    // Check if already loaded
    if (window.kakao && window.kakao.maps) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        setScriptLoaded(true);
      });
    };

    script.onerror = () => {
      console.error("Failed to load Kakao Maps script");
      setScriptError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Clean up only if needed, but usually better to keep for performance
    };
  }, [kakaoApiKey]);

  const [industries] = useState<SimIndustCatsDto[]>(initialIndustries);
  const [regions] = useState<SimRegCodesDto[]>(initialRegions);

  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<number | "">("");
  
  const [regionSearch, setRegionSearch] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  
  const [industrySearch, setIndustrySearch] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);

  const [storesData, setStoresData] = useState<StoresResponseDto | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Client-side cache for industry data
  const [storesCache, setStoresCache] = useState<Record<string, StoresResponseDto>>({});

  // Default center: 서울특별시 종로구
  const [mapCenter, setMapCenter] = useState({ lat: 37.570028, lng: 126.979621 });
  const [mapLevel, setMapLevel] = useState(8); 

  const mapRef = useRef<kakao.maps.Map>(null);

  // Filtered regions/industries (same logic)
  const filteredRegions = regions.filter(r => 
    `${r.cityName} ${r.countyName}`.toLowerCase().includes(regionSearch.toLowerCase())
  );
  const filteredIndustries = industries.filter(ind =>
    ind.industryName.toLowerCase().includes(industrySearch.toLowerCase())
  );

  // Fetch store data when industry changes (With Cache)
  useEffect(() => {
    if (!selectedIndustry) {
      setStoresData(null);
      return;
    }

    // Check cache first
    if (storesCache[selectedIndustry]) {
      setStoresData(storesCache[selectedIndustry]);
      return;
    }

    const loadStores = async () => {
      setStoresData(null);
      setIsLoadingData(true);
      try {
        console.log("Fetching stores for:", selectedIndustry);
        const data = await fetchStoresData(selectedIndustry);
        if (data) {
          setStoresData(data);
          // Update cache
          setStoresCache(prev => ({ ...prev, [selectedIndustry]: data }));
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    loadStores();
  }, [selectedIndustry, storesCache]);

  // Update map center when region changes (Fast focus using DTO coordinates)
  useEffect(() => {
    if (!selectedRegion) return;
    
    const region = regions.find((r) => r.regionCode === selectedRegion);
    if (region && region.latitude && region.longitude) {
      setMapCenter({ lat: region.latitude, lng: region.longitude });
      setMapLevel(5); // 선택한 지역으로 줌 인 (상세 보기)
    }
  }, [selectedRegion, regions]);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-surface-bright text-on-surface">
      {/* Dashboard Header */}
      <div className="px-12 py-8 bg-surface-bright flex justify-between items-end border-b border-outline-variant/20">
        <div>
          <p className="text-[0.6875rem] font-bold tracking-[0.2em] text-[#7b5900] uppercase mb-2">
            District Intelligence Report
          </p>
          <h1 className="text-5xl font-extrabold tracking-tighter text-[#004260] leading-none">
            상권 분석 지도
          </h1>
        </div>
      </div>

      {/* Main Workspace: Asymmetric Layout */}
      <div className="flex-1 grid grid-cols-[1fr_400px] overflow-hidden">
        {/* Left: Interactive Map Canvas */}
        <section className="relative h-full overflow-hidden min-h-[500px]">
          {scriptLoaded && !scriptError && kakaoApiKey ? (
            <Map
              center={mapCenter}
              level={mapLevel}
              onZoomChanged={(map) => setMapLevel(map.getLevel())}
              style={{ width: "100%", height: "100%" }}
              ref={mapRef}
              zoomable={true} // Zoom 가능
              draggable={true} // 이동 가능
            >
              {storesData?.storeByRegionDtoList?.map((store, idx) => {
                const isAboveAvg = store.storeCount >= storesData.avgStoreCount;
                const bgColor = isAboveAvg ? "bg-[#ba1a1a]" : "bg-[#005a82]";
                const borderColor = isAboveAvg ? "border-[#93000a]" : "border-[#004260]";
                const arrowColor = isAboveAvg ? "border-t-[#93000a]" : "border-t-[#004260]";

                return (
                  <CustomOverlayMap
                    key={idx}
                    position={{ lat: store.latitude, lng: store.longitude }}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`${bgColor} bg-opacity-90 border-2 ${borderColor} rounded-md px-3 py-1.5 shadow-lg flex flex-col items-center`}>
                        <span className="text-white font-bold text-xs whitespace-nowrap mb-0.5">{store.region_name}</span>
                        <span className="text-[#ffdea4] font-black text-sm">{store.storeCount.toLocaleString()}개</span>
                      </div>
                      <div className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${arrowColor}`}></div>
                    </div>
                  </CustomOverlayMap>
                );
              })}
            </Map>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
              {scriptError ? "카카오맵 로드 중 에러가 발생했습니다." : "지도를 로드 중입니다..."}
              {!kakaoApiKey && <p className="text-sm mt-2 text-red-500">API Key가 설정되지 않았습니다.</p>}
            </div>
          )}

          {/* Floating Search/Selection */}
          <div className="absolute bottom-12 left-12 right-12 flex justify-center items-end pointer-events-none z-10">
            <div className="pointer-events-auto bg-white p-6 border border-gray-300 shadow-xl rounded-lg w-full max-w-2xl flex gap-6">
              {/* Region Search */}
              <div className="flex flex-col gap-2 flex-1 relative">
                <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                  지역 선택
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-300 focus:border-[#005a82] focus:ring-0 text-sm py-3 px-4 rounded"
                    placeholder="지역명을 입력하세요..."
                    value={regionSearch}
                    onChange={(e) => {
                      setRegionSearch(e.target.value);
                      setIsRegionOpen(true);
                    }}
                    onFocus={() => setIsRegionOpen(true)}
                  />
                  {isRegionOpen && filteredRegions.length > 0 && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-md z-50">
                      {filteredRegions.map((r) => (
                        <div
                          key={r.regionCode}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setSelectedRegion(r.regionCode);
                            setRegionSearch(`${r.cityName} ${r.countyName}`);
                            setIsRegionOpen(false);
                          }}
                        >
                          {r.cityName} {r.countyName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Industry Search */}
              <div className="flex flex-col gap-2 flex-1 relative">
                <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                  업종 선택
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-300 focus:border-[#005a82] focus:ring-0 text-sm py-3 px-4 rounded"
                    placeholder="업종명을 입력하세요..."
                    value={industrySearch}
                    onChange={(e) => {
                      setIndustrySearch(e.target.value);
                      setIsIndustryOpen(true);
                    }}
                    onFocus={() => setIsIndustryOpen(true)}
                  />
                  {isIndustryOpen && filteredIndustries.length > 0 && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-md z-50">
                      {filteredIndustries.map((ind) => (
                        <div
                          key={ind.ksicCode}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setSelectedIndustry(ind.ksicCode);
                            setIndustrySearch(ind.industryName);
                            setIsIndustryOpen(false);
                          }}
                        >
                          {ind.industryName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Technical Data Panel */}
        <aside className="bg-gray-50 overflow-y-auto px-8 py-10 border-l border-gray-200 relative">
          {isLoadingData && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#005a82] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-[#005a82]">데이터 분석 중...</p>
            </div>
          )}
          {storesData ? (
            <div className="space-y-10">
              <section>
                <h2 className="text-xs font-bold tracking-[0.2em] text-[#7b5900] uppercase mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  업소 통계
                </h2>
                <div className="bg-white border border-[#005a82]/20 shadow-sm p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#004260] tracking-tight">전국 통계</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">Total Overview</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-md">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">전체 업소 수</p>
                      <p className="text-2xl font-black text-[#004260]">
                        {storesData.totalStoreCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-md">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">지역당 평균</p>
                      <p className="text-2xl font-black text-[#004260]">
                        {storesData.avgStoreCount.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-[0.2em] text-[#7b5900] uppercase mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  업소수 상위 지역
                </h2>
                <div className="space-y-4">
                  {storesData.topRegions.map((region, idx) => (
                    <div key={idx} className="flex flex-col gap-1 bg-white p-3 rounded border border-gray-100 shadow-sm">
                      <div className="flex justify-between text-xs font-bold tracking-tight">
                        <span className="text-gray-700">{region.region_name}</span>
                        <span className="text-[#005a82]">{region.storeCount.toLocaleString()} 개</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#005a82] rounded-full"
                          style={{
                            width: `${Math.min(100, (region.storeCount / storesData.topRegions[0].storeCount) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-[0.2em] text-[#7b5900] uppercase mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">trending_down</span>
                  업소수 하위 지역
                </h2>
                <div className="space-y-4">
                  {storesData.bottomRegions.map((region, idx) => (
                    <div key={idx} className="flex flex-col gap-1 bg-white p-3 rounded border border-gray-100 shadow-sm">
                      <div className="flex justify-between text-xs font-bold tracking-tight">
                        <span className="text-gray-700">{region.region_name}</span>
                        <span className="text-[#ba1a1a]">{region.storeCount.toLocaleString()} 개</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <span className="material-symbols-outlined text-4xl">map</span>
              <p className="text-sm font-medium">업종을 선택하면 상세 분석이 표시됩니다.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
