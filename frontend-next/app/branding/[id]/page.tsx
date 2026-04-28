"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  Rocket, 
  Palette, 
  CheckCircle2,
  Layers,
  Share2,
  Calendar
} from "lucide-react";

interface BrandIdentity {
  id: string;
  brandName: string;
  slogan: string;
  brandStory: string;
  isSelected: boolean;
  logoUrl?: string;
  marketingAssets?: {
    id: string;
    type: string;
    fileUrl: string;
  }[];
}

interface BrandDetail {
  id: string;
  title: string;
  industryCategoryId: string;
  keywords: Record<string, any>;
  currentStep: string;
  identities: BrandIdentity[];
}

const API_BASE_URL = "http://localhost:8080/api/v1";
const FASTAPI_BASE_URL = "http://localhost:8000";

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrandDetail = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/branding/${id}`);
        if (!res.ok) throw new Error("Failed to fetch brand detail");
        const data = await res.json();
        setBrand(data);
      } catch (error) {
        console.error("Failed to fetch brand detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandDetail();
  }, [id]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!brand) return <div className="min-h-screen flex items-center justify-center">Brand not found</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Overview Header */}
        <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-12 items-center">
          <div className="w-40 h-40 bg-gray-50 rounded-[2.5rem] flex items-center justify-center shrink-0">
            {brand.industryCategoryId === 'Tech' ? <Rocket className="w-20 h-20 text-blue-500" /> : <Palette className="w-20 h-20 text-purple-500" />}
          </div>
          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Project Status: {brand.currentStep}
              </span>
              <h2 className="text-4xl font-black tracking-tight">{brand.title} Identity</h2>
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {brand.keywords && Object.entries(brand.keywords).map(([key, value], i) => (
                <span key={i} className="px-4 py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-full">
                  #{typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Identities */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight">Identity Options</h3>
            <span className="text-sm font-bold text-gray-400">{brand.identities.length} Versions Generated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {brand.identities.map((identity) => (
              <div 
                key={identity.id}
                className={`p-8 rounded-[2rem] border-2 transition-all ${
                  identity.isSelected 
                  ? 'bg-white border-black shadow-xl ring-4 ring-black/5' 
                  : 'bg-white border-gray-100 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className={`w-6 h-6 ${identity.isSelected ? 'text-black' : 'text-gray-200'}`} />
                  </div>
                  {identity.isSelected && <span className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded uppercase tracking-tighter">Selected</span>}
                </div>
                <h4 className="text-2xl font-black mb-2">{identity.brandName}</h4>
                <p className="text-sm font-bold italic text-gray-400 mb-6">"{identity.slogan}"</p>
                <div className="p-4 bg-gray-50 rounded-2xl mb-6">
                  <p className="text-xs leading-relaxed text-gray-600 line-clamp-4">{identity.brandStory}</p>
                </div>
                
                {identity.isSelected && identity.logoUrl && (
                  <div className="mt-4 p-4 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Confirmed Logo</span>
                    <img 
                      src={`${FASTAPI_BASE_URL}${identity.logoUrl}`} 
                      alt="Selected Logo" 
                      className="h-20 object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Assets Preview */}
        <section className="space-y-8">
          <h3 className="text-2xl font-black tracking-tight">Brand Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brand.identities.find(i => i.isSelected)?.marketingAssets?.length ? (
              brand.identities.find(i => i.isSelected)?.marketingAssets?.map((asset) => (
                <div key={asset.id} className="group flex flex-col gap-4">
                  <div className="relative aspect-[4/3] bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
                    <img 
                      src={`${FASTAPI_BASE_URL}${asset.fileUrl}`} 
                      alt={asset.type} 
                      className="w-full h-full object-cover transition-all group-hover:scale-105" 
                    />
                  </div>
                  <div className="px-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {asset.type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {asset.type === 'BUSINESS_CARD' ? 'Business Card Mockup' : 
                       asset.type === 'MENU' ? 'Restaurant Menu Design' : 
                       asset.type === 'POSTER' ? 'Brand Promotion Poster' : 'Marketing Asset'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Palette className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">마케팅 에셋이 아직 생성되지 않았습니다.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
