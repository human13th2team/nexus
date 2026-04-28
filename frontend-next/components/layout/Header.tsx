"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, MessageSquare, LayoutDashboard, Settings } from "lucide-react";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    // 로그인 상태 체크
    const checkLoginStatus = () => {
      const token = localStorage.getItem("accessToken");
      const savedNickname = localStorage.getItem("nickname");
      
      if (token) {
        setIsLoggedIn(true);
        setNickname(savedNickname || "사용자");
      } else {
        setIsLoggedIn(false);
        setNickname(null);
      }
    };

    checkLoginStatus();
    // 로컬 스토리지 변경 및 창 포커스 시 갱신
    window.addEventListener("storage", checkLoginStatus);
    window.addEventListener("focus", checkLoginStatus);
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("focus", checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("nickname");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 영역 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl italic">N</span>
          </div>
          <span className="font-black text-xl tracking-tighter">NEXUS</span>
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-black transition-colors flex items-center gap-1.5">
            <LayoutDashboard size={16} />
            대시보드
          </Link>
          <Link href="/room" className="text-sm font-medium text-zinc-500 hover:text-black transition-colors flex items-center gap-1.5">
            <MessageSquare size={16} />
            커뮤니티 채팅
          </Link>
          <Link href="/settings" className="text-sm font-medium text-zinc-500 hover:text-black transition-colors flex items-center gap-1.5">
            <Settings size={16} />
            설정
          </Link>
        </nav>

        {/* 사용자 액션 영역 */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-full border border-zinc-100">
                <div className="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center">
                  <User size={14} className="text-zinc-600" />
                </div>
                <span className="text-sm font-bold text-zinc-700">{nickname}님</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="로그아웃"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/auth/login"
                className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-black transition-colors"
              >
                로그인
              </Link>
              <Link 
                href="/auth/register"
                className="px-5 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
              >
                시작하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
