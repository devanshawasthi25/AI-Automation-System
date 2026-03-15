
from fastapi import APIRouter, UploadFile
from app.services.analytics_service import analyze_csv
from app.services.scraping_service import scrape_site
from app.ai.agents import ResearchAgent

router = APIRouter()

@router.get("/health")
def health():
    return {"status":"ok"}

@router.post("/analyze")
async def analyze(file: UploadFile):
    data = await file.read()
    return {"result": analyze_csv(data)}

@router.get("/scrape")
def scrape(url:str):
    return {"data": scrape_site(url)}

@router.get("/research")
def research(topic:str):
    agent = ResearchAgent()
    return {"research": agent.research(topic)}
