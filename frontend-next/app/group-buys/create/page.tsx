'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 대한민국 지역 데이터
const regionData: { [key: string]: string[] } = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구', '군위군'],
  '인천광역시': ['강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종시'],
  '경기도': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전북특별자치도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '진안군', '정읍시'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시'],
};

export default function GroupBuyCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 지역 선택 상태
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    itemName: '',
    itemPrice: '',
    targetCount: '',
    endDate: '',
    description: '',
  });

  // 테스트를 위해 로그인 체크 잠시 중단
  useEffect(() => {
    /*
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/auth/login');
    }
    */
  }, [router]);

  // 도 선택 시 도시 목록 업데이트
  useEffect(() => {
    if (selectedProvince) {
      setCities(regionData[selectedProvince]);
      setSelectedCity('');
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !selectedCity) {
      alert('지역을 선택해 주세요.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      let finalImageUrl = '';

      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);

        const uploadRes = await fetch('http://localhost:8080/api/v1/group-buys/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          finalImageUrl = await uploadRes.text();
        }
      }

      // 테스트용 사용자 ID (DB에 존재하는 유효한 ID: d38bc69d-9660-4e11-a50d-9ee90ff38673)
      // 로그인 정보가 있으면 그것을 쓰고, 없으면 테스트 ID를 사용합니다.
      const userId = localStorage.getItem('userId') || 'd38bc69d-9660-4e11-a50d-9ee90ff38673';

      const response = await fetch(`http://localhost:8080/api/v1/group-buys?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          region: `${selectedProvince} ${selectedCity}`,
          imageUrl: finalImageUrl,
          itemPrice: parseInt(formData.itemPrice),
          targetCount: parseInt(formData.targetCount),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });

      if (response.ok) {
        alert('공동구매가 성공적으로 등록되었습니다!');
        router.push('/group-buys');
      } else {
        const errorData = await response.json();
        alert(`등록 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors mb-6">
            ← 돌아가기
          </button>
          <h1 className="text-5xl font-black text-[#0f172a] tracking-tight">
            새로운 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">공동구매</span> 등록
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* Image Section */}
            <div className="md:col-span-2 space-y-4">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">물품 사진</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">📸</span>
                    <span className="text-slate-400 font-bold">클릭하여 사진 업로드</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">공동구매 제목</label>
              <input required name="title" value={formData.title} onChange={handleChange} placeholder="제목을 입력하세요" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all font-bold text-lg" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">물품명</label>
              <input required name="itemName" value={formData.itemName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none font-bold" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">물품 가격 (원)</label>
              <input required type="number" name="itemPrice" value={formData.itemPrice} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none font-bold" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">목표 인원 (명)</label>
              <input required type="number" name="targetCount" value={formData.targetCount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none font-bold" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">마감 시간</label>
              <input required type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none font-bold [color-scheme:light]" />
            </div>

            {/* Region Selection Section */}
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">도/특별시/광역시</label>
              <select 
                required 
                value={selectedProvince} 
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="">선택하세요</option>
                {Object.keys(regionData).map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">시/군/구</label>
              <select 
                required 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">선택하세요</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">상세 설명</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-6 py-6 focus:outline-none font-bold resize-none" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-6 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-blue-900/10 transform active:scale-[0.98] mt-8 ${
              isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0f172a] hover:bg-blue-600 text-white'
            }`}
          >
            {isSubmitting ? '게시 중...' : '공동구매 게시하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
