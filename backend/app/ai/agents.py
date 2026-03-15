
from app.ai.llm_engine import llm_generate

class ResearchAgent:

    def research(self, topic):

        prompt = f"Research the topic and summarize key insights: {topic}"

        return llm_generate(prompt)
