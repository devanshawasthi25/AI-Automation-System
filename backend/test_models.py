import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

genai.configure(api_key=os.getenv("AIzaSyBSTId1-yqpiK95ByY5DjnxrfFpgoLCn_c"))

models = genai.list_models()

for m in models:
    print(m.name, "->", m.supported_generation_methods)