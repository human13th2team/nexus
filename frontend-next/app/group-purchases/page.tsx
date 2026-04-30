'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface GroupBuy {
  id: string;
  title: string;
  itemName: string;
  itemPrice: number;
  targetCount: number;
  currentCount: number;
  endDate: string;
  status: string;
  imageUrl: string;
  region: string;
}

export default function GroupBuyListPage() {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date().getTime());
  
  // 검색 및 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // 현재 시간 업데이트 (1분마다)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 검색 및 필터링 로직
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchKeyword) params.append('itemName', searchKeyword);
    if (selectedRegion && selectedRegion !== '전체') params.append('region', selectedRegion);

    const url = params.toString() 
      ? `http://localhost:8080/api/v1/group-purchases/search?${params.toString()}`
      : 'http://localhost:8080/api/v1/group-purchases';

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setGroupBuys(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching group purchases:', err);
        setIsLoading(false);
      });
  }, [searchKeyword, selectedRegion]);

  const regions = [
    "전체", "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-2 block">Premium Marketplace</span>
            <h1 className="text-5xl font-black text-[#0f172a] tracking-tight">
              Nexus <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">공동구매</span>
            </h1>
            <p className="text-slate-500 mt-3 text-lg font-medium">함께할수록 가격은 가벼워지고, 가치는 더해집니다.</p>
          </div>
          <Link href="/group-purchases/create">
            <button className="px-8 py-4 bg-[#0f172a] text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
              <span className="text-xl">+</span> 공동구매 등록
            </button>
          </Link>
        </header>

        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="찾으시는 물품명을 입력해 주세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-medium transition-all"
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
          <div className="md:w-64 relative">
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-6 py-5 bg-[#0f172a] text-white rounded-2xl border-none outline-none text-lg font-bold appearance-none cursor-pointer shadow-lg hover:bg-blue-600 transition-all"
            >
              {regions.map(r => (
                <option key={r} value={r} className="bg-white text-slate-800">{r === '전체' ? '지역 전체' : r}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : groupBuys.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xl font-medium mb-6">등록된 공동구매가 없습니다.</p>
            <Link href="/group-purchases/create">
              <span className="text-blue-600 font-bold hover:underline cursor-pointer">첫 번째 공동구매를 등록해 보세요!</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {groupBuys.map((gb) => {
              const progress = (gb.currentCount / gb.targetCount) * 100;
              const isExpired = new Date(gb.endDate).getTime() <= now;
              const isCompleted = gb.status === 'COMPLETED' || progress >= 100;

              return (
                <Link href={`/group-purchases/${gb.id}`} key={gb.id}>
                  <div className="group bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 shadow-sm">
                    <div className="relative h-64 w-full overflow-hidden">
                      <img 
                        src={gb.imageUrl || 'https://images.unsplash.com/photo-1517254456976-ee8682099819?q=80&w=500&auto=format&fit=crop'} 
                        alt={gb.itemName}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${isExpired && 'grayscale'}`}
                      />
                      <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm border border-white/50">
                        📍 {gb.region}
                      </div>
                      <div className={`absolute bottom-5 right-5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-lg text-white ${
                        isExpired || isCompleted ? 'bg-slate-500' : 'bg-blue-600'
                      }`}>
                        {isExpired ? '마감됨' : isCompleted ? '모집 완료' : '모집 중'}
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <h3 className={`text-xl font-bold mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors ${isExpired ? 'text-slate-400' : 'text-[#1e293b]'}`}>
                        {gb.title}
                      </h3>
                      
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <span className="text-sm text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Price</span>
                          <span className={`text-2xl font-black ${isExpired ? 'text-slate-400' : 'text-[#0f172a]'}`}>
                            {gb.itemPrice.toLocaleString()}<span className="text-lg ml-0.5 font-bold text-slate-400">원</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Deadline</span>
                          <span className={`font-bold ${isExpired ? 'text-red-400' : 'text-slate-700'}`}>
                            {isExpired ? '종료됨' : new Date(gb.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end mb-1">
                          <span className={`font-black text-lg ${isExpired ? 'text-slate-400' : 'text-blue-600'}`}>{progress.toFixed(0)}%</span>
                          <span className="text-slate-400 text-sm font-bold">{gb.currentCount}명 참여 중 <span className="text-slate-300 mx-1">/</span> {gb.targetCount}명</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                              isExpired ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
