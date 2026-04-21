import os
import google.generativeai as genai
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

class BaseAIClient(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, chat_history: List[Dict[str, str]]) -> str:
        pass

    @abstractmethod
    async def generate_image(self, prompt: str, output_path: str) -> str:
        pass

class GeminiClient(BaseAIClient):
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        self.model_name = 'models/gemma-4-31b-it' # 대표님이 지시한 Gemma 4 모델 사용

    async def generate_response(self, system_instruction: str, chat_history: List[Dict[str, str]]) -> str:
        # Gemini는 별도의 system_instruction과 history를 받는 구조가 잘 잡혀있음
        model_with_instruction = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction
        )
        
        # History 변환 (Gemini 포맷: {"role": "user/model", "parts": [content]})
        gemini_history = []
        for msg in chat_history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})
        
        chat = model_with_instruction.start_chat(history=gemini_history[:-1]) # 마지막 메시지는 제외하고 시작
        response = chat.send_message(chat_history[-1]["content"])
        
        return response.text

    async def generate_image(self, prompt: str, output_path: str) -> str:
        """Gemini 이미지 모델을 사용하여 이미지를 생성합니다."""
        # 이미지 전용 모델 설정 (Pro 버전 쿼터 초과로 인해 Flash 버전으로 변경 시도)
        image_model = genai.GenerativeModel('models/gemini-3.1-flash-image-preview')
        
        # 이미지 생성 요청
        response = image_model.generate_content(prompt)
        
        # 응답에서 이미지 데이터 추출 및 저장
        # (참고: 모델에 따라 response.candidates[0].content.parts[0].inline_data 혹은 다른 포맷일 수 있음)
        # 여기서는 모델이 PIL Image 객체나 바이트 데이터를 반환한다고 가정하고 처리
        try:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    with open(output_path, "wb") as f:
                        f.write(part.inline_data.data)
                    return output_path
            
            # 만약 inline_data가 없다면 (일반적인 경우)
            if response.text and "http" in response.text:
                # URL이 반환되는 특이 케이스 대응
                return response.text
                
            raise ValueError("이미지 데이터를 찾을 수 없습니다.")
        except Exception as e:
            print(f"Gemini Image Generation Error: {str(e)}")
            raise e

class OllamaClient(BaseAIClient):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = "gemma:2b"

    async def generate_response(self, system_instruction: str, chat_history: List[Dict[str, str]]) -> str:
        # Ollama /api/chat 엔드포인트 활용
        messages = [{"role": "system", "content": system_instruction}]
        messages.extend(chat_history)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    async def generate_image(self, prompt: str, output_path: str) -> str:
        # Ollama는 현재 표준 API로 이미지 생성을 지원하지 않음 (SD 연동 필요 시 별도 구현)
        raise NotImplementedError("Ollama does not support image generation natively.")

class StableDiffusionClient(BaseAIClient):
    def __init__(self):
        self.api_key = os.getenv("STABILITY_API_KEY")
        self.base_url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

    async def generate_response(self, prompt: str, chat_history: List[Dict[str, str]]) -> str:
        raise NotImplementedError("Stable Diffusion client is for image generation only.")

    async def generate_image(self, prompt: str, output_path: str) -> str:
        """Stability AI API를 사용하여 이미지를 생성합니다."""
        if not self.api_key:
            raise ValueError("STABILITY_API_KEY가 설정되어 있지 않습니다.")

        # 디버깅: 프롬프트 내용 확인
        print(f"DEBUG: Stable Diffusion Prompt -> {prompt}")

        if not prompt or len(prompt.strip()) == 0:
            raise ValueError("프롬프트가 비어 있습니다.")

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        body = {
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=headers, json=body, timeout=60.0)
            
            if response.status_code != 200:
                raise Exception(f"Stability AI API Error: {response.text}")

            data = response.json()
            
            # 첫 번째 이미지 데이터 저장 (base64)
            import base64
            image_data = base64.b64decode(data["artifacts"][0]["base64"])
            with open(output_path, "wb") as f:
                f.write(image_data)
                
            return output_path

def get_ai_client(provider: str = "gemini") -> BaseAIClient:
    if provider == "gemini":
        return GeminiClient()
    elif provider == "ollama":
        return OllamaClient()
    elif provider == "stability":
        return StableDiffusionClient()
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")
