import os
import json as _json
from google import genai
import asyncio
import re

class GeminiService:
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-1.5-flash"

    def _extract_json(self, text):
        # Try to find the first {...} block in the response
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return _json.loads(match.group(0))
        raise ValueError("No JSON object found")

    async def extract_intent(self, prompt: str) -> dict:
        system_prompt = (
            "You are an intent extraction agent. Given a user prompt, extract the intent (action) and any entities (parameters). "
            "Respond ONLY with a valid JSON object, no commentary, no markdown, no code block, no explanation. "
            "Format: {\"intent\": ..., \"entities\": {...}, \"raw\": ...}. "
            "If the prompt is a question, intent is 'ask'. If it's a command (buy, launch, sell, etc.), intent is the action. "
            "Entities may include token name, amount, etc."
        )
        def sync_call():
            response = self.client.models.generate_content(
                model=self.model,
                contents=f"{system_prompt}\n\n{prompt}"
            )
            return response
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, sync_call)
        try:
            parsed = self._extract_json(response.text)
            return parsed | {"raw_gemini": response}
        except Exception as e:
            return {"intent": "unknown", "entities": {}, "raw_gemini": str(e), "error": "Failed to parse Gemini response"}

    async def chat(self, history: list, message: str) -> str:
        # history: list of {"role": ..., "content": ...}
        def sync_call():
            contents = []
            for msg in history:
                contents.append(f"{msg['role'].capitalize()}: {msg['content']}")
            contents.append(f"User: {message}")
            prompt = "\n".join(contents)
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, sync_call)
        return response.text

    def send_prompt(self, prompt: str) -> dict:
        # TODO: Call Gemini API and return parsed intent
        return {"intent": "stub", "entities": {}, "raw": prompt} 