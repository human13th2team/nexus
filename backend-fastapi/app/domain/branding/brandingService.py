from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Branding, BrandIdentity, LogoAsset
from app.domain.branding.brandingSchema import BrandingCreateRequest, BrandingInterviewRequest, ChatRequest
from sqlalchemy import select
from app.core.ai_client import get_ai_client
import json
import os
import uuid

# 테스트용 고정 유저 ID (대표님 지시사항: 임의의 유저 생성 후 사용)
TEST_USER_ID = uuid.UUID("a248bb6e-7302-4b48-9375-c23ee477ea45")

async def create_new_branding(db: AsyncSession, request: BrandingCreateRequest) :
    """새로운 브랜딩 프로젝트를 생성하고 DB에 저장합니다."""
    
    # 1. 새 브랜딩 엔티티 생성
    new_branding = Branding(
        id=uuid.uuid4(),
        user_id=TEST_USER_ID, # 현재는 테스트 유저로 고정
        industry_category_id=request.industryId,
        title=request.title or "새 브랜딩 프로젝트",
        current_step="INTERVIEW" # 초기 단계 설정
    )
    
    # 2. DB 저장
    db.add(new_branding)
    await db.commit()
    await db.refresh(new_branding)
    
    return new_branding

async def update_branding_interview(db: AsyncSession, project_id: uuid.UUID, request: BrandingInterviewRequest):
    """인터뷰 답변을 저장하고 단계를 업데이트합니다."""
    
    # 1. 프로젝트 조회
    result = await db.execute(select(Branding).where(Branding.id == project_id))
    branding = result.scalar_one_or_none()
    
    if not branding:
        return None
    
    # 2. 데이터 업데이트 (keywords 필드에 통합 저장)
    updated_data = {
        "keywords": request.keywords,
        "interview_data": request.interviewData
    }
    branding.keywords = updated_data
    
    # 3. 단계 업데이트 (인터뷰 완료 -> 작명 대기 단계로 간주 가능)
    branding.current_step = "NAMING_READY"
    
    await db.commit()
    await db.refresh(branding)
    
    return branding

# 전문 브랜딩 인터뷰 시스템 프롬프트
INTERVIEW_SYSTEM_PROMPT = """
당신은 최고의 브랜드 컨설턴트 'Nexus AI'입니다.
당신의 임무는 사용자와의 대화를 통해 새로운 브랜드의 핵심 정체성을 추출하는 것입니다.

[인터뷰 규칙]
1. 친절하고 전문적인 구어체로 대화하세요.
2. 한 번에 너무 많은 질문을 하지 마세요 (한 번에 1~2개 권장).
3. 다음 정보가 모두 파악될 때까지 인터뷰를 진행하세요:
   - 브랜딩 서비스/제품의 핵심 가치
   - 주요 타겟 고객층
   - 브랜드가 추구하는 시각적/감성적 분위기 (톤앤매너)
   - 업종에 대한 키워드

[응답 포맷]
모든 응답의 마지막에는 반드시 아래의 JSON 형식을 포함해야 합니다. (줄바꿈 후 구분선 뒤에 작성)
---
{
  "is_finished": bool, // 모든 정보를 파악했다면 true
  "extracted_keywords": [], // 현재까지 파악된 핵심 키워드 리스트
  "interview_data": {}, // 파악된 상세 정보 (target, value, vibe 등)
  "ai_message": "사용자에게 보여줄 답변"
}
"""

async def chat_with_ai(project_id: uuid.UUID, request: ChatRequest):
    """AI와 대화를 나누고 상태를 분석합니다."""
    
    ai_client = get_ai_client("gemini") # 기본값 gemini
    
    # 1. 대화 이력 구성
    history = [{"role": m.role, "content": m.content} for m in request.history]
    history.append({"role": "user", "content": request.message})
    
    # 2. AI 호출
    raw_response = await ai_client.generate_response(INTERVIEW_SYSTEM_PROMPT, history)
    
    # 3. JSON 추출 및 파싱
    try:
        # JSON 부분만 추출 (구분선 --- 이후 처리)
        json_str = raw_response.split("---")[-1].strip()
        result = json.loads(json_str)
        
        return {
            "aiResponse": result.get("ai_message", raw_response),
            "isFinished": result.get("is_finished", False),
            "extractedData": {
                "keywords": result.get("extracted_keywords", []),
                "interviewData": result.get("interview_data", {})
            }
        }
    except:
        # 파싱 실패 시 일반 텍스트로 전환
        return {
            "aiResponse": raw_response,
            "isFinished": False,
            "extractedData": None
        }

# 브랜드 명 작명 시스템 프롬프트
NAMING_SYSTEM_PROMPT = """
당신은 최고의 브랜드 네이밍 전문가입니다. 
제공된 사용자의 인터뷰 데이터와 키워드를 분석하여, 브랜드의 가치를 가장 잘 담아내는 세련된 브랜드 명 3안을 제안하세요.

[출력 형식]
반드시 다음 구조의 JSON 리스트 형식으로만 응답하세요:
[
  {
    "brand_name": "이름 1",
    "slogan": "슬로건 1",
    "story": "브랜드가 탄생하게 된 배경과 그 이름이 가진 의미 설명"
  },
  {
    "brand_name": "이름 2",
    "slogan": "슬로건 2",
    "story": "..."
  },
  {
    "brand_name": "이름 3",
    "slogan": "슬로건 3",
    "story": "..."
  }
]
"""

async def generate_brand_names(db: AsyncSession, project_id: uuid.UUID):
    """AI를 호출하여 브랜드 명을 생성하고 DB에 저장합니다."""
    
    # 1. 프로젝트 및 인터뷰 데이터 조회
    result = await db.execute(select(Branding).where(Branding.id == project_id))
    branding = result.scalar_one_or_none()
    
    if not branding or not branding.keywords:
        return None
        
    ai_client = get_ai_client("gemini")
    
    # 2. AI 요청용 컨텍스트 구성
    context = f"업종: {branding.title}\n키워드 및 인터뷰 데이터: {json.dumps(branding.keywords, ensure_ascii=False)}"
    
    # 3. AI 호촐
    raw_response = await ai_client.generate_response(NAMING_SYSTEM_PROMPT, [{"role": "user", "content": context}])
    
    # 4. JSON 파싱 및 저장
    try:
        # JSON 블록 추출 (백틱 제거 등)
        clean_json = raw_response.strip()
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
            
        naming_options = json.loads(clean_json)
        
        identities = []
        for opt in naming_options:
            identity = BrandIdentity(
                id=uuid.uuid4(),
                branding_id=project_id,
                brand_name=opt["brand_name"],
                slogan=opt.get("slogan"),
                brand_story=opt.get("story"),
                is_selected=False
            )
            db.add(identity)
            identities.append(identity)
            
        await db.commit()
        
        return identities
    except Exception as e:
        print(f"Naming Parsing Error: {str(e)}")
        raise e

# 로고 디자인 전용 시스템 프롬프트 (Visual Prompt Generator)
LOGO_PROMPT_MAKER = """
당신은 최고의 로고 디자인 컨설턴트입니다. 
제공된 브랜드 정보(이름, 슬로건, 스토리, 분위기)를 바탕으로, 이미지 생성 AI가 이해할 수 있는 아주 상세하고 예술적인 **영어 디자인 프롬프트**를 작성하세요.

[프롬프트 규칙]
1. 로고의 형태(Minimalist, Luxurious, Vintage 등)를 명시하세요.
2. 브랜드의 핵심 가치를 상징하는 시각적 요소(Symbol)를 포함하세요.
3. 색상 팔레트와 배경(White background 권장)을 지정하세요.
4. "High quality, vector style, clean lines, professional design"와 같은 퀄리티 키워드를 추가하세요.

**[주의사항]**
- **오직 영어 프롬프트 본문만 출력하세요.** 
- 체크리스트, 설명, 인사말 등 다른 어떤 텍스트도 절대 포함하지 마세요. 
- 결과물은 반드시 한 줄의 텍스트여야 합니다.
"""

async def generate_brand_logo(db: AsyncSession, identity_id: uuid.UUID):
    """AI를 통해 로고를 생성하고 서버에 저장합니다."""
    
    # 1. 브랜드 아이덴티티 조회
    result = await db.execute(select(BrandIdentity).where(BrandIdentity.id == identity_id))
    identity = result.scalar_one_or_none()
    
    if not identity:
        return None
        
    # 2. 로고용 시각화 프롬프트 생성 (LLM: Gemma 4 활용)
    # 이미지 생성은 SD가 하되, 어떤 그림을 그릴지는 가장 똑똑한 Gemma 4가 결정합니다.
    ai_llm_client = get_ai_client("gemini") 
    context = f"브랜드명: {identity.brand_name}, 슬로건: {identity.slogan}, 스토리: {identity.brand_story}"
    raw_prompt = await ai_llm_client.generate_response(LOGO_PROMPT_MAKER, [{"role": "user", "content": context}])
    
    # 프롬프트 정제 (체크리스트나 불필요한 줄바꿈 제거)
    lines = [line.strip() for line in raw_prompt.split('\n') if line.strip() and not line.strip().startswith('*') and not line.strip().startswith('-')]
    visual_prompt = " ".join(lines)
    
    # 3. 로고 이미지 생성 (Stable Diffusion 연동)
    ai_image_client = get_ai_client("stability")
    
    # 저장 경로 설정
    static_dir = "app/static/logos"
    os.makedirs(static_dir, exist_ok=True)
    file_name = f"{identity_id}_{uuid.uuid4().hex[:8]}.png"
    file_path = os.path.join(static_dir, file_name)
    
    try:
        await ai_image_client.generate_image(visual_prompt, file_path)
        
        # 4. DB 저장
        # 실제 운영 환경이라면 S3 URL 등을 사용하겠지만, 여기서는 로컬 서빙 URL을 사용
        public_url = f"/static/logos/{file_name}"
        
        logo_asset = LogoAsset(
            id=uuid.uuid4(),
            identity_id=identity_id,
            image_url=public_url,
            style_tag="AI_GENERATED",
            is_final=False
        )
        db.add(logo_asset)
        await db.commit()
        await db.refresh(logo_asset)
        
        return logo_asset
    except Exception as e:
        print(f"Logo Generation/Save Error: {str(e)}")
        raise e
