"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Calendar, MapPin, Store } from "lucide-react";

const FASTAPI_BASE_URL = "http://localhost:8000";

const INDUSTRIES = [
    "노래연습장업",
    "세탁업",
    "유흥주점영업",
    "의원",
    "인터넷컴퓨터게임시설제공업",
    "제과점영업",
    "체력단련장업",
];

interface PredictionResult {
    risk_score: number;
    label: "stable" | "caution";
    label_kor: string;
    industry: string;
    dong: string;
    gu: string;
    open_date: string;
    message: string;
    threshold: number;
}

export default function MarketPredSection({ storesData }: { storesData: any }) {
    const [industry, setIndustry] = useState("");
    const [admCd, setAdmCd] = useState("");
    const [openDate, setOpenDate] = useState("");
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dongs = storesData?.storeByRegionDtoList ?? [];
    const canSubmit = industry && admCd && openDate && !isLoading;

    const handlePredict = async () => {
        if (!canSubmit) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/ai/simulation/market-prediction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    industry,
                    adm_cd: admCd,
                    open_date: openDate,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail ?? "예측 오류");
            }

            setResult(await res.json());
        } catch (e: any) {
            setError(e.message ?? "서버 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="shrink-0 border-t border-slate-100 bg-white px-4 md:px-8 py-6">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 bg-[#0b1a7d] rounded-lg flex items-center justify-center">
                    <Sparkles size={12} className="text-white" />
                </div>
                <h2 className="text-[11px] font-black text-slate-950 uppercase tracking-wider">창업 생존 예측</h2>
                <span className="ml-2 text-[9px] font-black text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-full">
                    서울시 인허가 데이터 기반
                </span>
                {!storesData && (
                    <span className="ml-auto text-[9px] font-black text-slate-400">
                        상권 분석 후 활성화됩니다
                    </span>
                )}
            </div>

            <div className={`transition-all ${!storesData ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">

                    {/* 동 선택 */}
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <MapPin size={9} /> 행정동
                        </label>
                        <select
                            value={admCd}
                            onChange={(e) => setAdmCd(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-black text-slate-950 outline-none focus:border-[#0b1a7d] transition-colors"
                        >
                            <option value="">동 선택</option>
                            {dongs.map((d: any) => (
                                <option key={d.adongCd} value={d.adongCd}>
                                    {d.adongNm}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 업종 선택 */}
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Store size={9} /> 업종
                        </label>
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-black text-slate-950 outline-none focus:border-[#0b1a7d] transition-colors"
                        >
                            <option value="">업종 선택</option>
                            {INDUSTRIES.map((ind) => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                    </div>

                    {/* 창업 예정일 */}
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Calendar size={9} /> 창업 예정일
                        </label>
                        <input
                            type="date"
                            value={openDate}
                            onChange={(e) => setOpenDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-black text-slate-950 outline-none focus:border-[#0b1a7d] transition-colors"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePredict}
                        disabled={!canSubmit}
                        className="h-10 px-8 rounded-xl text-[11px] font-black bg-[#0b1a7d] text-white hover:bg-indigo-900 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md"
                    >
                        {isLoading ? "예측 중..." : "생존 예측 시작"}
                    </button>

                    {/* 결과 인라인 표시 */}
                    {result && (
                        <div className={`flex-1 flex items-center gap-3 px-5 py-2.5 rounded-xl border animate-in fade-in duration-500 ${result.label === "caution"
                            ? "bg-red-50 border-red-200"
                            : "bg-green-50 border-green-200"
                            }`}>
                            {result.label === "caution"
                                ? <TrendingDown size={16} className="text-red-600 shrink-0" />
                                : <TrendingUp size={16} className="text-green-600 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-950 truncate">{result.message}</p>
                            </div>
                            <div className={`shrink-0 text-lg font-black ${result.label === "caution" ? "text-red-600" : "text-green-600"
                                }`}>
                                {result.risk_score}%
                            </div>
                            <div className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black ${result.label === "caution"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                                }`}>
                                {result.label_kor}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-[11px] font-black text-red-500">{error}</p>
                    )}
                </div>
            </div>
        </section>
    );
}