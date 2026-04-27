'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

declare global {
  interface Window {
    TossPayments: any;
  }
}

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
  description: string;
}

export default function GroupBuyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [gb, setGb] = useState<GroupBuy | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/group-buys/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setGb(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching group buy detail:', err);
        setIsLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (!gb) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const targetDate = new Date(gb.endDate).getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft(prev => ({ ...prev, isExpired: true }));
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isExpired: false
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gb]);

  const handlePayment = async (provider: string) => {
    if (!gb || timeLeft.isExpired) return;

    if (provider === 'TOSS') {
      const clientKey = "test_ck_kYG57Eba3G9lxJR12bvlrpWDOxmA";
      
      if (typeof window !== 'undefined' && window.TossPayments) {
        const tossPayments = window.TossPayments(clientKey);
        
        try {
          await tossPayments.requestPayment('카드', {
            amount: gb.itemPrice,
            orderId: `ORDER_${Date.now()}`,
            orderName: gb.itemName,
            successUrl: `${window.location.origin}/group-buys/${gb.id}/success`,
            failUrl: `${window.location.origin}/group-buys/${gb.id}/fail`,
          });
        } catch (error: any) {
          if (error.code !== 'USER_CANCEL') {
            console.error('Toss payment error:', error);
            alert('결제창을 띄우는 중 오류가 발생했습니다.');
          }
        }
      } else {
        alert('토스 결제 모듈이 아직 로드되지 않았습니다.');
      }
    } else if (provider === 'KAKAO_PAY') {
      // 카카오페이는 즉시 성공 페이지로 이동 (시뮬레이션)
      const mockOrderId = `KAKAO_${Date.now()}`;
      router.push(`/group-buys/${gb.id}/success?orderId=${mockOrderId}&paymentKey=MOCK_KAKAOPAY&amount=${gb.itemPrice}`);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center font-bold text-blue-600">Loading...</div>;
  if (!gb) return <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center font-bold">항목을 찾을 수 없습니다.</div>;

  const progress = (gb.currentCount / gb.targetCount) * 100;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
        >
          ← 목록으로 돌아가기
        </button>

        <div className="flex flex-col lg:flex-row gap-16 mt-4">
          <div className="lg:w-3/5 space-y-12">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-white shadow-slate-200">
              <img 
                src={gb.imageUrl || 'https://images.unsplash.com/photo-1517254456976-ee8682099819?q=80&w=1200&auto=format&fit=crop'} 
                alt={gb.itemName}
                className="w-full h-auto object-cover aspect-video"
              />
              <div className="absolute top-8 left-8 flex gap-3">
                <span className={`px-5 py-2 rounded-full text-sm font-black shadow-lg ${timeLeft.isExpired ? 'bg-slate-500 text-white' : 'bg-blue-600 text-white'}`}>
                  {timeLeft.isExpired ? '모집 마감' : '모집 중'}
                </span>
                <span className="bg-white/90 backdrop-blur-md text-slate-800 px-5 py-2 rounded-full text-sm font-bold border border-white/50 shadow-sm">
                  📍 {gb.region}
                </span>
              </div>
            </div>

            <div className="space-y-6 px-4">
              <h2 className="text-3xl font-black text-[#0f172a]">제품 상세 정보</h2>
              <div className="h-1.5 w-20 bg-blue-600 rounded-full"></div>
              <p className="text-slate-600 leading-relaxed text-xl font-medium whitespace-pre-line">
                {gb.description}
              </p>
            </div>
          </div>

          <div className="lg:w-2/5">
            <div className="sticky top-12 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10">
              <div>
                <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-2 block">Premium Group Buy</span>
                <h1 className="text-4xl font-black text-[#0f172a] leading-tight mb-4">{gb.title}</h1>
                <p className="text-slate-400 font-semibold text-lg">{gb.itemName}</p>
              </div>

              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-black text-blue-600">{gb.itemPrice.toLocaleString()}원</span>
                <span className="text-xl text-slate-300 line-through font-bold mb-1.5 italic">Early Bird</span>
              </div>

              <div className={`rounded-[2rem] p-6 border text-center transition-colors ${timeLeft.isExpired ? 'bg-slate-100 border-slate-200' : 'bg-blue-50/50 border-blue-100'}`}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  {timeLeft.isExpired ? '모집이 마감되었습니다' : '마감까지 남은 시간'}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Mins', value: timeLeft.minutes },
                    { label: 'Secs', value: timeLeft.seconds }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className={`text-3xl font-black tabular-nums ${timeLeft.isExpired ? 'text-slate-400' : 'text-[#0f172a]'}`}>
                        {String(item.value).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-indigo-600">{progress.toFixed(0)}% 달성</span>
                  <span className="text-slate-500 font-bold">{gb.currentCount} <span className="text-slate-300">/</span> {gb.targetCount}명</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-inner transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  disabled={timeLeft.isExpired}
                  onClick={() => handlePayment('TOSS')}
                  className={`w-full py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl transform active:scale-95 ${
                    timeLeft.isExpired ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'
                  }`}
                >
                  <ShoppingBag className="w-6 h-6" />
                  {timeLeft.isExpired ? '모집이 마감되었습니다' : '결제하고 참여하기'}
                </button>
                <p className="text-center text-xs text-slate-400 font-medium">
                  토스 페이먼츠의 안전한 결제 시스템을 이용합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
