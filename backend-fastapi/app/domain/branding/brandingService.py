from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Branding, BrandIdentity, LogoAsset
from app.domain.branding.brandingSchema import BrandingCreateRequest, BrandingInterviewRequest, ChatRequest
from sqlalchemy import select
from app.core.ai_client import get_ai_client
import json
import os
import uuid

# 테스트용 고정 유저 ID
TEST_USER_ID = uuid.UUID("a248bb6e-7302-4b48-9375-c23ee477ea45")

async def create_new_branding(db: AsyncSession, request: BrandingCreateRequest) :
    """새로운 브랜딩 프로젝트를 생성하고 DB에 저장합니다."""
    new_branding = Branding(
        id=uuid.uuid4(),
        user_id=TEST_USER_ID,
        industry_category_id=request.industryId,
        title=request.title or "새 브랜딩 프로젝트",
        current_step="INTERVIEW"
    )
    db.add(new_branding)
    await db.commit()
    await db.refresh(new_branding)
    return new_branding

async def update_branding_interview(db: AsyncSession, project_id: uuid.UUID, request: BrandingInterviewRequest):
    """인터뷰 답변을 저장하고 단계를 업데이트합니다."""
    result = await db.execute(select(Branding).where(Branding.id == project_id))
    branding = result.scalar_one_or_none()
    if not branding:
        return None
    updated_data = {
        "keywords": request.keywords,
        "interview_data": request.interviewData
    }
    branding.keywords = updated_data
    branding.current_step = "NAMING_READY"
    await db.commit()
    await db.refresh(branding)
    return branding

INTERVIEW_SYSTEM_PROMPT = """
당신은 대표님의 성공적인 창업을 돕는 전문 컨설턴트 'Nexus AI'입니다. 
정중하고 친절하면서도 전문적인 어투를 유지하세요. (대표님에 대한 예우를 갖추세요)

[인터뷰 미션]
다음 4가지 핵심 정보가 모두 파악될 때까지 인터뷰를 진행하세요:
1. 비즈니스의 핵심 가치 (어떤 문제를 해결하는지)
2. 주요 타겟 고객층 (누구에게 판매하는지)
3. 브랜드의 시각적/감성적 분위기 (톤앤매너)
4. 아래 [업종 카테고리] 중 하나 확정

[업종 카테고리 목록]
- 외식업 (ID: 550e8400-e29b-41d4-a716-446655440000)
- 음식 (ID: ab91d653-83fc-407c-b157-acc34253879e)
- 소매 (ID: b647dad2-4920-49eb-a4e0-1ebcc4b85323)
- 숙박 (ID: 49c8fd42-c3e4-4422-94a5-8784127008ee)
- 교육 (ID: 14691c6f-0fd2-4f97-83ba-c50d136ed474)
- 보건의료 (ID: ac3b7391-a0c2-4937-a87b-e70118e6ed1c)
- 예술·스포츠 (ID: 0c69e0e9-7c04-4279-ad7b-664a8521e76e)
- 과학·기술 (ID: 7a06ec29-8ce4-4a5d-979f-4c750ffd26cf)
- 시설관리·임대 (ID: 79cb11aa-a2ca-44b4-b7b3-947886920219)
- 부동산 (ID: 216b2085-2cb6-4dd4-b664-076dc9309800)
- 수리·개인 (ID: 3a5e9100-c34b-4ad8-b552-f3fc76f00c9e)

[규칙]
- 위 4가지 요소가 모두 파악되었다면 `is_finished`를 `true`로 설정하세요. 
- 창업과 무관한 이야기는 정중하게 거절하고 브랜딩 대화로 유도하세요.
- 답변은 2~3문장 내외로 친절하게 작성하세요.
- 업종이 확정되면 반드시 JSON에 해당 `industry_id`를 포함하세요.

[응답 포맷]
반드시 구분선 --- 뒤에 아래 JSON만 작성하세요.
---
{
  "is_finished": bool,
  "industry_id": "UUID",
  "keywords": [],
  "msg": "대표님께 전달할 메시지"
}
"""

async def chat_with_ai(db: AsyncSession, project_id: uuid.UUID, request: ChatRequest):
    """AI와 대화를 나누고 상태를 분석하며 데이터를 실시간으로 DB에 동기화합니다."""
    ai_client = get_ai_client("gemini") 
    history = [{"role": m.role, "content": m.content} for m in request.history[-6:]]
    history.append({"role": "user", "content": request.message})
    raw_response = await ai_client.generate_response(INTERVIEW_SYSTEM_PROMPT, history)
    try:
        if "---" in raw_response:
            parts = raw_response.split("---")
            json_str = parts[-1].strip()
            result = json.loads(json_str)
            stmt = select(Branding).where(Branding.id == project_id)
            db_result = await db.execute(stmt)
            branding = db_result.scalar_one_or_none()
            if branding:
                industry_id = result.get("industry_id")
                if industry_id and industry_id != "null":
                    branding.industry_category_id = uuid.UUID(industry_id)
                branding.keywords = {
                    "extracted_keywords": result.get("keywords", []),
                    "last_msg": result.get("msg")
                }
                await db.commit()
            return {
                "aiResponse": result.get("msg", parts[0].strip()),
                "isFinished": result.get("is_finished", False),
                "extractedData": {
                    "keywords": result.get("keywords", []),
                    "industryId": result.get("industry_id")
                }
            }
    except Exception as e:
        print(f"Chat Logic Error: {e}")
    return {
        "aiResponse": raw_response.split("---")[0].strip(),
        "isFinished": False,
        "extractedData": {"keywords": []}
    }

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
    result = await db.execute(select(Branding).where(Branding.id == project_id))
    branding = result.scalar_one_or_none()
    if not branding or not branding.keywords:
        return None
    ai_client = get_ai_client("gemini")
    context = f"업종: {branding.title}\n키워드 및 인터뷰 데이터: {json.dumps(branding.keywords, ensure_ascii=False)}"
    raw_response = await ai_client.generate_response(NAMING_SYSTEM_PROMPT, [{"role": "user", "content": context}])
    try:
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

LOGO_PROMPT_MAKER = """
당신은 세계적인 로고 디자이너입니다. 제공된 브랜드 정보를 바탕으로, 서로 다른 스타일의 **이미지 생성용 영어 프롬프트 3가지**를 작성하세요.

[핵심 디자인 원칙]
1. **Diversity**: 3가지 프롬프트는 서로 다른 디자인 컨셉(예: 심볼형, 워드마크형, 추상형 등)이어야 합니다.
2. **Logo Style**: 반드시 로고(Logo) 형태여야 하며 실사 사진은 절대 금지입니다.
3. **Flat design, Vector art, Minimalist graphic, Clean lines** 스타일을 유지하세요.
4. **Background**: 반드시 "Isolated on a solid white background"로 설정하세요.

[응답 포맷]
각 프롬프트는 반드시 한 줄로 작성하고, 프롬프트 사이는 `---` 구분선으로 나누세요. 다른 설명은 생략하세요.
예시:
A minimalist vector logo for... --- A geometric symbol logo for... --- A modern abstract logo for...
"""

async def generate_brand_logo(db: AsyncSession, identity_id: uuid.UUID):
    """AI를 통해 3가지 스타일의 로고 파일만 생성하고 URL을 반환합니다. (DB 저장 X)"""
    
    # 1. 브랜드 아이덴티티 조회
    # (제목 자동 업데이트를 위해 Branding 엔티티를 조인하여 가져옵니다)
    from sqlalchemy.orm import joinedload
    stmt = select(BrandIdentity).options(joinedload(BrandIdentity.branding)).where(BrandIdentity.id == identity_id)
    result = await db.execute(stmt)
    identity = result.scalar_one_or_none()
    
    if not identity:
        return None
        
    # [대표님 요청] 최종 브랜드 이름이 결정되었으므로 Branding 프로젝트의 제목을 업데이트합니다.
    if identity.branding and identity.branding.title != identity.brand_name:
        identity.branding.title = identity.brand_name
        # current_step도 업데이트 (인터뷰 -> 로고 생성 단계로)
        identity.branding.current_step = "LOGO_GENERATION"
        await db.commit()
        
    # 2. 로고용 시각화 프롬프트 3종 생성
    ai_llm_client = get_ai_client("gemini") 
    context = f"브랜드명: {identity.brand_name}, 슬로건: {identity.slogan}, 스토리: {identity.brand_story}"
    raw_response = await ai_llm_client.generate_response(LOGO_PROMPT_MAKER, [{"role": "user", "content": context}])
    prompts = [p.strip() for p in raw_response.split('---') if p.strip()][:3]
    if len(prompts) < 1:
        prompts = [raw_response.strip()]
    ai_image_client = get_ai_client("stability")
    static_dir = "app/static/logos"
    os.makedirs(static_dir, exist_ok=True)
    async def create_logo_file(visual_prompt: str, idx: int):
        file_name = f"{identity_id}_{uuid.uuid4().hex[:8]}_{idx}.png"
        file_path = os.path.join(static_dir, file_name)
        try:
            await ai_image_client.generate_image(visual_prompt, file_path)
            return {
                "tempId": f"temp_{idx}_{uuid.uuid4().hex[:4]}",
                "imageUrl": f"/static/logos/{file_name}"
            }
        except Exception as e:
            print(f"Logo Generation Error (Index {idx}): {str(e)}")
            return None
    import asyncio
    tasks = [create_logo_file(p, i) for i, p in enumerate(prompts)]
    results = await asyncio.gather(*tasks)
    return [r for r in results if r is not None]

async def finalize_brand_logo(db: AsyncSession, identity_id: uuid.UUID, image_url: str):
    """선택된 로고 정보를 DB에 최종 저장합니다."""
    new_logo = LogoAsset(
        id=uuid.uuid4(),
        identity_id=identity_id,
        image_url=image_url,
        style_tag="FINAL_SELECTION",
        is_final=True
    )
    db.add(new_logo)
    await db.commit()
    await db.refresh(new_logo)
    return new_logo
