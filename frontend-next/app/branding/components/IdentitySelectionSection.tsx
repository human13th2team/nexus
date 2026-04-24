"use client";

import { useState } from "react";

interface Identity {
  identityId: string; // 백엔드 UUID 규격에 맞춤
  brandName: string;
  slogan: string;
  brandStory: string;
  keywords: string[];
}

const mockIdentities: Identity[] = [
  {
    identityId: "550e8400-e29b-41d4-a716-446655440000",
    brandName: "네이처링크 (NatureLink)",
    slogan: "자연과 일상을 잇는 건강한 연결",
    brandStory: "친환경 소재와 지속 가능한 가치를 우선시하는 정직한 브랜드입니다.",
    keywords: ["친환경", "미니멀", "신뢰"],
  },
  {
    identityId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    brandName: "테크에지 (TechEdge)",
    slogan: "기술의 경계를 넓히는 혁신",
    brandStory: "최신 기술력과 세련된 디자인으로 미래를 선도하는 프리미엄 브랜드입니다.",
    keywords: ["혁신", "정밀", "미래지향"],
  },
  {
    identityId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    brandName: "데일리허브 (DailyHub)",
    slogan: "매일의 일상을 더 편리하게",
    brandStory: "친근하고 편리한 서비스로 고객의 일상 속에 자연스럽게 스며드는 브랜드입니다.",
    keywords: ["친근함", "편리함", "일상"],
  },
];

export default function IdentitySelectionSection({
  namingOptions,
  onBack,
  onComplete,
}: {
  namingOptions: Identity[];
  onBack: () => void;
  onComplete: (identity: Identity) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 데이터가 없을 경우를 대비한 방어 코드
  if (!namingOptions || namingOptions.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500">추천된 브랜드 정보가 없습니다. 다시 시도해 주세요.</p>
        <button onClick={onBack} className="mt-4 text-sm font-bold text-black underline">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">추천 브랜드 아이덴티티</h2>
        <p className="text-gray-500 text-sm">대표님의 답변을 바탕으로 AI가 분석한 최적의 브랜드 후보입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {namingOptions.map((item) => (
          <div
            key={item.identityId}
            onClick={() => setSelectedId(item.identityId)}
            className={`cursor-pointer group relative p-6 border-2 rounded-2xl transition-all duration-300 hover:shadow-lg ${
              selectedId === item.identityId
                ? "border-black bg-white shadow-xl -translate-y-1"
                : "border-gray-100 bg-gray-50 hover:border-gray-300"
            }`}
          >
            {selectedId === item.identityId && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{item.brandName}</h3>
                <p className="text-sm text-gray-500 font-medium">{item.slogan}</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                {item.brandStory}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.keywords?.map((kw) => (
                  <span key={kw} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-200 text-gray-700 rounded">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-gray-100">
        <button
          onClick={onBack}
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 이전 단계로
        </button>
        <button
          disabled={!selectedId}
          onClick={() => {
            const selected = namingOptions.find(i => i.identityId === selectedId);
            if (selected) onComplete(selected);
          }}
          className={`px-8 py-4 rounded-xl text-sm font-bold transition-all ${
            selectedId
              ? "bg-black text-white hover:bg-gray-800 shadow-md transform hover:scale-[1.02]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          브랜드 확정 및 로고 제작하기
        </button>
      </div>
    </div>
  );
}

