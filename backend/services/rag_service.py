import httpx
import os

class RagService:
    def __init__(self, rag_url: str = None):
        self.base_url = rag_url or os.getenv("RAG_SERVER_URL", "http://localhost:8000")

    async def ask(self, question: str, top_k: int = 1) -> dict:
        # Always call /query endpoint, even if base_url does not end with /query
        url = self.base_url.rstrip("/") + "/query"
        data = {"question": question, "top_k": top_k}
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=data, timeout=20)
            resp.raise_for_status()
            result = resp.json()
        # Return the top answer and the full raw response
        if "results" in result and result["results"]:
            answer = result["results"][0]["text"]
        else:
            answer = "No answer found."
        return {"answer": answer, "raw_rag": result} 