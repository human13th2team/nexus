"use client";

import React from 'react';
import DropZone from '../components/upload/Drop_zone';
import Infocard from '../components/upload/Infocard';

/**
 * 영수증 업로드 대시보드 페이지입니다.
 */
const UploadPage: React.FC = () => {
  const handleUploadComplete = (data: any) => {
    console.log("분석 결과:", data);
    // TODO: 분석 결과 표시 모달이나 페이지 이동 로직 추가
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            영수증 분석 대시보드
          </h1>
          <p className="text-gray-400">AI를 활용하여 영수증 내역을 자동으로 추출하고 관리하세요.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* 업로드 영역 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-1 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <div className="bg-[#1e293b] rounded-[calc(1.5rem-1px)] p-6 shadow-2xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>
                  영수증 업로드
                </h2>
                <DropZone onUploadComplete={handleUploadComplete} />
              </div>
            </div>
          </div>

          {/* 정보 카드 영역 */}
          <div className="space-y-6">
            <Infocard />
            
            {/* 추가 안내 카드 (유지보수 확장용) */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
              <h4 className="text-indigo-300 font-semibold mb-2">스마트 분석 기능</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                업로드된 영수증은 Ollama gemma4:e2b 모델을 통해 정밀 분석됩니다. 
                품목 매핑 및 거래 일시를 자동으로 파싱하여 가계부나 지출 결의서에 바로 활용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
