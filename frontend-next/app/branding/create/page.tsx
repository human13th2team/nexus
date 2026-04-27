"use client";

import { useState } from "react";
import InterviewSection from "../components/InterviewSection";
import IdentitySelectionSection from "../components/IdentitySelectionSection";
import LogoGenerationSection from "../components/LogoGenerationSection";
import BrandingAssetsSection from "../components/BrandingAssetsSection";

export default function BrandingPage() {
  const [step, setStep] = useState(1);
  const [brandData, setBrandData] = useState({
    description: "",
    namingOptions: [],
    selectedIdentity: null,
    selectedLogo: null,
  });

  const handleInterviewComplete = (namingOptions: any[]) => {
    setBrandData({ ...brandData, namingOptions });
    setStep(2);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

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
