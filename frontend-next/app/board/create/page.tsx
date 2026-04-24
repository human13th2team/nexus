"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  CheckCircle2,
  Lock,
  Unlock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BoardCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
   const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
        return;
      }

      // 1. 이미지 업로드 (FastAPI)
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(file => {
          formData.append("files", file);
        });

        const uploadResponse = await fetch("http://localhost:8000/api/v1/ai/community/upload", {
          method: "POST",
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResult.status === "success") {
          imageUrls = uploadResult.urls;
        }
      }

      // 2. 게시글 저장 (Spring Boot)
      const response = await fetch("http://localhost:8080/api/v1/board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          isAnonymous,
          imageUrls,
          regionName: null,
          categoryName: "FREE"
        })
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("게시글이 성공적으로 작성되었습니다.");
        router.push("/board");
      } else {
        alert(result.message || "작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">목록으로 돌아가기</span>
        </button>

        <div className="bg-white rounded-[40px] border border-zinc-100 shadow-xl shadow-zinc-200/20 overflow-hidden">
          <div className="p-8 md:p-12">
            <header className="mb-10">
              <h1 className="text-3xl font-black tracking-tighter text-zinc-900 mb-2">새 게시글 작성</h1>
              <p className="text-zinc-500 font-medium">당신의 생각을 자유롭게 공유해 보세요.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900 ml-1">제목</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력해 주세요"
                  className="w-full h-14 px-6 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all font-medium text-zinc-900"
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-zinc-900">사진 첨부 ({images.length}장)</label>
                  <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-600 transition-all flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    추가하기
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                  </label>
                </div>
                
                {imagePreviews.length === 0 ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[32px] cursor-pointer hover:bg-zinc-100/50 hover:border-zinc-300 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-sm text-zinc-500 font-medium">클릭하여 사진 업로드 (여러 장 가능)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                  </label>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group shadow-md">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">대표</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900 ml-1">내용</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="따뜻한 커뮤니티를 위해 서로를 존중하는 마음을 담아주세요."
                  rows={8}
                  className="w-full p-6 bg-zinc-50 border border-zinc-100 rounded-[32px] focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all font-medium text-zinc-900 resize-none"
                />
              </div>

              {/* Options & Submit */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-zinc-50">
                <button 
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all active:scale-95",
                    isAnonymous 
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  {isAnonymous ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span className="font-bold text-sm">익명으로 작성하기</span>
                  {isAnonymous && <CheckCircle2 className="w-4 h-4 text-white/50" />}
                </button>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all hover:bg-zinc-800 active:scale-95 shadow-lg shadow-black/10 disabled:bg-zinc-300 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>처리 중...</span>
                    </>
                  ) : (
                    <span>게시글 등록하기</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
