"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // 로컬 스토리지에 토큰 저장
      localStorage.setItem("accessToken", token);
      
      // 사용자 정보를 가져오는 로직이 추가로 필요할 수 있음
      // 여기서는 일단 토큰 저장 후 메인으로 이동
      alert("구글 로그인에 성공했습니다!");
      router.push("/");
    } else {
      alert("로그인 정보를 가져오지 못했습니다.");
      router.push("/auth/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-500 font-medium">로그인 처리 중입니다...</p>
      </div>
    </div>
  );
}
