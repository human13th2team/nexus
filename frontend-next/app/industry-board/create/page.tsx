"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Send,
  Briefcase,
  ChevronDown,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

export default function IndustryBoardCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/industry-categories/main");
      const result = await response.json();
      if (result.status === "success") {
        setCategories(result.data);
        const urlCategoryId = searchParams.get("categoryId");
        if (urlCategoryId) {
          setSelectedCategoryId(urlCategoryId);
        } else if (result.data.length > 0) {
          setSelectedCategoryId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      alert("이미지는 최대 5장까지 업로드 가능합니다.");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedCategoryId) {
      alert("모든 필드를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      let uploadedUrls: string[] = [];

      // 1. Image Upload to FastAPI
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => formData.append("files", file));
        
        const uploadRes = await fetch("http://localhost:8000/api/v1/ai/community/upload", {
          method: "POST",
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.status === "success") {
          uploadedUrls = uploadData.image_urls;
        }
      }

      // 2. Create Post in Spring Boot
      const response = await fetch("http://localhost:8080/api/v1/board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          categoryName: "INDUSTRY",
          industryCategoryId: selectedCategoryId,
          isAnonymous,
          imageUrls: uploadedUrls
        })
      });

      const result = await response.json();
      if (result.status === "success") {
        router.push("/industry-board");
      } else {
        alert(result.message || "게시글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--nexus-primary)] animate-spin" />
        <p className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">Preparing Industry Board</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-black transition-all mb-10 group font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Cancel and Return
        </button>

        <div className="nexus-card bg-white p-8 md:p-14 shadow-2xl shadow-black/5">
          <header className="mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-primary-container)] text-[var(--nexus-primary)] rounded-full text-[10px] font-black uppercase tracking-widest">
              <Briefcase className="w-3.5 h-3.5" />
              Industry Insight
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-tight">업종별 정보 공유</h1>
            <p className="text-zinc-500 font-medium text-lg">사장님의 전문적인 지식과 경험을 나누어 주세요.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Industry Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Industry</label>
              <div className="relative">
                <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full h-16 px-8 bg-zinc-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-black text-zinc-800 appearance-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Post Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해 주세요"
                className="w-full h-20 px-8 text-2xl font-black tracking-tighter bg-zinc-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all placeholder:text-zinc-300"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Media Gallery (Max 5)</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-3xl overflow-hidden group border-2 border-zinc-100">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <label className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-3xl cursor-pointer hover:bg-zinc-50 hover:border-[var(--nexus-primary)] transition-all group">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-zinc-400 group-hover:text-[var(--nexus-primary)] transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Add Photo</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="전문적인 지식이나 궁금한 점을 자유롭게 적어주세요..."
                className="w-full min-h-[400px] p-8 bg-zinc-50 border-2 border-transparent rounded-[2.5rem] focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-lg leading-relaxed text-zinc-800 resize-none placeholder:text-zinc-300"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-[2rem]">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[var(--nexus-primary)] shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-zinc-900 text-sm">익명으로 작성</h4>
                <p className="text-xs font-medium text-zinc-500">작성자 정보가 숨겨집니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative",
                  isAnonymous ? "bg-[var(--nexus-primary)]" : "bg-zinc-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md",
                  isAnonymous ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-20 bg-black text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-2xl shadow-black/20 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              POST TO INDUSTRY BOARD
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
