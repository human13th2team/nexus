'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">❌</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">결제에 실패했습니다</h1>
          <p className="text-slate-500 font-medium">
            {message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <p className="text-xs text-slate-400 font-mono">Error Code: {code}</p>
        </div>

        <div className="pt-4 space-y-3">
          <button 
            onClick={() => window.history.back()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all"
          >
            다시 시도하기
          </button>
          <Link 
            href="/"
            className="block w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
