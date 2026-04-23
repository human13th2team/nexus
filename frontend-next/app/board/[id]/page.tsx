"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Eye, 
  MessageSquare,
  ThumbsUp,
  Share2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  author: string;
  imageUrl?: string;
  createdAt: string;
  viewCount: number;
}

interface PostDetail extends Post {
  content: string;
}

interface TopPost {
  id: string;
  title: string;
  viewCount: number;
}

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = React.useRef(false);

  const lastFetchedId = React.useRef<string | null>(null);

  useEffect(() => {
    if (params.id) {
      if (lastFetchedId.current !== params.id) {
        lastFetchedId.current = params.id as string;
        fetchPostDetail(params.id as string);
      }
      fetchTopPosts();
      fetchPosts(currentPage);
    }
  }, [params.id, currentPage]);

  const fetchPostDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board/${id}`);
      const result = await response.json();
      
      if (result.status === "success") {
        setPost(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch post detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async (page: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board?page=${page}&size=10`);
      const result = await response.json();
      
      if (result.status === "success") {
        setPosts(result.data);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchTopPosts = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/board/top");
      const result = await response.json();
      if (result.status === "success") {
        setTopPosts(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch top posts:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3b4890] animate-spin" />
        <p className="text-zinc-500 font-medium text-sm">로딩 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-zinc-300" />
        <p className="text-zinc-500 font-medium">게시글을 찾을 수 없습니다.</p>
        <button onClick={() => router.push("/board")} className="mt-4 px-6 py-2.5 bg-[#3b4890] text-white rounded-md font-bold text-sm">목록으로</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#333]">
      {/* Top Banner / Gallery Title */}
      <div className="max-w-[1200px] mx-auto pt-10 px-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-6 mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => router.push("/board")}
          >
            <MessageSquare className="w-8 h-8 text-black transition-transform group-hover:scale-110" />
            <h1 className="text-3xl font-black text-black tracking-tight">자유게시판</h1>
          </div>
        </div>

        <div className="flex gap-8 mb-12">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Post Header */}
            <div className="bg-[#fcfcfc] border-t border-zinc-200 py-3 px-4 mb-1">
              <h2 className="text-[15px] font-bold">
                <span className="text-zinc-500 mr-1">[일반]</span> {post.title}
              </h2>
            </div>
            <div className="border-b border-zinc-100 py-2 px-4 flex justify-between items-center text-[12px]">
              <div className="flex items-center gap-2">
                <span className="font-bold">{post.author}</span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-500">{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-500">
                <div className="flex items-center gap-1">
                  <span className="bg-zinc-200 w-5 h-5 rounded-sm flex items-center justify-center"><Share2 className="w-3 h-3 text-white fill-white" /></span>
                </div>
                <div className="flex items-center gap-1">
                  <span>조회 {post.viewCount}</span>
                  <span className="text-zinc-300">|</span>
                  <span>추천 0</span>
                  <span className="text-zinc-300">|</span>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-bold">댓글 0</span>
                </div>
              </div>
            </div>

            {/* Post Body */}
            <div className="py-8 px-4 min-h-[400px]">
              <div className="text-[14px] leading-relaxed mb-8 whitespace-pre-wrap font-medium">
                {post.content}
              </div>
              
              {post.imageUrl && (
                <div className="relative inline-block max-w-full">
                  <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className="max-w-full h-auto border border-zinc-200"
                  />
                  <button className="absolute bottom-4 right-4 bg-black/60 hover:bg-black text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all">
                    <span>댓글 열기</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center gap-3 py-12 border-t border-zinc-100">
              <button className="flex flex-col items-center justify-center w-20 h-20 border border-zinc-200 rounded hover:bg-zinc-50 transition-all group">
                <ThumbsUp className="w-6 h-6 text-zinc-400 group-hover:text-[#3b4890] mb-1" />
                <span className="text-[12px] font-bold text-zinc-600">0</span>
              </button>
              <button className="flex flex-col items-center justify-center w-20 h-20 border border-zinc-200 rounded hover:bg-zinc-50 transition-all">
                <MessageSquare className="w-6 h-6 text-zinc-400 mb-1" />
                <span className="text-[12px] font-bold text-zinc-600">댓글</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="w-full bg-[#f2f2f2] border border-zinc-200 p-4 rounded-sm mb-4 h-[250px] flex flex-col items-center justify-center text-zinc-400 text-sm">
              <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Info className="w-6 h-6 text-[#3b4890]" />
                </div>
                <p className="font-bold text-zinc-600">광고 및 추천<br/>영역입니다</p>
              </div>
            </div>
            
            <div className="border border-zinc-200 rounded-sm p-4 text-[12px]">
              <h3 className="font-bold border-b border-zinc-100 pb-2 mb-2 text-[#3b4890]">인기 게시물</h3>
              <ul className="space-y-2">
                {topPosts.map((tp) => (
                  <li 
                    key={tp.id} 
                    onClick={() => router.push(`/board/${tp.id}`)}
                    className="flex justify-between text-zinc-600 hover:underline cursor-pointer group"
                  >
                    <span className="truncate mr-2 group-hover:text-black transition-colors">{tp.title}</span>
                    <span className="text-zinc-400">{tp.viewCount}</span>
                  </li>
                ))}
                {topPosts.length === 0 && (
                  <li className="text-center py-4 text-zinc-400">인기글이 없습니다.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Board List Bottom Section - SAME UI AS MAIN BOARD */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#3b4890]">전체 글 목록</h3>
            <button 
              onClick={() => router.push("/board/create")}
              className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
            >
              <Plus className="w-3.5 h-3.5" />
              글쓰기
            </button>
          </div>

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
                  {posts.map((p, index) => (
                    <tr 
                      key={p.id} 
                      onClick={() => {
                        if (p.id !== post.id) {
                          router.push(`/board/${p.id}`);
                        }
                      }}
                      className={cn(
                        "group hover:bg-zinc-50/50 cursor-pointer transition-all border-bottom border-zinc-50/50",
                        p.id === post.id ? "bg-zinc-50/80" : ""
                      )}
                    >
                      <td className="py-5 px-4 text-center">
                        <span className="text-sm font-medium text-zinc-400">
                          {totalElements - (currentPage * 10 + index)}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className={cn(
                          "text-zinc-900 font-bold group-hover:text-black transition-colors",
                          p.id === post.id ? "text-[#3b4890]" : ""
                        )}>
                          {p.title}
                          {p.id === post.id && <span className="ml-2 text-[10px] bg-[#3b4890] text-white px-1.5 py-0.5 rounded-full">읽는 중</span>}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center text-sm font-medium text-zinc-600">{p.author}</td>
                      <td className="py-5 px-4 text-center text-sm text-zinc-500">{formatDate(p.createdAt).split(' ')[0]}</td>
                      <td className="py-5 px-4 text-center text-sm text-zinc-500">{p.viewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination for bottom list */}
          <div className="flex items-center justify-center gap-6 mb-12">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-11 h-11 flex items-center justify-center bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-black hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-2 px-6 h-11 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <span className="text-sm font-bold text-black">{posts.length > 0 ? currentPage + 1 : 0}</span>
              <span className="text-zinc-300 text-xs font-bold">/</span>
              <span className="text-sm font-medium text-zinc-500">{posts.length > 0 ? totalPages : 0}</span>
            </div>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="w-11 h-11 flex items-center justify-center bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-black hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
