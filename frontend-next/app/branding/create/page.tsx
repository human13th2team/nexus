"use client";

import { useState } from "react";
import InterviewSection from "../components/InterviewSection";
import IdentitySelectionSection from "../components/IdentitySelectionSection";
import LogoGenerationSection from "../components/LogoGenerationSection";
import BrandingAssetsSection from "../components/BrandingAssetsSection";

export default function BrandingPage() {
  const [step, setStep] = useState(1);
  const [brandData, setBrandData] = useState<any>({
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
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Simple Step Indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-1/4 h-2 rounded-full mx-1 ${
              step >= s ? "bg-black" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-8">
        {step === 1 && (
          <InterviewSection onComplete={handleInterviewComplete} />
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
