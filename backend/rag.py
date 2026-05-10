import shutil

from dotenv import load_dotenv
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
import fitz

load_dotenv()

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        task_type="retrieval_document"
    )

def get_query_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        task_type="retrieval_query"
    )

def ingest_pdf(pdf_path: str):
    doc = fitz.open(pdf_path)
    if os.path.exists("./chroma_db"):
        shutil.rmtree("./chroma_db")
    text = ""
    for page in doc:
        text += page.get_text()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )
    chunks = splitter.create_documents([text])

    vectorstore = Chroma.from_documents(
        chunks,
        get_embeddings(),
        persist_directory="./chroma_db"
    )
    return vectorstore

def answer_question(question: str):
    vectorstore = Chroma(
        persist_directory="./chroma_db",
        embedding_function=get_query_embeddings()
    )

    docs = vectorstore.similarity_search(question, k=3)
    context = "\n\n".join([doc.page_content for doc in docs])

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
    prompt = f"""Answer the question based on the context below.

    Context:
    {context}

    Question: {question}

    Answer:"""

    response = llm.invoke(prompt)
    return {"result": response.content}