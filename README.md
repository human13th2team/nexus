# 팀 프로젝트 통합 저장소 (Team Project Mono-repo)

## 🛠 0. 기술 스택 (Technical Stack)

이 프로젝트는 현대적이고 확장성 있는 기술 스택을 사용하여 구축되었습니다.

| 구분 | 기술 (Technology) | 버전 (Version) | 비고 (Note) |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js** | `16.2.1` | App Router, React 19.2.4 |
| | **Tailwind CSS** | `v4.x` | 차세대 엔진 적용 |
| | **TypeScript** | `v5.x` | 정적 타입 시스템 |
| **Backend (Spring)** | **Spring Boot** | `3.3.4` | Java 17 LTS |
| | **Gradle** | `8.10.2` | 빌드 자동화 및 관리 |
| | **SpringDoc** | `2.6.0` | Swagger UI (OpenAPI 3.0) |
| **Backend (FastAPI)** | **FastAPI** | `1.0.0` | Python 3.10+, .venv 필수 |
| | **httpx** | 최신 | 비동기 서비스 간 통신 |

---

## 1. 기능 중심(Feature-based) 프로젝트 구조
팀원 간의 코드 충돌을 방지하고 독립적인 개발을 위해 **기능(도메인)별로 디렉토리를 분리**하는 구조를 권장합니다.

### 🌐 Frontend - `frontend-next` (Feature-based)
```text
src/
├── app/                    # Next.js App Router (Layout & Routes)
├── features/               # 도메인 중심 기능별 모듈
│   ├── auth/               # 공통 인증 및 회원 관리
│   ├── branding/           # AI 크리에이티브 (브랜딩)
│   ├── simulation/         # 창업 시뮬레이션 및 상권 분석
│   ├── compliance/         # 행정 및 정책 매칭 (노무 포함)
│   ├── community/          # 하이퍼 로컬 커뮤니티
│   ├── dashboard/          # 통합 운영 분석 대시보드
│   └── common/             # 공통 컴포넌트
└── types/                  # 전역 타입 정의
```

### ☕ Backend - `backend-spring` (Domain-based)
```text
src/main/java/com/team/nexus/
├── domain/                 # 도메인별 비즈니스 로직
│   ├── auth/               # 인증/보안: Security, JWT
│   ├── branding/           # 브랜딩 자산 저장 및 매칭
│   ├── simulation/         # 지역/업종별 마스터 데이터 관리
│   ├── compliance/         # 체크리스트 및 서류 생성 로직
│   ├── community/          # 게시판 CRUD 및 실시간 알림
│   └── dashboard/          # 통계 집계 및 연동
├── global/                 # 전역 공통 관리
│   ├── entity/             # 공통 Entity (BaseTimeEntity 등)
│   ├── config/             # JPA Auditing, Security 설정
│   └── error/              # 전역 예외 처리
└── client/                 # 외부 API 연동 (FastApiClient 등)
```

### 🐍 Backend - `backend-fastapi` (Modular AI)
```text
app/
├── api/v1/                 # 도메인별 라우터 분리
│   ├── branding.py         # AI 브랜드/로고 생성 및 LLM 프롬프트
│   ├── simulation.py       # 상권 분석 및 창업 비용 예측 알고리즘
│   ├── compliance.py       # RAG 기반 정책 추천 및 법률 룰 엔진
│   ├── community.py        # 커뮤니티 부가 서비스
│   └── dashboard.py        # 시계열 매출 예측 및 리뷰 감성 분석
├── models/                 # SQLAlchemy 비동기 모델 (공통 시간 필드 포함)
├── schemas/                # Pydantic 데이터 검증 스키마
├── services/               # 핵심 AI 모델 연동 및 데이터 가공 로직
└── core/                   # DB 엔진 및 전역 설정 (database.py)
```

#### 💡 FastAPI 레이어 역할 이해하기 (비유)
팀원들의 빠른 이해를 위해 요리 과정에 비유한 가이드입니다:
- **`api/v1/` : 요청(URL)을 받고 결과를 돌려줍니다.
- **`services/` : **AI 로고 생성, 분석 로드맵 계산 등 모든 핵심 로직**이 여기에 들어갑니다.
- **`schemas/` : 데이터가 약속된 형식인지 검증합니다.
- **`models/` : DB 테이블의 모양을 정의합니다.
- **`core/` : DB 연결 및 환경변수를 설정합니다.

> [!IMPORTANT]
> **협업 규칙**: 본인이 맡은 `domain` 또는 `feature` 폴더 외부의 코드를 수정해야 할 경우, 반드시 해당 담당자와 상의 후 진행하세요. 공통 코드는 `global` 또는 `common` 폴더에서 관리합니다.

## 2. API 문서 (Swagger) 확인 방법
팀원들은 서버 주소만 알면 실시간으로 API 명세를 확인할 수 있습니다.
- **Spring Boot**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **FastAPI**: [http://localhost:8000/docs](http://localhost:8000/docs)

> [!IMPORTANT]
> **API First Development**: 코드 구현 전, Swagger에서 입출력 데이터를 먼저 협의하고 확정하는 것을 권장합니다.

## 3. 서비스 간 통신 (MSA 통신 예시)
이미 각 백엔드에는 서로를 호출할 수 있는 공통 모듈이 구성되어 있습니다.
- **Spring Boot -> FastAPI**: `/api/comm/call-fastapi` (WebClient 활용)
- **FastAPI -> Spring Boot**: `/call-spring` (httpx 활용)

## 3. 실행 방법

### Backend - FastAPI

> [!IMPORTANT]
> **가상환경 필수**: 파이썬 패키지 설치 및 실행은 반드시 `.venv` 가상환경에서 진행해야 합니다. 

```bash
cd backend-fastapi

# 1. 가상환경 생성 (.venv)
python3 -m venv .venv  # Windows는 python -m venv .venv

# 2. 가상환경 활성화
# [Mac/Linux]
source .venv/bin/activate
# [Windows]
# .venv\Scripts\activate

# 3. 패키지 설치 및 실행
pip install -r requirements.txt
# [실행] app 패키지 모듈로 실행해야 합니다.
python3 -m app.main  # Windows는 python -m app.main
```

### Backend - Spring Boot
```bash
cd backend-spring

# [Mac/Linux]
./gradlew bootRun

# [Windows]
# gradlew bootRun
```

### Frontend - Next.js
```bash
cd frontend-next
npm install
npm run dev
```

## 4. 서버 간 통신 테스트
- **Spring Boot -> FastAPI**: `GET http://localhost:8080/api/comm/call-fastapi`
- **FastAPI -> Spring Boot**: `GET http://localhost:8000/call-spring`

이 초기 설정을 통해 팀원들이 별도의 문서 없이도 서버 주소만으로 API를 파악하고, 이미 구축된 통신 모듈을 활용하여 기능을 빠르게 확장할 수 있습니다.

---

## 5. 🚀 팀원들을 위한 초기 환경 설정 (Getting Started)

프로젝트를 성공적으로 실행하기 위해 아래의 **DB 및 환경 설정** 단계를 차례대로 따라해 주세요. (보안상의 이유로 실제 비밀번호가 포함된 설정 파일은 Git에 포함되어 있지 않습니다.)

### 🐘 1단계: 데이터베이스 및 환경변수 설정

#### **방법 A: FastAPI (AI 전용 백엔드)**
1.  `backend-fastapi` 폴더로 이동합니다.
2.  `.env.example` 파일을 복사하여 `.env`라는 이름의 파일을 새로 만듭니다.
3.  `.env` 파일을 열고 `DATABASE_URL` 부분에 본인의 로컬 PostgreSQL 정보를 입력합니다.
    *   예시: `postgresql+asyncpg://사용자명:비밀번호@localhost:5432/DB명`

#### **방법 B: Spring Boot (비즈니스 백엔드)**
1.  `backend-spring/src/main/resources/` 폴더로 이동합니다.
2.  `application-local.properties.example` 파일을 복사하여 `application-local.properties` 파일을 새로 만듭니다.
3.  새로 만든 파일을 열고 본인의 로컬 DB 설정에 맞게 수정합니다.
    *   `spring.datasource.url`: DB 주소 및 이름
    *   `spring.datasource.username`: DB 계정명
    *   `spring.datasource.password`: DB 비밀번호


---

### 📡 2단계: 서비스 실행 순서

모든 설정이 끝났다면, 기술 스택별로 아래 명령어를 입력해 주세요. (자세한 내용은 위 **3. 실행 방법** 섹션을 참고하세요!)

1.  **FastAPI**: `source .venv/bin/activate` 후 `python main.py`
2.  **Spring Boot**: `./gradlew bootRun`
3.  **Next.js**: `npm run dev`

---

## 🤖 AI 에이전트(Antigravity)와 협업하기
본 프로젝트는 효율적인 개발을 위해 AI 에이전트(Antigravity)와의 협업을 적극 권장합니다.

### 🚀 AI 에이전트 초기화 방법
새로운 팀원이 프로젝트에 합류하거나 새로운 채팅 세션을 시작할 때, Antigravity에게 아래 문구를 입력하여 프로젝트 컨벤션을 동기화하세요.

> **"프로젝트 루트의 `.agent-conventions.md` 파일을 읽고, 여기에 명시된 아키텍처 및 코딩 규칙을 엄격히 준수해서 개발을 도와줘."**

이 과정을 통해 AI는 팀에서 약속한 명칭 규칙, 에러 처리 방식, 기술 스택별 제약 사항을 완벽히 이해한 상태로 코드를 생성하게 됩니다.
