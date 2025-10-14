from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from models.prompt_models import (
    PromptRequest, PromptResponse, RagQuestionRequest, RagAnswerResponse,
    ChatRequest, ChatResponse, ChatMessage, ActionResponse,
    UserProfile, Achievement, Quest, Activity, UserXPRequest
)
from services.gemini_service import GeminiService
from services.rag_service import RagService
from pymongo import MongoClient
import datetime
from typing import List, Optional

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB client
mongodb_client = None
mongo_db = None

gemini_service = GeminiService()
rag_service = RagService()

@app.on_event("startup")
async def startup_event():
    global mongodb_client, mongo_db
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongodb_client = MongoClient(mongo_uri)
    mongo_db = mongodb_client[os.getenv("MONGO_DB", "stackable")]  # default db name
    print("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_event():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("MongoDB connection closed")

@app.post("/parse", response_model=PromptResponse)
async def parse_prompt(prompt: PromptRequest):
    try:
        result = await gemini_service.extract_intent(prompt.prompt)
        return PromptResponse(intent=result.get("intent", "unknown"), entities=result.get("entities", {}), raw=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

@app.post("/ask", response_model=RagAnswerResponse)
async def ask_copilot(question: RagQuestionRequest):
    try:
        result = await rag_service.ask(question.question)
        return RagAnswerResponse(answer=result.get("answer", "No answer found."), raw=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {e}")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    intent_result = await gemini_service.extract_intent(req.message)
    intent = intent_result.get("intent", "unknown")
    entities = intent_result.get("entities", {})
    history = [msg.dict() for msg in req.history]
    user_message = req.message
    updated_history = history + [{"role": "user", "content": user_message}]
    action = None
    if intent == "ask":
        rag_result = await rag_service.ask(user_message)
        assistant_reply = rag_result.get("answer", "No answer found.")
        updated_history.append({"role": "assistant", "content": assistant_reply})
        return ChatResponse(response=assistant_reply, history=updated_history, action=None)
    elif intent in {"buy", "sell", "launch"}:
        assistant_reply = f"Okay, running {intent} for {entities.get('token', '')}..."
        action = ActionResponse(type=intent, params=entities)
        updated_history.append({"role": "assistant", "content": assistant_reply})
        return ChatResponse(response=assistant_reply, history=updated_history, action=action)
    else:
        assistant_reply = await gemini_service.chat(history, user_message)
        updated_history.append({"role": "assistant", "content": assistant_reply})
        return ChatResponse(response=assistant_reply, history=updated_history, action=None)

# --- User Profile (web2) ---
@app.get("/user/profile", response_model=UserProfile)
async def get_user_profile(address: str = Query(...), xp: Optional[int] = Query(0)):
    user = mongo_db.users.find_one({"address": address})
    if not user:
        user = {
            "address": address,
            "shortAddress": address[:6] + "..." + address[-4:],
            "level": calc_level(xp),
            "rank": 0,
            "badge": "Newbie",
            "joinDate": datetime.datetime.utcnow().strftime("%B %Y"),
            "nextLevelXP": calc_next_level_xp(xp),
            "tokensCreated": 0,
            "tokensTraded": 0,
            "winRate": "0%",
            "streak": 0,
            "achievements": 0,
            "totalTrades": 0,
            "totalVolume": "0 STX"
        }
        mongo_db.users.insert_one(user)
    else:
        user["level"] = calc_level(xp)
        user["nextLevelXP"] = calc_next_level_xp(xp)
    return UserProfile(**user)

@app.post("/user/profile", response_model=UserProfile)
async def post_user_profile(req: UserXPRequest = Body(...)):
    address = req.address
    xp = req.xp
    user = mongo_db.users.find_one({"address": address})
    if not user:
        user = {
            "address": address,
            "shortAddress": address[:6] + "..." + address[-4:],
            "level": calc_level(xp),
            "rank": 0,
            "badge": "Newbie",
            "joinDate": datetime.datetime.utcnow().strftime("%B %Y"),
            "nextLevelXP": calc_next_level_xp(xp),
            "tokensCreated": 0,
            "tokensTraded": 0,
            "winRate": "0%",
            "streak": 0,
            "achievements": 0,
            "totalTrades": 0,
            "totalVolume": "0 STX"
        }
        mongo_db.users.insert_one(user)
    else:
        user["level"] = calc_level(xp)
        user["nextLevelXP"] = calc_next_level_xp(xp)
    return UserProfile(**user)

def calc_level(xp):
    return max(1, xp // 250 + 1)

def calc_next_level_xp(xp):
    return ((xp // 250) + 1) * 250

# --- Achievements (web2) ---
@app.get("/user/achievements", response_model=List[Achievement])
async def get_user_achievements(address: str = Query(...), xp: Optional[int] = Query(0)):
    achs = list(mongo_db.achievements.find({"address": address}))
    if not achs:
        achs = [
            {"title": "First Launch", "description": "Created your first token", "icon": "🚀", "unlocked": False, "rarity": "Common"},
            {"title": "Volume Milestone", "description": "Traded over 10M STX", "icon": "💰", "unlocked": False, "rarity": "Rare"},
            {"title": "Hot Streak", "description": "5 winning trades in a row", "icon": "🔥", "unlocked": False, "rarity": "Epic"},
            {"title": "Vibe Master", "description": "Launch 5 successful vibe tokens", "icon": "🎭", "unlocked": False, "rarity": "Legendary"},
            {"title": "Diamond Hands", "description": "Hold position for 30 days", "icon": "💎", "unlocked": False, "rarity": "Mythic"},
            {"title": "Whale Hunter", "description": "Single trade over 1M STX", "icon": "🐋", "unlocked": False, "rarity": "Legendary"}
        ]
        for a in achs:
            a["address"] = address
        mongo_db.achievements.insert_many(achs)
    for a in achs:
        if a["title"] == "First Launch":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "tokensCreated": {"$gte": 1}}) is not None
        if a["title"] == "Volume Milestone":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "totalVolume": {"$regex": r"[1-9][0-9]*M"}}) is not None
        if a["title"] == "Hot Streak":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "streak": {"$gte": 5}}) is not None
        if a["title"] == "Vibe Master":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "tokensCreated": {"$gte": 5}}) is not None
        if a["title"] == "Diamond Hands":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "holdDays": {"$gte": 30}}) is not None
        if a["title"] == "Whale Hunter":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "largestTrade": {"$regex": r"[1-9][0-9]*M"}}) is not None
    return [Achievement(**{k: v for k, v in a.items() if k != "_id" and k != "address"}) for a in achs]

@app.post("/user/achievements", response_model=List[Achievement])
async def post_user_achievements(req: UserXPRequest = Body(...)):
    address = req.address
    xp = req.xp
    achs = list(mongo_db.achievements.find({"address": address}))
    if not achs:
        achs = [
            {"title": "First Launch", "description": "Created your first token", "icon": "🚀", "unlocked": False, "rarity": "Common"},
            {"title": "Volume Milestone", "description": "Traded over 10M STX", "icon": "💰", "unlocked": False, "rarity": "Rare"},
            {"title": "Hot Streak", "description": "5 winning trades in a row", "icon": "🔥", "unlocked": False, "rarity": "Epic"},
            {"title": "Vibe Master", "description": "Launch 5 successful vibe tokens", "icon": "🎭", "unlocked": False, "rarity": "Legendary"},
            {"title": "Diamond Hands", "description": "Hold position for 30 days", "icon": "💎", "unlocked": False, "rarity": "Mythic"},
            {"title": "Whale Hunter", "description": "Single trade over 1M STX", "icon": "🐋", "unlocked": False, "rarity": "Legendary"}
        ]
        for a in achs:
            a["address"] = address
        mongo_db.achievements.insert_many(achs)
    for a in achs:
        if a["title"] == "First Launch":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "tokensCreated": {"$gte": 1}}) is not None
        if a["title"] == "Volume Milestone":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "totalVolume": {"$regex": r"[1-9][0-9]*M"}}) is not None
        if a["title"] == "Hot Streak":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "streak": {"$gte": 5}}) is not None
        if a["title"] == "Vibe Master":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "tokensCreated": {"$gte": 5}}) is not None
        if a["title"] == "Diamond Hands":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "holdDays": {"$gte": 30}}) is not None
        if a["title"] == "Whale Hunter":
            a["unlocked"] = mongo_db.users.find_one({"address": address, "largestTrade": {"$regex": r"[1-9][0-9]*M"}}) is not None
    return [Achievement(**{k: v for k, v in a.items() if k != "_id" and k != "address"}) for a in achs]

# --- Quests (web2) ---
@app.get("/user/quests", response_model=List[Quest])
async def get_user_quests(address: str = Query(...), xp: Optional[int] = Query(0)):
    quests = list(mongo_db.quests.find({"address": address}))
    if not quests:
        quests = [
            {"title": "Daily Trader", "description": "Make 5 trades today", "progress": 0, "total": 5, "reward": "50 XP", "timeLeft": "24h"},
            {"title": "Token Creator", "description": "Launch 3 tokens this week", "progress": 0, "total": 3, "reward": "200 XP", "timeLeft": "7d"},
            {"title": "Volume King", "description": "Trade 100 STX this month", "progress": 0, "total": 100, "reward": "500 XP", "timeLeft": "30d"},
            {"title": "Social Butterfly", "description": "Share 3 tokens on social", "progress": 0, "total": 3, "reward": "100 XP", "timeLeft": "7d"}
        ]
        for q in quests:
            q["address"] = address
        mongo_db.quests.insert_many(quests)
    return [Quest(**{k: v for k, v in q.items() if k != "_id" and k != "address"}) for q in quests]

@app.post("/user/quests", response_model=List[Quest])
async def post_user_quests(req: UserXPRequest = Body(...)):
    address = req.address
    xp = req.xp
    quests = list(mongo_db.quests.find({"address": address}))
    if not quests:
        quests = [
            {"title": "Daily Trader", "description": "Make 5 trades today", "progress": 0, "total": 5, "reward": "50 XP", "timeLeft": "24h"},
            {"title": "Token Creator", "description": "Launch 3 tokens this week", "progress": 0, "total": 3, "reward": "200 XP", "timeLeft": "7d"},
            {"title": "Volume King", "description": "Trade 100 STX this month", "progress": 0, "total": 100, "reward": "500 XP", "timeLeft": "30d"},
            {"title": "Social Butterfly", "description": "Share 3 tokens on social", "progress": 0, "total": 3, "reward": "100 XP", "timeLeft": "7d"}
        ]
        for q in quests:
            q["address"] = address
        mongo_db.quests.insert_many(quests)
    return [Quest(**{k: v for k, v in q.items() if k != "_id" and k != "address"}) for q in quests]

# --- Activity (web2) ---
@app.get("/user/activity", response_model=List[Activity])
async def get_user_activity(address: str = Query(...), xp: Optional[int] = Query(0)):
    acts = list(mongo_db.activity.find({"address": address}))
    if not acts:
        acts = [
            {"action": "Launched", "token": "$ROCKET", "amount": "1000 tokens", "time": "2 hours ago", "type": "launch"},
            {"action": "Bought", "token": "$DOGE", "amount": "500 STX", "time": "5 hours ago", "type": "buy"},
            {"action": "Sold", "token": "$PEPE", "amount": "1.2K tokens", "time": "1 day ago", "type": "sell"},
            {"action": "Launched", "token": "$MOON", "amount": "2000 tokens", "time": "3 days ago", "type": "launch"},
            {"action": "Bought", "token": "$CYBER", "amount": "250 STX", "time": "1 week ago", "type": "buy"}
        ]
        for a in acts:
            a["address"] = address
        mongo_db.activity.insert_many(acts)
    return [Activity(**{k: v for k, v in a.items() if k != "_id" and k != "address"}) for a in acts]

@app.post("/user/activity", response_model=List[Activity])
async def post_user_activity(req: UserXPRequest = Body(...)):
    address = req.address
    xp = req.xp
    acts = list(mongo_db.activity.find({"address": address}))
    if not acts:
        acts = [
            {"action": "Launched", "token": "$ROCKET", "amount": "1000 tokens", "time": "2 hours ago", "type": "launch"},
            {"action": "Bought", "token": "$DOGE", "amount": "500 STX", "time": "5 hours ago", "type": "buy"},
            {"action": "Sold", "token": "$PEPE", "amount": "1.2K tokens", "time": "1 day ago", "type": "sell"},
            {"action": "Launched", "token": "$MOON", "amount": "2000 tokens", "time": "3 days ago", "type": "launch"},
            {"action": "Bought", "token": "$CYBER", "amount": "250 STX", "time": "1 week ago", "type": "buy"}
        ]
        for a in acts:
            a["address"] = address
        mongo_db.activity.insert_many(acts)
    return [Activity(**{k: v for k, v in a.items() if k != "_id" and k != "address"}) for a in acts]

@app.post("/launch-token")
async def launch_token(data: dict):
    """
    Launch a new token with bonding curve

    Expected data format:
    {
        "symbol": "MOON",        # Token symbol (max 32 chars)
        "basePrice": 1000,       # Base price in micro-STX (1 STX = 1,000,000 micro-STX)
        "curveType": 0,          # 0=Linear, 1=Exponential, 2=Logarithmic, 3=Sigmoid
        "slope": 10,             # Slope parameter for curve
        "graduationThreshold": 1000000,  # Graduation threshold in micro-STX
        "maxSupply": 100000000   # Max supply
    }

    Returns contract call data for frontend to execute
    """
    symbol = data.get("symbol", "TOKEN")
    base_price = data.get("basePrice", 1000)
    curve_type = data.get("curveType", 0)  # Default to linear
    slope = data.get("slope", 10)
    graduation_threshold = data.get("graduationThreshold", 1000000)
    max_supply = data.get("maxSupply", 100000000)

    # Store in MongoDB for tracking
    token_data = {
        "symbol": symbol,
        "basePrice": base_price,
        "curveType": curve_type,
        "slope": slope,
        "graduationThreshold": graduation_threshold,
        "maxSupply": max_supply,
        "creator": data.get("creator", "unknown"),
        "createdAt": datetime.datetime.utcnow(),
        "status": "pending_launch"
    }
    mongo_db.tokens.insert_one(token_data)

    return {
        "status": "ready_to_launch",
        "contractCall": {
            "contract": "bonding-curve",
            "function": "launch-token",
            "args": {
                "symbol": symbol,
                "base-price": base_price,
                "curve-type": curve_type,
                "slope": slope,
                "graduation-threshold": graduation_threshold,
                "max-supply": max_supply
            }
        },
        "details": {
            "symbol": symbol,
            "curve": ["Linear", "Exponential", "Logarithmic", "Sigmoid"][curve_type],
            "initialPrice": f"{base_price / 1000000} STX",
            "graduation": f"{graduation_threshold / 1000000} STX reserve"
        }
    }

@app.post("/buy-token")
async def buy_token(data: dict):
    """
    Buy tokens on bonding curve

    Expected data format:
    {
        "symbol": "MOON",        # Token symbol
        "amount": 100,           # Amount of tokens to buy
        "maxSlippage": 500       # Max slippage in basis points (500 = 5%)
    }
    """
    symbol = data.get("symbol", "TOKEN")
    amount = data.get("amount", 100)
    max_slippage = data.get("maxSlippage", 500)  # 5% default

    # Log trade in MongoDB
    trade_data = {
        "symbol": symbol,
        "type": "buy",
        "amount": amount,
        "trader": data.get("trader", "unknown"),
        "timestamp": datetime.datetime.utcnow()
    }
    mongo_db.trades.insert_one(trade_data)

    return {
        "status": "ready_to_buy",
        "contractCall": {
            "contract": "bonding-curve",
            "function": "buy-token",
            "args": {
                "symbol": symbol,
                "amount": amount,
                "max-slippage": max_slippage
            }
        }
    }

@app.post("/sell-token")
async def sell_token(data: dict):
    """
    Sell tokens on bonding curve

    Expected data format:
    {
        "symbol": "MOON",        # Token symbol
        "amount": 100,           # Amount of tokens to sell
        "minReceived": 90000     # Min STX to receive (in micro-STX)
    }
    """
    symbol = data.get("symbol", "TOKEN")
    amount = data.get("amount", 100)
    min_received = data.get("minReceived", 0)

    # Log trade in MongoDB
    trade_data = {
        "symbol": symbol,
        "type": "sell",
        "amount": amount,
        "trader": data.get("trader", "unknown"),
        "timestamp": datetime.datetime.utcnow()
    }
    mongo_db.trades.insert_one(trade_data)

    return {
        "status": "ready_to_sell",
        "contractCall": {
            "contract": "bonding-curve",
            "function": "sell-token",
            "args": {
                "symbol": symbol,
                "amount": amount,
                "min-received": min_received
            }
        }
    }

# Add more endpoints and service integrations as needed 