import shutil
import time

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
    text = ""
    for page in doc:
        text += page.get_text()

    if not text.strip():
        raise ValueError("No text found in PDF.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )
    chunks = splitter.create_documents([text])

    if not chunks:
        raise ValueError("Could not split document into chunks.")

    # Clear old data
    if os.path.exists("./chroma_db"):
        shutil.rmtree("./chroma_db")

    # Embed in batches of 5 chunks with delay
    batch_size = 5
    vectorstore = None

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        if vectorstore is None:
            vectorstore = Chroma.from_documents(
                batch,
                get_embeddings(),
                persist_directory="./chroma_db"
            )
        else:
            vectorstore.add_documents(batch)
        
        # Wait between batches to avoid rate limit
        if i + batch_size < len(chunks):
            time.sleep(3)

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