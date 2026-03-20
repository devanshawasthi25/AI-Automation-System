from fastapi import APIRouter
from app.services.scraping_service import scrape_site
from app.ai.agents import ResearchAgent
from app.ai.llm_engine import llm_generate

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


# 🔍 RESEARCH
@router.get("/research")
def research(topic: str):
    agent = ResearchAgent()
    return {"research": agent.research(topic)}


# 🌐 SCRAPER
@router.get("/scrape")
def scrape(url: str):
    return {"data": scrape_site(url)}


# 💬 CHAT (GEMINI)
from app.ai.llm_engine import llm_generate

# 🧠 MEMORY STORE (simple version)
chat_memory = []

@router.post("/chat")
def chat(data: dict):
    prompt = data.get("prompt")

    # add user message
    chat_memory.append({"role": "user", "content": prompt})

    # build full conversation
    full_prompt = ""

    for msg in chat_memory:
        if msg["role"] == "user":
            full_prompt += f"User: {msg['content']}\n"
        else:
            full_prompt += f"AI: {msg['content']}\n"

    full_prompt += "AI:"

    # generate response
    response = llm_generate(full_prompt)

    # store AI response
    chat_memory.append({"role": "assistant", "content": response})

    return {"response": response}


# 🧠 ANALYZE (NOW USING AI)
@router.post("/analyze")
def analyze(data: dict):
    text = data.get("text")

    prompt = f"""
    Analyze the following text:

    {text}

    Give:
    - summary
    - key points
    - sentiment
    """

    result = llm_generate(prompt)

    return {"result": result}

@router.post("/reset")
def reset():
    global chat_memory
    chat_memory = []
    return {"status": "memory cleared"}