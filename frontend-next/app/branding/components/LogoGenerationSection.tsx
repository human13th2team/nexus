"use client";

import { useState } from "react";

const API_BASE_URL = "http://localhost:8000/api/v1/ai/branding";

interface Logo {
  id: string;
  url: string;
}

export default function LogoGenerationSection({
  identity,
  onBack,
  onComplete,
}: {
  identity: any;
  onBack: () => void;
  onComplete: (logo: Logo) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateLogos = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const targetId = identity?.identityId || identity?.id; 
      
      const response = await fetch(`${API_BASE_URL}/identity/${targetId}/logo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        // 백엔드에서 tempId와 imageUrl로 넘어옴
        const newLogos: Logo[] = result.data.map((item: any) => ({
          id: item.tempId,
          url: item.imageUrl.startsWith('http') 
            ? item.imageUrl 
            : `http://localhost:8000${item.imageUrl}`
        }));
        setLogos(newLogos);
        if (newLogos.length > 0) setSelectedLogoId(newLogos[0].id);
      } else {
        throw new Error(result.message || "로고 생성에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("Logo generation error:", err);
      setError(err.message || "백엔드 서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSelection = async () => {
    const selected = logos.find(l => l.id === selectedLogoId);
    if (!selected) return;

    setIsFinalizing(true);
    try {
      const targetId = identity?.identityId || identity?.id;
      // 상대 경로만 추출 (http://localhost:8000 제거)
      const relativeUrl = selected.url.replace("http://localhost:8000", "");

      const response = await fetch(`${API_BASE_URL}/identity/${targetId}/logo/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: relativeUrl }),
      });

      const result = await response.json();
      if (result.success) {
        // 확정된 ID와 함께 완료 처리
        onComplete({ ...selected, id: result.logoAssetId });
      } else {
        throw new Error(result.message || "로고 확정에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "서버에 로고를 저장하는 중 오류가 발생했습니다.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Logo Recommendations</h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          AI가 제안하는 3가지 컨셉입니다. 이 시점에는 아직 DB에 저장되지 않으며, 대표님이 하나를 **최종 선택(Confirm)** 하시는 순간 정식으로 등록됩니다.
        </p>
        {!logos.length && (
          <div className="pt-4">
            <button
              onClick={generateLogos}
              disabled={isGenerating}
              className={`px-10 py-4 bg-black text-white rounded-2xl text-sm font-bold transition-all shadow-xl hover:scale-105 active:scale-95 ${
                isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
              }`}
            >
              {isGenerating ? "디자인 제안 중..." : "Generate 3 Logo Concepts"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-10">
        {/* Top Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand Name</h4>
              <p className="text-lg font-bold text-gray-900">{identity?.brandName}</p>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slogan</h4>
              <p className="text-sm font-medium text-gray-600 italic">"{identity?.slogan}"</p>
            </div>
          </div>
        </div>

        {/* Logos Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Recommended Designs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isGenerating ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-gray-50 rounded-3xl border-2 border-gray-100 flex flex-col items-center justify-center gap-4 animate-pulse">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Designing Opt 0{i}...</p>
                </div>
              ))
            ) : logos.length > 0 ? (
              logos.map((logo, idx) => (
                <div
                  key={logo.id}
                  className={`group relative flex flex-col gap-3`}
                >
                  <div 
                    onClick={() => setSelectedLogoId(logo.id)}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-3xl border-4 transition-all duration-500 ${
                      selectedLogoId === logo.id
                        ? "border-black bg-white shadow-2xl -translate-y-2"
                        : "border-transparent bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <img
                      src={logo.url}
                      alt={`Logo Option ${idx + 1}`}
                      className="w-full h-full object-contain p-10 transition-transform duration-700 group-hover:scale-110"
                    />
                    {selectedLogoId === logo.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Download Option */}
                  <button 
                    onClick={() => handleDownload(logo.url, `Logo_Option_${idx+1}.png`)}
                    className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-gray-400 hover:text-black transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    DOWNLOAD PNG
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 gap-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">상단의 버튼을 눌러 디자인 제안을 받아보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <button
          onClick={onBack}
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
        >
          ← Back to Identity Selection
        </button>

        <div className="flex gap-4 w-full md:w-auto">
          {logos.length > 0 && (
            <button
              onClick={generateLogos}
              disabled={isGenerating || isFinalizing}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate Logo
            </button>
          )}
          <button
            disabled={!selectedLogoId || isGenerating || isFinalizing}
            onClick={handleConfirmSelection}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
              selectedLogoId && !isGenerating && !isFinalizing
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
            }`}
          >
            {isFinalizing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
            Confirm Final Selection
          </button>
        </div>
      </div>
    </div>
  );
}

