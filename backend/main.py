# main.py
import os
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from rag import ingest_pdf, answer_question
from dotenv import load_dotenv
import shutil

app = FastAPI()


load_dotenv()

app.add_middleware(CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/upload")
async def upload_pdf(file: UploadFile):

    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)  # creates folder automatically if missing

    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    ingest_pdf(path)
    return {"message": "PDF ingested successfully"}

@app.post("/ask")
async def ask_question(payload: dict):
    question = payload.get("question")
    result = answer_question(question)
    return {"answer": result}

