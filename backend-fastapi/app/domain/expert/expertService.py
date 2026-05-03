from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.ai_client import get_ai_client
import json
import re

async def match_expert_service(db: AsyncSession, request_content: str, category_id: str = None):
    ai_client = get_ai_client("gemini")
    
    # 1. 사용자의 요구사항을 텍스트 임베딩으로 변환 (로컬 모델 활용)
    req_vector = await ai_client.embed_text(request_content)
    # pgvector 쿼리를 위한 문자열 형태 리스트로 변환
    vector_str = "[" + ",".join(map(str, req_vector)) + "]"
    
    # 2. Vector DB (pgvector) 검색 (Raw SQL)
    sql_query = """
        SELECT ep.id, ep.portfolio_text, ep.rating, u.nickname
        FROM expert_profiles ep
        JOIN users u ON ep.user_id = u.id
    """
    params = {"vector": vector_str}
    
    if category_id:
        sql_query += " WHERE ep.industry_category_id = :cat_id "
        params["cat_id"] = category_id
        
    sql_query += " ORDER BY ep.embedding <=> CAST(:vector AS vector) LIMIT 3"
    
    result = await db.execute(text(sql_query), params)
    top_experts = result.fetchall()
    
    if not top_experts:
        return {"matched_expert_id": None, "match_reason": "선택하신 분야에 아직 등록된 전문가가 없습니다."}
    
    # 3. RAG 프롬프트 구성
    expert_info_list = []
    for exp in top_experts:
        expert_info_list.append(
            f"[전문가: {exp.nickname} (ID: {str(exp.id)})]\n포트폴리오 및 이력: {exp.portfolio_text}\n평점: {exp.rating or '평가 없음'}"
        )
        
    experts_context = "\n\n".join(expert_info_list)
    
    system_instruction = """당신은 스타트업을 위한 전문 매칭 컨설턴트(AI)입니다. 
창업자의 요구사항과 검색된 전문가 후보 3명의 정보를 바탕으로, 각각의 전문가를 왜 추천하는지 친절하고 전문적인 말투로 1~2줄의 매칭 사유를 작성하세요.
반드시 제공된 후보 3명을 모두 포함하여 정확히 3개의 객체를 가진 JSON 배열 형식을 반환하세요.
백틱(`)이나 추가 설명 없이 JSON 배열만 반환하세요.
[
  { "matched_expert_id": "첫번째전문가ID", "expert_name": "이름1", "match_reason": "추천사유1" },
  { "matched_expert_id": "두번째전문가ID", "expert_name": "이름2", "match_reason": "추천사유2" },
  { "matched_expert_id": "세번째전문가ID", "expert_name": "이름3", "match_reason": "추천사유3" }
]"""

    chat_history = [
        {"role": "user", "content": f"창업자 요구사항: {request_content}\n\n전문가 후보 리스트:\n{experts_context}"}
    ]
    
    # 4. LLM 답변 생성 (Gemini)
    print(f"DEBUG: Vector search returned {len(top_experts)} experts.")
    response_text = await ai_client.generate_response(system_instruction, chat_history)
    print(f"DEBUG: AI Raw Response: {response_text}")
    
    # 5. JSON 파싱
    try:
        # LLM 응답에서 JSON 배열 부분만 정규식으로 추출
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            matches = json.loads(json_str)
            
            # 3명이 안 될 경우, 부족한 만큼 상위 전문가를 fallback으로 채움
            if len(matches) < 3:
                print(f"DEBUG: AI returned only {len(matches)} matches. Filling with fallback.")
                existing_ids = {m.get("matched_expert_id") for m in matches}
                for exp in top_experts:
                    if len(matches) >= 3: break
                    if str(exp.id) not in existing_ids:
                        matches.append({
                            "matched_expert_id": str(exp.id),
                            "expert_name": exp.nickname,
                            "match_reason": "사용자 요구사항과 유사한 포트폴리오를 보유하여 추가로 추천해 드립니다."
                        })
            
            return {"matches": matches}
        else:
            raise ValueError("JSON 배열 형식을 찾을 수 없음")
    except Exception as e:
        print(f"RAG Parsing Error: {e}\nRaw Response: {response_text}")
        # 파싱 실패 시, 벡터 검색 상위 3명을 기본으로 추천
        fallback_matches = []
        for exp in top_experts:
            fallback_matches.append({
                "matched_expert_id": str(exp.id), 
                "expert_name": exp.nickname,
                "match_reason": "고객님의 요구사항과 이력서가 유사하여 시스템이 자동으로 추천해 드립니다."
            })
        return {"matches": fallback_matches}

