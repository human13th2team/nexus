"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:8000/api/v1/ai/branding";

interface Logo {
  id: string;
  url: string;
}

interface Asset {
  id: string;
  type: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function BrandingAssetsSection({
  identity,
  logo,
  onBack,
}: {
  identity: any;
  logo: Logo;
  onBack: () => void;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  const handleGenerateAssets = async () => {
    setIsGenerating(true);
    try {
      const targetId = identity?.identityId || identity?.id;
      const response = await fetch(`${API_BASE_URL}/identity/${targetId}/assets`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        const newAssets = result.data.map((a: any) => ({
          ...a,
          imageUrl: a.imageUrl.startsWith("http")
            ? a.imageUrl
            : `http://localhost:8000${a.imageUrl}`,
        }));
        setAssets(newAssets);
      } else {
        alert(result.message || "에셋 생성에 실패했습니다.");
      }
    } catch (err) {
      console.error("Asset generation error:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
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
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 1. Final Brand Logo Section (A1) */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Final Brand Logo</h2>
          <p className="text-gray-500 text-sm mt-2">Here is your final brand logo for download.</p>
        </div>

        <div className="max-w-3xl mx-auto p-8 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center p-6 border border-gray-50">
            <img src={logo.url} alt="Final Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Brand Logo</h3>
              <p className="text-sm text-gray-500 mt-1">Your unique logo for all branding needs.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button 
                onClick={() => handleDownload(logo.url, `${identity.brandName}_Logo.png`)}
                className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Download PNG
              </button>
              <button className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                Vector File
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-100 w-full" />

      {/* 2. Mockups Grid Section (A2) */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mockups of Marketing Assets</h2>
          <p className="text-gray-500 text-sm mt-2">View how your logo looks on various materials.</p>
        </div>

        {!assets.length && (
          <div className="flex justify-center">
            <button
              onClick={handleGenerateAssets}
              disabled={isGenerating}
              className="px-10 py-4 bg-black text-white rounded-2xl text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:bg-gray-400 disabled:scale-100"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Marketing Assets 생성 중...
                </>
              ) : (
                "Generate Marketing Assets"
              )}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isGenerating ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-[4/3] bg-gray-100 rounded-3xl" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-6 bg-gray-100 rounded w-3/4" />
              </div>
            ))
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="group flex flex-col gap-4">
                <div className="relative aspect-[4/3] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-medium text-xs italic">
                    {asset.title} Mockup
                  </div>
                  <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover transition-all group-hover:scale-105" />
                  <button 
                    onClick={() => handleDownload(asset.imageUrl, `${asset.title}.png`)}
                    className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  >
                    Download
                  </button>
                </div>
                <div className="px-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{asset.type}</h4>
                  <p className="text-sm font-bold text-gray-900 mt-1">{asset.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>


      {/* Bottom Actions */}
      <div className="pt-10 border-t border-gray-100 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
        >
          ← Back to Logo Generation
        </button>
        <button
          onClick={() => {
            alert("모든 브랜딩 과정이 완료되었습니다! 내 브랜딩 목록으로 이동합니다.");
            router.push("/branding");
          }}
          className="px-10 py-4 bg-green-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-green-600 transition-all"
        >
          Finish Branding
        </button>
      </div>
    </div>
  );
}
