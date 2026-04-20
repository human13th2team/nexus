# 🌌 Nexus (넥서스)
### AI 기반 통합 미디어 브랜딩 및 데이터 기반 창업 지원 플랫폼

---

## 🚀 1. 프로젝트 개요 (Overview)
**Nexus**는 소상공인과 예비 창업자를 위해 AI가 브랜딩 에셋을 생성하고, 데이터 기반의 상권 분석 및 행정/노무 솔루션을 제공하는 **All-in-One 창업 지원 플랫폼**입니다.

- **AI 브랜딩**: 브랜드 네이밍, 슬로건, 로고 및 마케팅 에셋 자동 생성.
- **창업 시뮬레이션**: 지능형 상권 분석 및 초기 창업 비용 예측.
- **행정 & 정책 매칭**: 복잡한 인허가 절차 및 맞춤형 정부 보조금 매칭.
- **운영 분석 대시보드**: AI를 활용한 매출 예측 및 고객 리뷰 감성 분석.

---

## 🏗️ 2. 시스템 아키텍처 (System Architecture)
본 프로젝트는 독립적인 확장성과 유지보수성을 위해 **도메인 중심(Domain-Driven) 아키텍처**를 채택하고 있습니다.

### 🌐 Frontend (`frontend-next`)
- **Next.js 16 (App Router)** 기반의 현대적 웹 환경.
- `features/` 하위에 각 도메인의 핵심 컴포넌트와 비즈니스 로직을 격리하여 관리.

### ☕ Backend - Core (`backend-spring`)
- **Spring Boot 3.3** 기반의 비즈니스 오케스트레이션.
- 모든 데이터의 근간이 되는 **Global Entities**를 중앙 관리하며, 도메인별 3계층(Controller-Service-Repository) 구조를 철저히 준수합니다.

### 🐍 Backend - AI Engine (`backend-fastapi`)
- **FastAPI** 기반의 지능형 추론 엔진.
- LLM(GPT/Gemini), 이미지 생성 모델, 추천 알고리즘 등 AI 집약적 기능을 모듈화하여 제공합니다.

---

## 🛠️ 3. 기술 스택 (Technical Stack)

| 구분 | 기술 (Technology) | 버전 (Version) | 상세 내역 |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js | `16.2.1` | App Router, React 19, TypeScript |
| **Styling** | Tailwind CSS | `v4.x` | 최신 유틸리티 엔진 |
| **Backend (Core)** | Spring Boot | `3.3.4` | Java 17, Gradle |
| **Backend (AI)** | FastAPI | `1.0.0` | Python 3.11+, .venv |
| **Database** | PostgreSQL | `16.x` | UUID-OSSP, Vector 지원 |
| **Documentation** | Swagger / Redoc | - | OpenAPI 3.0 사양 |

---

## ⚙️ 4. 시작하기 (Quick Start Guide)

### 🐘 1단계: 환경변수 설정
보안을 위해 실제 설정 파일은 복사하여 사용하세요.
1. **Spring Boot**: `backend-spring/src/main/resources/application-local.properties.example` ➡️ `application-local.properties`
2. **FastAPI**: `backend-fastapi/.env.example` ➡️ `.env`
3. **Database**: 제공된 DDL(전체 스키마)을 실행하여 초기 테이블을 구축하세요.

### 🏃 2단계: 서비스 실행
```bash
# 1. FastAPI (AI 서버)
cd backend-fastapi && source .venv/bin/activate
python -m app.main

# 2. Spring Boot (비즈니스 서버)
cd backend-spring
./gradlew bootRun

# 3. Next.js (프론트엔드)
cd frontend-next
npm install && npm run dev
```

---

## ✅ 5. 초기 환경 검증 (Verification Protocol)
설정이 완료되면 아래 엔드포인트에 접속하여 서버 및 DB 연결 상태를 확인하세요.

> [!IMPORTANT]
> **Checklist**
> - [ ] **Spring Boot UP**: [http://localhost:8080/api/status/check](http://localhost:8080/api/status/check) (`status: "UP"`, `database: "CONNECTED"`)
> - [ ] **FastAPI UP**: [http://localhost:8000/health](http://localhost:8000/health) (`status: "UP"`, `database: "CONNECTED"`)
> - [ ] **Inter-Server Link**: [http://localhost:8080/api/comm/call-fastapi](http://localhost:8080/api/comm/call-fastapi) (정상 호출 확인)

---

## 👥 6. 협업 가이드 (Collaboration)

### 🤖 AI 에이전트(Antigravity) 활용
본 프로젝트는 AI와의 완벽한 협업을 위해 컨벤션을 공유합니다. 
> "프로젝트 루트의 **`.agent-conventions.md`**를 읽고 규칙을 준수하여 개발을 도와줘."

### 📝 개발 규칙
1. **엔티티 수정**: 모든 엔티티는 `com.team.nexus.global.entity`에서 전역 관리합니다.
2. **도메인 격리**: 본인이 맡은 `domain/` 하위 폴더 외부의 코드를 수정할 경우 반드시 상의하세요.
3. **API 우선 설계**: 구현 전 Swagger/Redoc을 통해 인터페이스를 먼저 확정합니다.

---
