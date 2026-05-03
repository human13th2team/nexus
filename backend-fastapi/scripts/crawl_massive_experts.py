import asyncio
import os
import sys
import uuid
import requests
import random
import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.core.ai_client import get_ai_client

# 방대한 검색을 위한 대량의 키워드 세팅
KEYWORDS = [
    ("스타트업 마케터", "마케팅/그로스해킹"), ("퍼포먼스 마케팅", "마케팅/그로스해킹"), ("그로스해커", "마케팅/그로스해킹"), ("콘텐츠 마케터", "마케팅/그로스해킹"),
    ("스타트업 개발자", "IT/플랫폼 개발"), ("웹 개발자", "IT/플랫폼 개발"), ("앱 개발", "IT/플랫폼 개발"), ("백엔드 개발자", "IT/플랫폼 개발"), ("프론트엔드", "IT/플랫폼 개발"),
    ("스타트업 투자", "투자/정부지원금"), ("벤처캐피탈", "투자/정부지원금"), ("IR 피칭", "투자/정부지원금"), ("정부지원금", "투자/정부지원금"),
    ("스타트업 디자이너", "디자인/브랜딩"), ("UXUI 디자이너", "디자인/브랜딩"), ("브랜드 기획", "디자인/브랜딩"), ("프로덕트 디자이너", "디자인/브랜딩"),
    ("스타트업 세무", "법무/세무"), ("변리사", "법무/세무"), ("노무사", "법무/세무"), ("스타트업 법무", "법무/세무")
]

MAX_PAGES_PER_KEYWORD = 30 # 키워드당 30페이지 검색 (페이지당 약 10~20개 글)
TARGET_COUNT = 10000

async def crawl_massive_experts():
    print(f"🚀 [Massive Crawler] 대규모 전문가({TARGET_COUNT}명 목표) 수집 및 AI 임베딩 변환을 시작합니다...")
    print("⏳ 예상 소요 시간: 약 1~2시간 (백그라운드에서 실행되며 자동으로 DB에 누적됩니다)")
    
    ai_client = get_ai_client("gemini")
    seen_users = set()
    total_saved = 0
    
    async with AsyncSessionLocal() as db:
        try:
            for keyword, category in KEYWORDS:
                print(f"\n=============================================")
                print(f"🔍 타겟 키워드: '{keyword}' (분야: {category})")
                print(f"=============================================")
                
                # 카테고리 ID 확보
                cat_id = uuid.uuid4()
                cat_sql = "INSERT INTO industry_categories (id, name, level, created_at) VALUES (:id, :name, 1, NOW()) ON CONFLICT DO NOTHING"
                await db.execute(text(cat_sql), {"id": cat_id, "name": category})
                await db.commit()
                
                # 실제 DB에 들어간 카테고리 ID 조회
                result = await db.execute(text("SELECT id FROM industry_categories WHERE name = :name LIMIT 1"), {"name": category})
                real_cat_id = result.scalar()
                
                for page in range(1, MAX_PAGES_PER_KEYWORD + 1):
                    if total_saved >= TARGET_COUNT:
                        print("\n🎯 목표한 전문가 수집을 모두 달성했습니다!")
                        return

                    url = f"https://api.brunch.co.kr/v1/search/article?q={keyword}&page={page}"
                    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                    
                    try:
                        response = requests.get(url, headers=headers, timeout=10)
                        if response.status_code != 200:
                            break
                            
                        data = response.json()
                        articles = data.get('data', {}).get('list', [])
                        
                        if not articles:
                            break # 더 이상 페이지 없음
                            
                        for article in articles:
                            profile = article.get('profile', {})
                            user_name = profile.get('userName', '무명')
                            user_desc = profile.get('userDesc', '')
                            
                            if not user_desc or len(user_desc) < 5:
                                user_desc = "관련 현업에서 활동 중인 실무 전문가입니다."
                                
                            if user_name in seen_users or "무명" in user_name:
                                continue
                                
                            seen_users.add(user_name)
                            
                            title = article.get('title', '')
                            portfolio_text = f"[전문가 소개]\n{user_desc}\n\n[전문 분야 및 포트폴리오]\n{title}"
                            
                            # 1. User 생성
                            user_id = uuid.uuid4()
                            user_sql = "INSERT INTO users (id, nickname, email, passwd, created_at) VALUES (:id, :nickname, :email, 'dummy_pass', NOW())"
                            await db.execute(text(user_sql), {"id": user_id, "nickname": f"{user_name} 전문가", "email": f"real_exp_{user_id}@test.com"})
                            
                            # 2. 임베딩 생성 (AI 병목 지점)
                            vector = await ai_client.embed_text(portfolio_text)
                            vector_str = "[" + ",".join(map(str, vector)) + "]"
                            
                            # 3. Expert Profile 생성
                            exp_id = uuid.uuid4()
                            exp_sql = "INSERT INTO expert_profiles (id, user_id, industry_category_id, portfolio_text, rating, embedding) VALUES (:id, :user_id, :cat_id, :portfolio, :rating, CAST(:vector AS vector))"
                            await db.execute(text(exp_sql), {
                                "id": exp_id,
                                "user_id": user_id,
                                "cat_id": real_cat_id,
                                "portfolio": portfolio_text,
                                "rating": round(random.uniform(4.0, 5.0), 1),
                                "vector": vector_str
                            })
                            
                            await db.commit()
                            total_saved += 1
                            
                            if total_saved % 10 == 0:
                                print(f"✅ 현재까지 누적 수집된 전문가: {total_saved}명 (최근: {user_name})")
                                
                    except Exception as e:
                        print(f"⚠️ 페이지 크롤링 중 에러 (건너뜀): {e}")
                        await db.rollback()
                        
                    # IP 차단 방지용 딜레이
                    await asyncio.sleep(1)
                    
        except Exception as e:
            print(f"❌ 치명적 에러 발생: {e}")

if __name__ == "__main__":
    asyncio.run(crawl_massive_experts())
