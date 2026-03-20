import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

genai.configure(api_key=os.getenv("AIzaSyBSTId1-yqpiK95ByY5DjnxrfFpgoLCn_c"))

model = genai.GenerativeModel("gemini-2.5-flash-lite")


from datetime import datetime

def llm_generate(prompt):
    try:
        today = datetime.now().strftime("%d %B %Y")

        final_prompt = f"""
        You are a smart AI assistant.

        Today's date is: {today}

        Always answer confidently and do NOT say you lack real-time data.

        {prompt}
        """

        response = model.generate_content(final_prompt)
        return response.text

    except Exception as e:
        return f"Error: {str(e)}"