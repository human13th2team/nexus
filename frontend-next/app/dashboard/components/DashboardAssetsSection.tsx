"use client";

import React from 'react';
import { Layers, Download, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DashboardAssetsSection() {
  return (
    <div className="bg-white border border-[var(--nexus-outline-variant)]/30 rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(7,30,39,0.08)] space-y-10 h-full">
      <div className="space-y-2">
        <h3 className="text-3xl font-black tracking-tight text-[var(--nexus-primary)]">Business Assets</h3>
        <p className="text-gray-500 font-bold text-sm">보관 중인 비즈니스 자산 아카이브</p>
      </div>

      <div className="space-y-4">
        {[
          { name: "브랜드 로고 가이드", type: "PDF", icon: Layers, color: "text-blue-500" },
          { name: "사업자 등록증", type: "IMAGE", icon: ShieldCheck, color: "text-green-500" },
          { name: "영업 신고증", type: "PDF", icon: Download, color: "text-orange-500" },
        ].map((asset, i) => (
          <div key={i} className="group p-6 bg-[var(--nexus-surface-low)] rounded-[2rem] border border-[var(--nexus-outline-variant)]/20 hover:border-[var(--nexus-primary)] transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-white ${asset.color}`}>
                <asset.icon size={20} />
              </div>
              <ExternalLink size={16} className="text-gray-300 group-hover:text-[var(--nexus-primary)]" />
            </div>
            <h4 className="font-bold text-sm mb-1">{asset.name}</h4>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{asset.type} • 2.4MB</span>
          </div>
        ))}
      </div>

      <button className="w-full py-5 rounded-2xl border-2 border-dashed border-[var(--nexus-outline-variant)] text-gray-400 font-black text-sm hover:border-[var(--nexus-primary)] hover:text-[var(--nexus-primary)] hover:bg-[var(--nexus-surface-low)] transition-all">
        + 자산 추가하기
      </button>
    </div>
  );
}
