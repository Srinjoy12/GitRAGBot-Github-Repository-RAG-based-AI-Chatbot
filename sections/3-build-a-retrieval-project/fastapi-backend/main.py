from fastapi import FastAPI, HTTPException, Body
from github_fetcher import fetch_repo_data
from db import store_repo_metadata, get_repo_by_url
from rag import process_and_store_data, query_rag

app = FastAPI()

@app.get("/status")
def health():
    return {"status": "Backend is live"}

@app.post("/add-repo")
def add_repo(
    repo_url: str = Body(...),
    name: str = Body(...),
    description: str = Body(""),
    language: str = Body("")
):
    try:
        files = fetch_repo_data(repo_url)
        store_repo_metadata(name, repo_url, description, language)
        process_and_store_data(repo_url, files)
        return {"message": "Repo added and processed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query-chatbot")
def query_chatbot(query: str = Body(...), repo_url: str = Body(...)):
    try:
        print(f"Received query: {query}")
        print(f"Target repo: {repo_url}")
        
        repo = get_repo_by_url(repo_url)
        print(f"Repo exists: {repo}")

        answer = query_rag(query, repo_url)
        print(f"Generated answer: {answer[:100]}...")

        return {"response": answer}
    except Exception as e:
        import traceback
        traceback.print_exc()  # ✅ Print full stack trace
        raise HTTPException(status_code=500, detail=str(e))
