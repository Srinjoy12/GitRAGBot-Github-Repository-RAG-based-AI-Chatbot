import requests
import os
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv('.env.local')

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise EnvironmentError("GITHUB_TOKEN not set in .env.local")

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

ALLOWED_EXTENSIONS = (".md", ".py", ".js", ".ts", ".json", ".txt", ".php", ".html", ".css")

def fetch_directory_contents(owner: str, repo: str, path: str = "") -> List[Dict[str, str]]:
    """
    Recursively fetches files from a directory in a GitHub repository.
    """
    api_url = f'https://api.github.com/repos/{owner}/{repo}/contents/{path}'
    response = requests.get(api_url, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Failed to fetch directory {path}: {response.text}")
        return []

    contents = response.json()
    files = []

    for item in contents:
        if item["type"] == "file":
            if item["name"].endswith(ALLOWED_EXTENSIONS):
                download_url = item.get("download_url")
                if download_url:
                    try:
                        content_res = requests.get(download_url, headers=HEADERS)
                        content_res.raise_for_status()
                        files.append({
                            "name": f"{path}/{item['name']}" if path else item["name"],
                            "content": content_res.text
                        })
                    except Exception as e:
                        print(f"Error fetching {item['name']}: {str(e)}")
        elif item["type"] == "dir":
            # Recursively fetch files from subdirectories
            files.extend(fetch_directory_contents(owner, repo, item["path"]))
    
    return files

def fetch_repo_data(repo_url: str) -> List[Dict[str, str]]:
    """
    Fetches all relevant files from a GitHub repository (public or private),
    returns a list of {name, content} dictionaries.
    """
    if not repo_url.startswith("https://github.com/"):
        raise ValueError("Invalid GitHub URL format")

    # Extract owner and repo from URL
    owner, repo = repo_url.replace('https://github.com/', '').split('/')
    
    # Fetch all repository contents recursively
    return fetch_directory_contents(owner, repo)
