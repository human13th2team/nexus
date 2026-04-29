"use client"
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedNickname = localStorage.getItem('nickname');
    console.log('Header Check:', { token, savedNickname });
    
    if (token) {
      setIsLoggedIn(true);
      if (savedNickname) setNickname(savedNickname);
    }

    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('nickname');
    setIsLoggedIn(false);
    setIsProfileOpen(false);
    window.location.href = '/';
  };

  const menuData = [
    {
      id: 'analysis', title: '창업 분석', hasSub: true,
      subMenu: [{ name: '창업 비용 시뮬레이션', href: '/simulation' },
      { name: '상권 분석 지도', href: '/store-map' }]
    },
    { id: 'subsidy', title: '지원금 찾기', hasSub: false, href: '/subsidy' },
    { id: 'creative', title: 'AI 브랜딩', hasSub: false, href: '/branding' },
    { id: 'experts', title: '전문가 매칭', hasSub: false, href: '/experts' },
    {
      id: 'compliance', title: '창업 가이드', hasSub: true,
      subMenu: [{ name: '서류 가이드', href: '/license-guide' },
      { name: '고용 가이드', href: '/worker-guide' }]
    },
    {
      id: 'community', title: '커뮤니티', hasSub: true,
      subMenu: [{ name: '자유 게시판', href: '/freeboard' },
      { name: '지역별 게시판', href: '/localboard' },
      { name: '실시간 채팅', href: '/chat' }]
    },
  ];

  return (
    <header className="relative w-full bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] z-[100]">
      <div className="max-w-[1440px] mx-auto h-20 px-6 md:px-8 flex items-center justify-between gap-4 md:gap-12">

        {/* 1. 로고 영역 (모바일에서 조금 더 작게 조절) */}
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-[var(--nexus-primary)] w-auto lg:w-[120px] shrink-0">
          NEXUS
        </Link>

        {/* 2. PC용 GNB (lg 미만에서는 사라짐) */}
        <nav className="hidden lg:block flex-grow h-full">
          <ul className="grid grid-cols-6 h-full">
            {menuData.map((menu) => (
              <li
                key={menu.id}
                className="relative flex items-center justify-center cursor-pointer"
                onMouseEnter={() => menu.hasSub ? setActiveMenu(menu.id) : setActiveMenu(null)}
              >
                <Link href={menu.href || '#'} className={`text-[15px] xl:text-[16px] font-bold whitespace-nowrap transition-colors ${activeMenu === menu.id ? 'text-[var(--nexus-primary)]' : 'text-[var(--nexus-on-bg)]'}`}>
                  {menu.title}
                </Link>
                {activeMenu === menu.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[var(--nexus-primary)]" />}
              </li>
            ))}
          </ul>
        </nav>

        {/* 3. 우측 액션 영역 */}
        <div className="flex items-center gap-4 shrink-0" ref={profileRef}>
          {!isLoggedIn ? (
            <Link href="/auth/login" className="text-sm font-bold text-[var(--nexus-primary)] px-3 py-1.5 md:px-4 md:py-2 border border-[var(--nexus-primary)] rounded">
              로그인
            </Link>
          ) : (
            <div className="relative flex items-center">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[var(--nexus-outline-variant)] overflow-hidden bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-500">{nickname[0] || 'P'}</span>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-14 w-48 bg-white border border-[var(--nexus-outline-variant)] shadow-xl rounded-md overflow-hidden">
                  <div className="px-5 py-3 text-xs text-gray-400 border-b border-gray-100">
                    <span className="font-bold text-[var(--nexus-primary)]">{nickname}</span>님 환영합니다
                  </div>
                  <Link href="/chat" className="block px-5 py-3 text-sm hover:bg-[var(--nexus-surface-low)] border-b border-gray-100">💬 채팅하기</Link>
                  <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm text-[var(--nexus-error)] hover:bg-red-50 font-medium">🚪 로그아웃</button>
                </div>
              )}
            </div>
          )}

          {/* 4. 모바일 전용 햄버거 버튼 (lg 미만에서 노출) */}
          <button
            className="lg:hidden p-1 text-[var(--nexus-primary)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 5. PC용 하위 메뉴 패널 (onMouseLeave 시 닫힘) */}
      <div
        onMouseLeave={() => setActiveMenu(null)}
        className={`hidden lg:block absolute top-20 left-0 w-full bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${activeMenu ? 'max-h-[200px] opacity-100 py-8' : 'max-h-0 opacity-0 py-0'}`}
      >
        <div className="max-w-[1440px] mx-auto px-8 flex gap-12">
          <div className="w-[120px] shrink-0" />
          <div className="flex-grow grid grid-cols-6">
            {menuData.map((menu) => (
              <div key={menu.id} className="flex flex-col items-center">
                {activeMenu === menu.id && menu.hasSub && (
                  <ul className="flex flex-col gap-4 text-center">
                    {menu.subMenu.map((sub, sIdx) => (
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
          <div className="w-[120px] shrink-0" />
        </div>
      </div>

      {/* 6. 모바일 전용 드롭다운 메뉴 (lg 미만에서 버튼 클릭 시 노출) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] px-6 py-4">
          <ul className="flex flex-col gap-4">
            {menuData.map((menu) => (
              <li key={menu.id} className="border-b border-gray-50 pb-2 last:border-0">
                <div className="font-bold text-[var(--nexus-primary)] mb-2">{menu.title}</div>
                {menu.hasSub && (
                  <ul className="pl-4 flex flex-col gap-2">
                    {menu.subMenu.map((sub, sIdx) => (
                      <li key={sIdx}>
                        <Link href="/chat" className="text-sm text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}