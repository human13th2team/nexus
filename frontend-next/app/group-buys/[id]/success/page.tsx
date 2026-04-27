'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const confirmParticipation = async () => {
      // 로그인된 userId를 가져오고, 없으면 테스트용 ID 사용
      const userId = localStorage.getItem('userId') || 'd38bc69d-9660-4e11-a50d-9ee90ff38673';
      
      try {
        const response = await fetch(`http://localhost:8080/api/v1/group-buys/${params.id}/confirm-payment?userId=${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey: paymentKey,
            orderId: orderId,
            amount: Number(amount)
          }),
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error confirming participation:', error);
        setStatus('error');
      }
    };

    if (orderId && paymentKey) {
      confirmParticipation();
    }
  }, [params.id, orderId, paymentKey]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200 text-center space-y-8 border border-slate-100">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
            <h1 className="text-2xl font-black text-slate-800">결제 정보를 확인 중입니다...</h1>
            <p className="text-slate-400 font-bold">잠시만 기다려 주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-3xl font-black text-[#0f172a] leading-tight">
              공동구매 참여 <span className="text-blue-600">성공!</span>
            </h1>
            <div className="bg-blue-50 rounded-2xl p-6 space-y-2">
              <p className="text-slate-600 font-bold">주문번호: <span className="text-blue-600">{orderId}</span></p>
              <p className="text-slate-600 font-bold">결제금액: <span className="text-blue-600">{Number(amount).toLocaleString()}원</span></p>
            </div>
            <p className="text-slate-500 font-medium">
              함께해주셔서 감사합니다.<br/>목표 인원이 달성되면 안내해 드릴게요!
            </p>
            <button 
              onClick={() => router.push('/group-buys')}
              className="w-full py-5 bg-[#0f172a] hover:bg-blue-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl transform active:scale-95"
            >
              목록으로 돌아가기
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-7xl mb-6">⚠️</div>
            <h1 className="text-3xl font-black text-red-600">문제가 발생했습니다</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              결제는 완료되었으나 참여 정보 저장 중 오류가 발생했습니다. 고객센터로 문의해 주세요.
            </p>
            <button 
              onClick={() => router.push('/group-buys')}
              className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-lg transition-all"
            >
              목록으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
