"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  MessageSquare,
  Eye,
  Clock,
  User,
  AlertCircle,
  ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  author: string;
  imageUrls?: string[];
  createdAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
}

export default function BoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'popular'>('all');

  useEffect(() => {
    fetchPosts(currentPage, activeTab);
  }, [currentPage, activeTab]);

  const fetchPosts = async (page: number, tab: 'all' | 'popular' = 'all') => {
    setIsLoading(true);
    try {
      const baseUrl = "http://localhost:8080/api/v1/board";
      const url = tab === "popular" ? `${baseUrl}/popular` : baseUrl;
      const response = await fetch(`${url}?page=${page}&size=10`);
      const result = await response.json();
      
      if (result.status === "success") {
        setPosts(result.data);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      router.push("/auth/login");
      return;
    }
    router.push("/board/create");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 mb-2 flex items-center gap-3">
              <MessageSquare className="w-10 h-10 text-black" />
              자유게시판
            </h1>
            <p className="text-zinc-500 font-medium">넥서스 사용자들과 자유롭게 의견을 나누어 보세요.</p>
          </div>
          
          <button 
            onClick={handleCreatePost}
            className="group flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-2xl font-bold transition-all hover:bg-zinc-800 active:scale-95 shadow-lg shadow-black/5"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            게시글 작성
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 px-2">
          <button 
            onClick={() => { setActiveTab('all'); setCurrentPage(0); }}
            className={cn(
              "pb-2 text-sm font-bold transition-all border-b-2",
              activeTab === 'all' ? "border-[#3b4890] text-[#3b4890]" : "border-transparent text-zinc-400 hover:text-zinc-600"
            )}
          >
            전체글
          </button>
          <button 
            onClick={() => { setActiveTab('popular'); setCurrentPage(0); }}
            className={cn(
              "pb-2 text-sm font-bold transition-all border-b-2 flex items-center gap-1.5",
              activeTab === 'popular' ? "border-[#3b4890] text-[#3b4890]" : "border-transparent text-zinc-400 hover:text-zinc-600"
            )}
          >
            인기글
            <div className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-100 font-black">HOT</div>
          </button>
        </div>

        {/* Search Bar (Optional) */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="궁금한 내용을 검색해 보세요"
            className="w-full h-14 pl-12 pr-6 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm"
          />
        </div>

        {/* Board List Table-like cards */}
        <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-bottom border-zinc-100">
                  <th className="py-5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-20 text-center">번호</th>
                  <th className="py-5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">제목</th>
                  <th className="py-5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-28 text-center">작성자</th>
                  <th className="py-5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-28 text-center">날짜</th>
                  <th className="py-5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-20 text-center">조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-6 px-8"><div className="h-4 bg-zinc-100 rounded w-full mx-auto" /></td>
                      <td className="py-6 px-4"><div className="h-4 bg-zinc-100 rounded w-3/4 mx-auto" /></td>
                      <td className="py-6 px-4"><div className="h-4 bg-zinc-100 rounded w-16 mx-auto" /></td>
                      <td className="py-6 px-4"><div className="h-4 bg-zinc-100 rounded w-20 mx-auto" /></td>
                      <td className="py-6 px-8"><div className="h-4 bg-zinc-100 rounded w-8 mx-auto" /></td>
                    </tr>
                  ))
                ) : posts.length > 0 ? (
                  posts.map((post, index) => (
                    <tr 
                      key={post.id} 
                      className="group hover:bg-zinc-50/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/board/detail/${post.id}`)}
                    >
                    <td className="py-5 px-4 text-center">
                      <span className="text-sm font-medium text-zinc-400">
                        {totalElements - (currentPage * 10 + index)}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-zinc-900 font-bold group-hover:text-black transition-colors flex items-center justify-center gap-2">
                          {post.likeCount >= 10 && (
                            <span className="bg-red-50 text-red-500 text-[9px] px-1 py-0.5 rounded border border-red-100 font-black shrink-0">인기</span>
                          )}
                          {post.title}
                          {post.commentCount > 0 && (
                            <span className="text-[#3b4890] text-[11px] font-black shrink-0">[{post.commentCount}]</span>
                          )}
                        </span>
                      </div>
                    </td>
                      <td className="py-5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-zinc-600 font-medium text-sm">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          {post.author}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="text-sm text-zinc-500 font-medium">
                          {formatDate(post.createdAt)}
                        </span>
                      </td>
                    <td className="py-5 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          {post.viewCount}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#3b4890] font-bold">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {post.likeCount || 0}
                        </div>
                      </div>
                    </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-400">
                        <AlertCircle className="w-10 h-10 stroke-[1.5]" />
                        <p className="font-medium text-sm">등록된 게시글이 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-center gap-4">
          <button 
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="w-11 h-11 flex items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-6 h-11 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <span className="text-sm font-bold text-black">{posts.length > 0 ? currentPage + 1 : 0}</span>
            <span className="text-zinc-300 text-xs font-bold">/</span>
            <span className="text-sm font-medium text-zinc-500">{posts.length > 0 ? totalPages : 0}</span>
          </div>

          <button 
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-11 h-11 flex items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
