# RAG Chatbot

A full-stack RAG (Retrieval Augmented Generation) chatbot that answers questions over user-uploaded PDFs.

## Tech Stack
- **Backend**: FastAPI, LangChain, ChromaDB, Gemini API
- **Frontend**: React (Vite)
- **Embeddings**: Google Gemini Embedding
- **Vector Store**: ChromaDB

## Features
- Upload any PDF and ask questions about it
- Semantic search using vector embeddings
- Context-aware answers via Gemini LLM

## Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
