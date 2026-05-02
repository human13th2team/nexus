"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000/api/v1/ai/branding";

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
}

export default function InterviewSection({ 
  onComplete 
}: { 
  onComplete: (data: any) => void 
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "안녕하세요 대표님! 어떤 비즈니스를 준비 중이신가요? 생각하고 계신 산업군이나 핵심 서비스를 간단히 설명해 주세요.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false); // 인터뷰 완료 상태
  const [isGeneratingBranding, setIsGeneratingBranding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 컴포넌트 마운트 시 브랜딩 프로젝트 생성
  useEffect(() => {
    const initProject = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industryId: "550e8400-e29b-41d4-a716-446655440000", // 초기 기본값
            title: "새로운 창업 프로젝트"
          }),
        });
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setProjectId(result.data.projectId);
        }
      } catch (error) {
        console.error("Failed to start branding project:", error);
      }
    };
    initProject();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !projectId || isLoading) return;

    const userContent = inputValue;
    const userMsg: Message = { id: Date.now(), role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userContent,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const result = await response.json();

      if (result.success) {
        const assistantMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: result.aiResponse,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsFinished(result.isFinished); // AI가 인터뷰가 충분하다고 판단했는지 저장

        if (result.extractedData?.keywords) {
          setKeywords(result.extractedData.keywords);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
      // 입력창 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // 인터뷰 완료 시 브랜드 추천 목록 생성
  const handleCompleteInterview = async () => {
    if (!projectId || isGeneratingBranding) return;
    
    setIsGeneratingBranding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${projectId}/naming`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const result = await response.json();
      
      if (result.success) {
        // 성공적으로 생성된 3가지 브랜딩 목록을 상위로 전달
        onComplete(result.data);
      } else {
        alert("브랜드 추천 생성 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Naming error:", error);
    } finally {
      setIsGeneratingBranding(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[650px] animate-in fade-in duration-500">
      {/* Left: Chat Interface */}
      <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-500 animate-bounce" : "bg-green-500 animate-pulse"}`}></div>
            <h2 className="font-semibold text-gray-800 text-sm">AI 브랜딩 에이전트</h2>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {projectId ? `Project: ${projectId.slice(0,8)}...` : "Initializing..."}
          </span>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-white"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-black text-white rounded-tr-none shadow-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isFinished ? "추가로 궁금하신 점이 있으신가요?" : "답변을 입력해 주세요..."}
              disabled={isLoading || !projectId}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all disabled:bg-gray-50 resize-none max-h-32 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !projectId}
              className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 h-[42px]"
            >
              전송
            </button>
          </div>
        </div>
      </div>

      {/* Right: Insight Dashboard */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="flex-1 border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">실시간 인사이트</h3>
            <p className="text-[11px] text-gray-500">대화 내용을 분석하여 도출된 핵심 키워드입니다.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 rounded-full text-xs font-medium animate-in zoom-in duration-300"
                >
                  #{kw}
                </span>
              ))}
              {keywords.length === 0 && (
                <p className="text-xs text-gray-400 italic">대화를 시작하면 키워드가 추출됩니다.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">분석 요약</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {isFinished 
                  ? "필요한 정보가 모두 수집되었습니다. 브랜드 추천을 생성할 수 있습니다."
                  : `현재 대표님의 비즈니스는 ${keywords[keywords.length-1] || "..."}를 중심으로 한 브랜드 정체성을 형성하고 있습니다.`
                }
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCompleteInterview}
          disabled={!isFinished || isGeneratingBranding}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-3 group ${
            isFinished 
              ? "bg-black text-white hover:bg-gray-800" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isGeneratingBranding ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              브랜드 추천 생성 중...
            </>
          ) : (
            <>
              인터뷰 완료 및 브랜드 추천
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}



