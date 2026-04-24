"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  LayoutGrid, 
  Trash2, 
  ExternalLink,
  Rocket,
  Palette,
  LineChart,
  ShieldCheck,
} from "lucide-react";

// Types matching backend DTOs
interface Brand {
  id: string;
  title: string;
  industryCategoryId: string;
  currentStep: string;
  createdAt?: string; // We'll mock this for now as it's not in DTO yet
}

const API_BASE_URL = "http://localhost:8080/api/v1";
const TARGET_USER_ID = "a248bb6e-7302-4b48-9375-c23ee477ea45";

export default function BrandListPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/branding?userId=${TARGET_USER_ID}`);
        if (!res.ok) throw new Error("Failed to fetch brands");
        const data = await res.json();
        setBrands(data);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleDelete = async () => {
    if (!selectedBrandId) return;
    if (confirm("정말 이 브랜드를 삭제하시겠습니까?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/branding/${selectedBrandId}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          setBrands(brands.filter(b => b.id !== selectedBrandId));
          setSelectedBrandId(null);
        } else {
          alert("삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("Delete failed:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'tech': return <Rocket className="w-12 h-12 text-blue-500" />;
      case 'design': return <Palette className="w-12 h-12 text-purple-500" />;
      case 'marketing': return <LineChart className="w-12 h-12 text-green-500" />;
      case 'e-commerce': return <ShieldCheck className="w-12 h-12 text-orange-500" />;
      default: return <LayoutGrid className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="text-center mb-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-5xl font-black tracking-tighter">Welcome Back,<br />Entrepreneur!</h2>
            <p className="text-gray-500 font-medium">Manage and revisit your created brands.</p>
          </div>
          
          <Link 
            href="/branding/create"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
          >
            Create New Brand <Plus className="w-5 h-5" />
          </Link>

          <div className="flex items-center justify-center gap-4 pt-4">
            {['Overview', 'Analytics', 'Support'].map((tab) => (
              <button 
                key={tab}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === 'Overview' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand History Grid */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black tracking-tight">Your Brand History</h3>
                <p className="text-gray-400 font-medium">Review the brands you've created.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-50 animate-pulse rounded-3xl" />
                ))
              ) : (
                brands.map((brand) => (
                  <div 
                    key={brand.id}
                    onClick={() => setSelectedBrandId(brand.id)}
                    className={`group relative aspect-square flex flex-col items-center justify-center p-8 rounded-[2.5rem] transition-all cursor-pointer border-2 ${
                      selectedBrandId === brand.id 
                      ? 'bg-white border-black shadow-2xl shadow-black/5 -translate-y-2' 
                      : 'bg-white border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    <div className="mb-6 transform transition-transform group-hover:scale-110 duration-500">
                      {getIndustryIcon(brand.industryCategoryId)}
                    </div>
                    <h4 className="text-xl font-black mb-1">{brand.title}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{brand.industryCategoryId}</p>
                    <div className="text-center">
                      <p className="text-2xl font-black leading-tight">Created on:<br />{brand.createdAt}</p>
                    </div>
                    {selectedBrandId === brand.id && (
                      <div className="absolute top-6 right-6">
                        <ShieldCheck className="w-6 h-6 text-black" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Action Panel */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="sticky top-32">
              <h3 className="text-3xl font-black tracking-tight mb-2">Brand Overview and Actions</h3>
              <p className="text-gray-400 font-medium mb-8">Manage your brand information and assets.</p>

              <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                {selectedBrand ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                        {getIndustryIcon(selectedBrand.industryCategoryId)}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">{selectedBrand.title}</h4>
                        <p className="text-sm text-gray-500">{selectedBrand.industryCategoryId}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase tracking-wider">
                          {selectedBrand.currentStep}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={handleDelete}
                        className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-gray-100 rounded-2xl hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all group"
                      >
                        <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">Delete Brand</span>
                      </button>
                      <Link 
                        href={`/branding/${selectedBrand.id}`}
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all transform hover:scale-[1.02]"
                      >
                        <ExternalLink className="w-6 h-6" />
                        <span className="text-xs font-bold">View Details</span>
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h5>
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-black rounded-full" />
                              <span className="text-xs font-medium">Logo updated</span>
                            </div>
                            <span className="text-[10px] text-gray-400">2d ago</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-200">
                      <LayoutGrid className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Select a Brand</h4>
                      <p className="text-sm text-gray-400">Choose a brand to manage</p>
                      <p className="text-xs text-gray-400 mt-2">Click on the brand card to view detailed options.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

    </div>
  );
}
