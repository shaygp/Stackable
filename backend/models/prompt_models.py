from pydantic import BaseModel
from typing import List, Optional, Dict

class PromptRequest(BaseModel):
    prompt: str

class PromptResponse(BaseModel):
    intent: str
    entities: dict
    raw: dict

class RagQuestionRequest(BaseModel):
    question: str

class RagAnswerResponse(BaseModel):
    answer: str
    raw: dict

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ActionResponse(BaseModel):
    type: str
    params: Dict

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    message: str

class ChatResponse(BaseModel):
    response: str
    history: List[ChatMessage]
    action: Optional[ActionResponse] = None

# User profile, achievements, quests, activity
class UserProfile(BaseModel):
    address: str
    shortAddress: str
    level: int
    rank: int
    badge: str
    joinDate: str
    nextLevelXP: int
    tokensCreated: int
    tokensTraded: int
    winRate: str
    streak: int
    achievements: int
    totalTrades: int
    totalVolume: str

class Achievement(BaseModel):
    title: str
    description: str
    icon: str
    unlocked: bool
    rarity: str

class Quest(BaseModel):
    title: str
    description: str
    progress: int
    total: int
    reward: str
    timeLeft: str

class Activity(BaseModel):
    action: str
    token: str
    amount: str
    time: str
    type: str

# For POST endpoints
class UserXPRequest(BaseModel):
    address: str
    xp: int = 0 