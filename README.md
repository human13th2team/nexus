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
├── app/                    # Next.js App Router
│   ├── (auth)/             # 인증 관련 루트 (login, signup 등)
│   ├── (order)/            # 주문 관련 루트
│   └── layout.tsx          # 공통 레이아웃
├── features/               # 기능별 비즈니스 로직 및 컴포넌트
│   ├── auth/               # 인증 관련 훅, 컴포넌트, 서비스
│   ├── order/              # 주문 관련 훅, 컴포넌트, 서비스
│   └── common/             # 공통 컴포넌트 (버튼, 입력창 등)
└── types/                  # 전역 타입 정의
```

### ☕ Backend - `backend-spring` (Domain-based)
```text
src/main/java/com/example/demo/
├── domain/                 # 각 팀원이 담당하는 도메인별 패키지 (Feature)
│   ├── auth/               # 인증: Controller, Service, Repository, Dto
│   ├── order/              # 주문: Controller, Service, Repository, Dto
│   └── user/               # 사용자: Controller, Service, Repository, Dto
├── global/                 # 공통 설정 및 전역 관리 대상
│   ├── entity/             # DB 테이블과 매핑되는 모든 Entity (전역 관리)
│   ├── config/             # Swagger, Security 등 전역 설정
│   ├── error/              # 공통 예외 처리
│   └── common/             # 공통 유틸 및 기반 클래스
└── client/                 # 외부 API 연동 (FastApiClient 등)
```

### 🐍 Backend - `backend-fastapi` (Modular)
```text
app/
├── api/                    # 기능별 라우터 분리
│   ├── v1/
│   │   ├── auth.py         # 인증 API
│   │   ├── order.py        # 주문 API
│   │   └── user.py         # 사용자 API
├── crud/                   # 도메인별 DB 처리 로직
├── models/                 # 도메인별 DB 모델
├── schemas/                # 도메인별 Pydantic 스키마
└── services/               # 도메인별 핵심 비즈니스 로직
```

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
# 가상환경 생성 (.venv)
python3 -m venv .venv

# 가상환경 활성화
source .venv/bin/activate

# 패키지 설치 및 실행
pip install -r requirements.txt
python3 main.py
```

### Backend - Spring Boot
```bash
cd backend-spring
./gradlew bootRun
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

## 🤖 AI 에이전트(Antigravity)와 협업하기
본 프로젝트는 효율적인 개발을 위해 AI 에이전트(Antigravity)와의 협업을 적극 권장합니다.

### 🚀 AI 에이전트 초기화 방법
새로운 팀원이 프로젝트에 합류하거나 새로운 채팅 세션을 시작할 때, Antigravity에게 아래 문구를 입력하여 프로젝트 컨벤션을 동기화하세요.

> **"프로젝트 루트의 `.agent-conventions.md` 파일을 읽고, 여기에 명시된 아키텍처 및 코딩 규칙을 엄격히 준수해서 개발을 도와줘."**

이 과정을 통해 AI는 팀에서 약속한 명칭 규칙, 에러 처리 방식, 기술 스택별 제약 사항을 완벽히 이해한 상태로 코드를 생성하게 됩니다.
