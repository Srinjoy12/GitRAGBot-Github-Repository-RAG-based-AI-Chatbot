import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv(".env.local")

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env.local")

supabase = create_client(supabase_url, supabase_key)

# ✅ Automatically insert repo metadata if not already present
def store_repo_metadata(name, url, description, language):
    result = supabase.table("repositories").select("id").eq("url", url).execute()
    if result.data and len(result.data) > 0:
        print("✅ Repo already exists in Supabase, skipping insert.")
        return

    supabase.table("repositories").insert({
        "name": name,
        "url": url,
        "description": description,
        "language": language,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    print("✅ Repo metadata inserted into Supabase.")

# ✅ Fetch repo metadata by URL
def get_repo_by_url(url):
    result = supabase.table("repositories").select("*").eq("url", url).execute()
    if not result.data:
        raise Exception("Repository not found")
    return result.data[0]

# ✅ Store individual chunks of repo (if needed)
def store_repo_chunk(repo_url, content):
    supabase.table("repo_chunks").insert({
        "repo_url": repo_url,
        "content": content
    }).execute()
