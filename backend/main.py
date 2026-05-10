# main.py
import os
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rag import ingest_pdf, answer_question
from dotenv import load_dotenv
import shutil

load_dotenv()

app = FastAPI()

app.add_middleware(CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"]
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_pdf(file: UploadFile):
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        ingest_pdf(path)
        return {"message": "PDF ingested successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(payload: dict):
    question = payload.get("question")
    try:
        result = answer_question(question)
        return {"answer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))