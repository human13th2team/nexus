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
  Plus,
  CornerDownRight
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  author: string;
  authorId: string;
  imageUrls?: string[];
  createdAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  regionName?: string;
}

interface PostDetail extends Post {
  content: string;
}

interface TopPost {
  id: string;
  title: string;
  viewCount: number;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  reportCount: number;
  children: Comment[];
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPostDetail(params.id as string);
      fetchComments(params.id as string);
      fetchLikeStatus(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPosts(currentPage);
    fetchTopPosts();
  }, [currentPage]);

  const fetchPostDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board/${id}`);
      const result = await response.json();
      
      if (result.status === "success") {
        setPost(result.data);
        setEditTitle(result.data.title);
        setEditContent(result.data.content);
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
      // 자유게시판 인기글 가져오기 (상위 3개)
      const response = await fetch(`http://localhost:8080/api/v1/board/popular?page=0&size=3`);
      const result = await response.json();
      if (result.status === "success") {
        setTopPosts(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch top posts:", error);
    }
  };

  const fetchComments = async (id: string = params.id as string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/comments/${id}`);
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.status === "success") {
        setComments(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };
  
  const fetchLikeStatus = async (id: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board/like/${id}/status`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        setIsLiked(result.isLiked);
      }
    } catch (error) {
      console.error("Failed to fetch like status:", error);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      router.push("/auth/login");
      return;
    }

    if (isLikeLoading) return;

    setIsLikeLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board/like/${params.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        setIsLiked(result.isLiked);
        fetchPostDetail(params.id as string);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (parentId: string | null = null) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      router.push("/auth/login");
      return;
    }

    const content = parentId ? replyContent : commentContent;
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/comments/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          parentId
        })
      });

      const result = await response.json();
      if (result.status === "success") {
        setCommentContent("");
        setReplyContent("");
        setReplyTargetId(null);
        fetchComments(params.id as string);
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!confirm("이 댓글을 신고하시겠습니까?")) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/comments/report/${commentId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        alert("신고가 접수되었습니다.");
        fetchComments();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("신고 처리 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          content: editCommentContent
        })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        setEditingCommentId(null);
        fetchComments();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("정말 게시글을 삭제하시겠습니까?")) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board/${params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        alert("게시글이 삭제되었습니다.");
        router.push("/board");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleUpdatePost = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/board/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          isAnonymous: post?.author === "익명",
          imageUrls: post?.imageUrls
        })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        alert("게시글이 수정되었습니다.");
        setPost(result.data);
        setIsEditing(false);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8080/api/v1/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        alert("댓글이 삭제되었습니다.");
        fetchComments(params.id as string);
      } else {
        alert(result.message || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
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
          <div className="flex-1 min-w-0">
            <div className="bg-[#fcfcfc] border-t border-zinc-200 py-3 px-4 mb-1">
              <h2 className="text-[15px] font-bold flex items-center gap-2">
                {post.likeCount >= 10 && (
                  <span className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-100 font-black">인기글</span>
                )}
                {post.title}
              </h2>
            </div>
            <div className="border-b border-zinc-100 py-2 px-4 flex justify-between items-center text-[12px]">
              <div className="flex items-center gap-2">
                <span className="font-bold">{post.author}</span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-500">{formatDate(post.createdAt)}</span>
                {typeof window !== "undefined" && post.authorId && localStorage.getItem("userId")?.toLowerCase() === post.authorId.toLowerCase() && (
                  <>
                    <span className="text-zinc-300">|</span>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-blue-500 hover:underline font-bold">
                      {isEditing ? "취소" : "수정"}
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button onClick={handleDeletePost} className="text-red-500 hover:underline font-bold">
                      삭제
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-zinc-500">
                <div className="flex items-center gap-1">조회 {post.viewCount}</div>
                <div className="flex items-center gap-1">
                  <span>추천 {post.likeCount || 0}</span>
                  <span className="text-zinc-300">|</span>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-bold">댓글 {post.commentCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="py-8 px-4 min-h-[400px]">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">제목 수정</label>
                    <input 
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-lg font-bold border border-zinc-200 rounded-lg p-3 focus:border-black outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">내용 수정</label>
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[300px] text-sm leading-relaxed border border-zinc-200 rounded-lg p-4 focus:border-black outline-none transition-colors resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg font-bold hover:bg-zinc-200 transition-all">취소</button>
                    <button onClick={handleUpdatePost} disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
                      {isSubmitting ? "저장 중..." : "수정 완료"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[14px] leading-relaxed mb-8 whitespace-pre-wrap font-medium">{post.content}</div>
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="flex flex-col gap-4 mt-6">
                      {post.imageUrls.map((url, idx) => (
                        <img key={idx} src={url} alt={`Post content ${idx}`} className="max-w-full h-auto border border-zinc-100 rounded-lg shadow-sm" />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-center gap-3 py-12 border-t border-zinc-100">
              <button 
                onClick={handleLike}
                disabled={isLikeLoading}
                className={cn("flex flex-col items-center justify-center w-20 h-20 border rounded transition-all group", isLiked ? "border-[#3b4890] bg-blue-50/30" : "border-zinc-200 hover:bg-zinc-50")}
              >
                <ThumbsUp className={cn("w-6 h-6 mb-1 transition-colors", isLiked ? "text-[#3b4890] fill-[#3b4890]/10" : "text-zinc-400 group-hover:text-[#3b4890]")} />
                <span className={cn("text-[12px] font-bold", isLiked ? "text-[#3b4890]" : "text-zinc-600")}>{post.likeCount || 0}</span>
              </button>
              <button 
                onClick={() => document.getElementById("comment-section")?.scrollIntoView({ behavior: "smooth" })}
                className="flex flex-col items-center justify-center w-20 h-20 border border-zinc-200 rounded hover:bg-zinc-50 transition-all"
              >
                <MessageSquare className="w-6 h-6 text-zinc-400 mb-1" />
                <span className="text-[12px] font-bold text-zinc-600">{post.commentCount || 0}</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="w-full bg-[#f2f2f2] border border-zinc-200 p-4 rounded-sm mb-4 h-[600px] flex flex-col items-center justify-center text-zinc-400 text-sm">
              <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex flex-col items-center justify-center gap-6 text-center p-8">
                <Info className="w-8 h-8 text-[#3b4890]" />
                <p className="font-black text-zinc-700 text-lg mb-2">PREMIUM AD</p>
                <p className="font-bold text-zinc-500 text-sm leading-relaxed">이곳에 광고를 게재할 수 있습니다</p>
              </div>
            </div>
            <div className="border border-zinc-200 rounded-sm p-4 text-[12px] min-h-[220px] flex flex-col bg-white">
              <h3 className="font-bold border-b border-zinc-100 pb-2 mb-4 text-[#3b4890] text-sm">자유게시판 인기글</h3>
              <ul className="space-y-4 flex-1">
                {topPosts.map((tp) => (
                  <li key={tp.id} onClick={() => router.push(`/board/detail/${tp.id}`)} className="flex justify-between text-zinc-600 hover:underline cursor-pointer group items-center">
                    <span className="truncate mr-2 group-hover:text-black transition-colors font-medium">{tp.title}</span>
                    <span className="text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full text-[10px]">{tp.viewCount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div id="comment-section" className="border-t border-zinc-200 pt-10">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-black" />
            <h3 className="text-lg font-bold">댓글 <span className="text-[#3b4890]">{comments.length}</span></h3>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-10">
            <textarea 
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력해주세요."
              className="w-full h-24 bg-transparent resize-none focus:outline-none text-sm"
            />
            <div className="flex justify-end mt-2">
              <button disabled={isSubmitting} onClick={() => handleCommentSubmit(null)} className="bg-[#3b4890] text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#2e3770] transition-all">
                {isSubmitting ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReport={handleReportComment}
                onReply={(id) => setReplyTargetId(id)}
                replyTargetId={replyTargetId}
                replyContent={replyContent}
                onReplyContentChange={setReplyContent}
                onReplySubmit={handleCommentSubmit}
                onDelete={handleDeleteComment}
                isSubmitting={isSubmitting}
                formatDate={formatDate}
                editingCommentId={editingCommentId}
                onSetEditingCommentId={setEditingCommentId}
                editCommentContent={editCommentContent}
                onSetEditCommentContent={setEditCommentContent}
                onUpdate={handleUpdateComment}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#3b4890]">자유게시판 전체 글 목록</h3>
            <button onClick={() => router.push("/board/create")} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-black/10">
              <Plus className="w-3.5 h-3.5" /> 글쓰기
            </button>
          </div>
          <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden mb-8">
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
                  <tr key={p.id} onClick={() => p.id !== post.id && router.push(`/board/detail/${p.id}`)} className={cn("group hover:bg-zinc-50/50 cursor-pointer transition-all", p.id === post.id ? "bg-zinc-50/80" : "")}>
                    <td className="py-5 px-4 text-center text-sm font-medium text-zinc-400">{totalElements - (currentPage * 10 + index)}</td>
                    <td className="py-5 px-4 text-center">
                      <span className={cn("text-zinc-900 font-bold", p.id === post.id ? "text-[#3b4890]" : "")}>
                        {p.title} {p.commentCount > 0 && <span className="ml-1.5 text-[#3b4890] text-[10px] font-black">[{p.commentCount}]</span>}
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
          <div className="flex items-center justify-center gap-6 mb-12">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="w-11 h-11 flex items-center justify-center bg-white border border-zinc-200 rounded-2xl shadow-sm transition-all disabled:opacity-30">
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-2 px-6 h-11 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <span className="text-sm font-bold text-black">{posts.length > 0 ? currentPage + 1 : 0}</span>
              <span className="text-zinc-300 text-xs font-bold">/</span>
              <span className="text-sm font-medium text-zinc-500">{posts.length > 0 ? totalPages : 0}</span>
            </div>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="w-11 h-11 flex items-center justify-center bg-white border border-zinc-200 rounded-2xl shadow-sm transition-all disabled:opacity-30">
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface CommentItemProps {
  comment: Comment;
  onReport: (id: string) => void;
  onReply: (id: string | null) => void;
  replyTargetId: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onReplySubmit: (parentId: string) => void;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
  formatDate: (date: string) => string;
  isChild?: boolean;
  editingCommentId: string | null;
  onSetEditingCommentId: (id: string | null) => void;
  editCommentContent: string;
  onSetEditCommentContent: (content: string) => void;
  onUpdate: (id: string) => void;
}

function CommentItem({ 
  comment, onReport, onReply, replyTargetId, replyContent, onReplyContentChange, onReplySubmit, onDelete, isSubmitting, formatDate, isChild = false, editingCommentId, onSetEditingCommentId, editCommentContent, onSetEditCommentContent, onUpdate 
}: CommentItemProps) {
  const isDeleted = comment.content === "삭제된 댓글입니다.";
  const isMine = typeof window !== "undefined" && comment.authorId?.toLowerCase() === localStorage.getItem("userId")?.toLowerCase();

  return (
    <div className={cn("flex flex-col gap-3 relative", isChild && "pt-4")}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {isChild && <CornerDownRight className="w-3.5 h-3.5 text-zinc-300" />}
          <span className={cn("font-bold text-sm", isDeleted ? "text-zinc-300" : "text-black")}>{comment.author}</span>
          <span className="text-zinc-400 text-xs">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isDeleted && !isMine && <button onClick={() => onReport(comment.id)} className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors"><AlertCircle className="w-3 h-3" />신고</button>}
          {isMine && !isDeleted && (
            <div className="flex items-center gap-2">
              <button onClick={() => { onSetEditingCommentId(comment.id); onSetEditCommentContent(comment.content); }} className="text-xs text-blue-500 font-bold">수정</button>
              <button onClick={() => onDelete(comment.id)} className="text-xs text-red-400 font-bold">삭제</button>
            </div>
          )}
        </div>
      </div>
      {editingCommentId === comment.id ? (
        <div className={cn("mt-2 bg-white border border-zinc-200 rounded-lg p-3", isChild && "ml-5")}>
          <textarea value={editCommentContent} onChange={(e) => onSetEditCommentContent(e.target.value)} className="w-full h-20 bg-transparent resize-none text-sm" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => onSetEditingCommentId(null)} className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded text-[11px] font-bold">취소</button>
            <button onClick={() => onUpdate(comment.id)} className="bg-black text-white px-4 py-1.5 rounded font-bold text-[11px]">저장</button>
          </div>
        </div>
      ) : (
        <p className={cn("text-sm leading-relaxed", isDeleted ? "text-zinc-400 italic" : "text-zinc-800", isChild && "ml-5")}>{comment.content}</p>
      )}
      {!isDeleted && <div className={cn("flex items-center gap-4", isChild && "ml-5")}><button onClick={() => onReply(replyTargetId === comment.id ? null : comment.id)} className="text-[11px] font-bold text-[#3b4890] hover:underline">답글달기</button></div>}
      {replyTargetId === comment.id && (
        <div className={cn("mt-4 bg-zinc-50 border border-zinc-200 rounded-lg p-3", isChild && "ml-5")}>
          <textarea value={replyContent} onChange={(e) => onReplyContentChange(e.target.value)} placeholder="답글을 입력해주세요." className="w-full h-20 bg-transparent resize-none text-sm" />
          <div className="flex justify-end mt-2">
            <button disabled={isSubmitting} onClick={() => onReplySubmit(comment.id)} className="bg-black text-white px-4 py-1.5 rounded font-bold text-[11px]">답글등록</button>
          </div>
        </div>
      )}
      {comment.children && comment.children.length > 0 && (
        <div className={cn("flex flex-col gap-6 mt-2", !isChild ? "ml-5 border-l-2 border-zinc-100 pl-5" : "ml-0 border-l-0 pl-0")}>
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} onReport={onReport} onReply={onReply} replyTargetId={replyTargetId} replyContent={replyContent} onReplyContentChange={onReplyContentChange} onReplySubmit={onReplySubmit} onDelete={onDelete} isSubmitting={isSubmitting} formatDate={formatDate} isChild={true} editingCommentId={editingCommentId} onSetEditingCommentId={onSetEditingCommentId} editCommentContent={editCommentContent} onSetEditCommentContent={onSetEditCommentContent} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
