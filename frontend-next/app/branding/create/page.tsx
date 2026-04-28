"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import InterviewSection from "../components/InterviewSection";
import IdentitySelectionSection from "../components/IdentitySelectionSection";
import LogoGenerationSection from "../components/LogoGenerationSection";
import BrandingAssetsSection from "../components/BrandingAssetsSection";

export default function BrandingPage() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  
  const [step, setStep] = useState(1);
  const [isResuming, setIsResuming] = useState(!!resumeId);
  const [brandData, setBrandData] = useState<any>({
    description: "",
    namingOptions: [],
    selectedIdentity: null,
    selectedLogo: null,
    projectId: null,
    chatHistory: []
  });

  // 데이터 이어하기 로직
  useEffect(() => {
    if (resumeId) {
      const fetchResumeData = async () => {
        try {
          const res = await fetch(`http://localhost:8080/api/v1/branding/${resumeId}`);
          if (!res.ok) throw new Error("Failed to fetch resume data");
          const data = await res.json();
          
          // 상태 및 데이터 복구
          const recoveredData: any = {
            projectId: data.id,
            namingOptions: data.identities || [],
            chatHistory: data.chatHistory || [],
            selectedIdentity: data.identities?.find((i: any) => i.isSelected) || null,
          };
          
          // 현재 단계 결정
          let startStep = 1;
          if (data.currentStep === "NAMING_READY") startStep = 2;
          else if (data.currentStep === "LOGO_GENERATION") startStep = 3;
          else if (data.currentStep === "COMPLETED") startStep = 4;
          
          setBrandData(recoveredData);
          setStep(startStep);
        } catch (error) {
          console.error("Resume failed:", error);
          alert("데이터를 불러오지 못했습니다. 새로운 프로젝트로 시작합니다.");
        } finally {
          setIsResuming(false);
        }
      };
      fetchResumeData();
    }
  }, [resumeId]);

  const handleInterviewComplete = (namingOptions: any[]) => {
    setBrandData({ ...brandData, namingOptions });
    setStep(2);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  if (isResuming) return <div className="min-h-screen flex items-center justify-center font-bold">브랜딩 정보를 불러오는 중입니다...</div>;

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col">
      {/* Step Indicator (Wireframe Style) */}
      <div className="flex items-center justify-between mb-12 border-b border-gray-200 pb-6 overflow-x-auto">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-4 flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step === s
                  ? "bg-black text-white border-black"
                  : step > s
                  ? "bg-gray-200 text-gray-500 border-gray-200"
                  : "bg-white text-gray-300 border-gray-200"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm font-medium whitespace-nowrap ${
                step === s ? "text-black" : "text-gray-400"
              }`}
            >
              {s === 1 ? "인터뷰" : s === 2 ? "브랜드 선택" : s === 3 ? "로고 생성" : "에셋 마케팅"}
            </span>
            {s < 4 && <div className="w-8 md:w-12 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {step === 1 && (
          <InterviewSection 
            onComplete={handleInterviewComplete} 
            initialProjectId={brandData.projectId}
            initialMessages={brandData.chatHistory}
          />
        )}
        {step === 2 && (
          <IdentitySelectionSection
            namingOptions={brandData.namingOptions} 
            onBack={prevStep}
            onComplete={(identity) => {
              setBrandData({ ...brandData, selectedIdentity: identity });
              nextStep();
            }}
          />
        )}
        {step === 3 && (
          <LogoGenerationSection
            identity={brandData.selectedIdentity}
            onBack={prevStep}
            onComplete={(logo) => {
              setBrandData({ ...brandData, selectedLogo: logo });
              nextStep();
            }}
          />
        )}
        {step === 4 && (
          <BrandingAssetsSection
            identity={brandData.selectedIdentity}
            logo={brandData.selectedLogo}
            onBack={prevStep}
          />
        )}
      </div>
    </main>
  );
}
