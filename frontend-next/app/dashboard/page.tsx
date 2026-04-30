"use client";

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  PieChart, 
  TrendingUp,
  ArrowRight,
  Plus,
  Search
} from 'lucide-react';
import DashboardAssetsSection from './components/DashboardAssetsSection';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-primary-container)] text-[var(--nexus-on-primary-container)] rounded-full text-[10px] font-black uppercase tracking-widest">
              Business Intelligence v1.0
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-[0.9] text-[var(--nexus-primary)]">
              Operations<br />Dashboard
            </h1>
            <p className="text-gray-500 font-medium text-lg">데이터 기반의 지능형 운영 분석 아카이브</p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href="/dashboard/upload"
              className="inline-flex items-center gap-3 bg-[var(--nexus-secondary)] text-white px-8 py-4 rounded-2xl font-black hover:bg-[var(--nexus-secondary-container)] transition-all transform hover:-translate-y-1 shadow-xl shadow-[var(--nexus-secondary)]/20"
            >
              <Upload className="w-5 h-5" />
              <span>영수증 업로드</span>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "이번 달 총 지출", value: "₩ 1,240,000", icon: TrendingUp, color: "text-blue-500" },
            { label: "분석된 영수증", value: "42 건", icon: FileText, color: "text-purple-500" },
            { label: "예상 영업 이익", value: "+ 12.5%", icon: PieChart, color: "text-green-500" },
            { label: "AI 권고 사항", value: "3 건", icon: Search, color: "text-orange-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-[var(--nexus-outline-variant)]/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl bg-[var(--nexus-surface-low)] ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black">{stat.value}</h3>
            </div>
          ))}
        </section>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Recent Activities */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-[var(--nexus-outline-variant)]/30 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black tracking-tight">최근 분석 내역</h2>
                <Link href="/dashboard/upload" className="text-sm font-bold text-[var(--nexus-primary)] hover:underline">
                  전체 보기
                </Link>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-[var(--nexus-surface-low)] rounded-3xl border border-[var(--nexus-outline-variant)]/20 hover:border-[var(--nexus-primary)]/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-[var(--nexus-primary)] transition-colors border border-[var(--nexus-outline-variant)]/30">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--nexus-on-bg)]">배달의민족 비품 구매</h4>
                        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">2024.05.0{i} • ₩ 25,400</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--nexus-primary)] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Assets Section Placeholder */}
          <div className="lg:col-span-4">
            <DashboardAssetsSection />
          </div>
        </div>

      </div>
    </div>
  );
}
