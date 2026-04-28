"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

const MENU_DATA = [
  { id: 'analysis', title: '창업 분석', hasSub: true,
    subMenu: [{ name: '창업 비용 시뮬레이션', href: '/simulation' },
              { name: '상권 분석 지도', href: '/store-map' }]
  },
  { id: 'subsidy', title: '지원금 찾기', hasSub: false, href: '/' },
  { id: 'creative', title: 'AI 브랜딩', hasSub: false, href: '/branding'},
  { id: 'experts', title: '전문가 매칭', hasSub: false, href: '/' },
  { id: 'compliance', title: '창업 가이드', hasSub: true,
    subMenu: [{ name: '서류 가이드', href: '/' },
              { name: '고용 가이드', href: '/' }]
  },
  { id: 'community', title: '커뮤니티', hasSub: true,
    subMenu: [{ name: '자유 게시판', href: '/' },
              { name: '지역별 게시판', href: '/' },
              { name: '업종별 게시판', href: '/'}]
  },
];

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);

  // 1. 로그인 상태를 체크하는 함수를 별도로 분리합니다.
  const checkLoginStatus = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    const savedNickname = localStorage.getItem('nickname');
    if (token) {
      setIsLoggedIn(true);
      setNickname(savedNickname || 'User');
    } else {
      setIsLoggedIn(false);
      setNickname('');
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // 처음 로드될 때 체크
    checkLoginStatus();

    // 2. 다른 탭에서의 변화나 커스텀 이벤트를 감지합니다.
    window.addEventListener('storage', checkLoginStatus); // 로컬스토리지 변경 감지
    window.addEventListener('login-status-change', checkLoginStatus); // 커스텀 이벤트 감지

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('login-status-change', checkLoginStatus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [checkLoginStatus]);

  const handleMenuHover = (menuId: string | null, hasSub: boolean) => {
    if (hasSub) {
      setActiveMenu(menuId);
      setIsProfileOpen(false);
    } else {
      setActiveMenu(null);
    }
  };

  const toggleProfile = () => {
    const nextState = !isProfileOpen;
    setIsProfileOpen(nextState);
    if (nextState) setActiveMenu(null);
  };

  // 로그아웃 시에도 이벤트를 발생시켜 UI를 즉시 갱신합니다.
  const handleLogout = () => {
    localStorage.clear();
    checkLoginStatus(); // 현재 컴포넌트 상태 갱신
    window.location.href = '/';
  };

  return (
    <header className="relative w-full bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] z-[100]">
      <div className="max-w-[1440px] mx-auto h-20 px-6 md:px-8 flex items-center justify-between">

        <div className="w-[100px] lg:w-[160px] shrink-0">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-[var(--nexus-primary)]">
            NEXUS
          </Link>
        </div>

        <nav className="hidden lg:block flex-grow h-full">
          {mounted ? (
            <ul className="grid grid-cols-6 h-full items-center">
              {MENU_DATA.map((menu) => (
                <li
                  key={menu.id}
                  className="relative flex items-center justify-center h-full cursor-pointer"
                  onMouseEnter={() => handleMenuHover(menu.id, menu.hasSub)}
                >
                  <Link
                    href={menu.href || '#'}
                    className={`text-[15px] xl:text-[16px] font-bold whitespace-nowrap transition-colors ${activeMenu === menu.id ? 'text-[var(--nexus-primary)]' : 'text-[var(--nexus-on-bg)]'}`}
                  >
                    {menu.title}
                  </Link>
                  {activeMenu === menu.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[var(--nexus-primary)]" />}
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full w-full" />
          )}
        </nav>

        <div className="w-[100px] lg:w-[160px] shrink-0 flex items-center justify-end gap-4" ref={profileRef}>
          {mounted ? (
            <>
              {!isLoggedIn ? (
                <Link href="/auth/login" className="text-sm font-bold text-[var(--nexus-primary)] px-3 py-1.5 md:px-4 md:py-2 border border-[var(--nexus-primary)] rounded hover:bg-[var(--nexus-primary)] hover:text-white transition-colors">
                  로그인
                </Link>
              ) : (
                <div className="relative flex items-center">
                  <button onClick={toggleProfile} className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[var(--nexus-outline-variant)] overflow-hidden bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">{nickname[0] || 'P'}</span>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 top-14 w-52 bg-white border border-[var(--nexus-outline-variant)] shadow-xl rounded-md overflow-hidden z-[110]">
                        <div className="px-5 py-3.5 text-sm text-gray-400 border-b border-gray-100 bg-gray-50/50">
                            <span className="font-bold text-[var(--nexus-primary)]">{nickname}</span>님 환영합니다
                          </div>

                          <Link href="/" className="block px-5 py-3.5 text-sm hover:bg-gray-50 border-b border-gray-100">ℹ️ 프로필</Link>
                          <Link href="/chat" className="block px-5 py-3.5 text-sm hover:bg-gray-50 border-b border-gray-100">💬 채팅하기</Link>
                          <button onClick={handleLogout} className="w-full text-left px-5 py-3.5 text-sm text-red-500 hover:bg-red-50 font-semibold">🚪 로그아웃</button>
                    </div>
                  )}
                </div>
              )}
              <button className="lg:hidden p-1 text-[var(--nexus-primary)]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 <span className="text-2xl">☰</span>
              </button>
            </>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>
      </div>

      {mounted && (
        <div
          onMouseLeave={() => setActiveMenu(null)}
          className={`hidden lg:block absolute top-20 left-0 w-full bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${activeMenu ? 'max-h-[250px] opacity-100 py-8' : 'max-h-0 opacity-0 py-0'}`}
        >
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 flex items-start justify-between">
            <div className="w-[160px] shrink-0" />
            <div className="flex-grow grid grid-cols-6">
              {MENU_DATA.map((menu) => (
                <div key={menu.id} className="flex flex-col items-center">
                  {activeMenu === menu.id && menu.hasSub && (
                    <ul className="flex flex-col gap-4 text-center">
                      {menu.subMenu?.map((sub, sIdx) => (
                        <li key={sIdx}>
                          <Link href={sub.href} className="text-[14px] text-gray-500 hover:text-[var(--nexus-primary)] hover:underline underline-offset-4 font-medium whitespace-nowrap">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="w-[160px] shrink-0" />
          </div>
        </div>
      )}
    </header>
  );
}