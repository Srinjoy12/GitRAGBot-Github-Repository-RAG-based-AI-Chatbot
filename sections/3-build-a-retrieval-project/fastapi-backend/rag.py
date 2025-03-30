import os
from dotenv import load_dotenv
from typing import List
import weaviate
from weaviate.classes.init import Auth
from openai import OpenAI
from weaviate.collections.classes.filters import Filter

# Load env
load_dotenv(".env.local")

# Setup OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Setup Weaviate
weaviate_url = os.getenv("WEAVIATE_URL")
weaviate_api_key = os.getenv("WEAVIATE_API_KEY")

weaviate_client = weaviate.connect_to_weaviate_cloud(
    cluster_url=weaviate_url,
    auth_credentials=Auth.api_key(weaviate_api_key)
)

# Ensure schema
def setup_schema():
    try:
        weaviate_client.collections.get("RepoChunk")
    except:
        weaviate_client.collections.create(
            name="RepoChunk",
            properties=[
                {"name": "repo_url", "dataType": "string"},
                {"name": "file_name", "dataType": "string"},
                {"name": "content", "dataType": "text"}
            ],
            vectorizer_config=None
        )

setup_schema()

def chunk_code(content: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """Split code into overlapping chunks while trying to preserve function/class boundaries."""
    chunks = []
    lines = content.split('\n')
    current_chunk = []
    current_size = 0
    
    for line in lines:
        current_chunk.append(line)
        current_size += len(line) + 1  # +1 for newline
        
        # Check if we should create a new chunk
        if current_size >= chunk_size:
            # Try to find a good breaking point (empty line or end of block)
            break_point = len(current_chunk)
            for i in range(len(current_chunk) - 1, max(0, len(current_chunk) - 10), -1):
                if not current_chunk[i].strip() or current_chunk[i].strip().endswith('}'):
                    break_point = i + 1
                    break
            
            # Create the chunk
            chunk_text = '\n'.join(current_chunk[:break_point])
            chunks.append(chunk_text)
            
            # Keep some overlap for context
            current_chunk = current_chunk[max(0, break_point - overlap):]
            current_size = sum(len(line) + 1 for line in current_chunk)
    
    # Add the last chunk if there's anything left
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    
    return chunks

# Store repo data
def process_and_store_data(repo_url: str, files: List[dict]):
    collection = weaviate_client.collections.get("RepoChunk")
    
    # First, delete existing chunks for this repo
    collection.data.delete_many(
        where=Filter.by_property("repo_url").equal(repo_url)
    )
    
    for file in files:
        content = file["content"]
        file_name = file["name"]
        
        # Skip very large files
        if len(content) > 100000:  # Skip files larger than 100KB
            print(f"Skipping large file: {file_name}")
            continue
            
        chunks = chunk_code(content)
        
        for chunk in chunks:
            try:
                emb = openai_client.embeddings.create(
                    input=chunk,
                    model="text-embedding-ada-002"
                ).data[0].embedding
                
                collection.data.insert(
                    properties={
                        "repo_url": repo_url,
                        "file_name": file_name,
                        "content": chunk
                    },
                    vector=emb
                )
            except Exception as e:
                print(f"Error processing chunk from {file_name}: {str(e)}")

def query_rag(query: str, repo_url: str) -> str:
    collection = weaviate_client.collections.get("RepoChunk")

    # Get query embedding
    query_emb = openai_client.embeddings.create(
        input=query,
        model="text-embedding-ada-002"
    ).data[0].embedding

    # Query with filter
    results = collection.query.near_vector(
        near_vector=query_emb,
        limit=5,  # Get more context
        filters=Filter.by_property("repo_url").equal(repo_url)
    )

    # Extract context with file names
    context_parts = []
    for obj in results.objects:
        file_name = obj.properties.get("file_name", "unknown_file")
        content = obj.properties.get("content", "")
        context_parts.append(f"File: {file_name}\n{content}")
    
    context = "\n\n".join(context_parts)

    # Chat completion with improved system message
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system", 
                "content": """You are a helpful code assistant that explains code in a clear and engaging way. Follow these guidelines:

1. Start your response with a brief explanation of what you found
2. When showing code, always:
   - Mention the file name where the code is from
   - Use proper markdown code blocks with the appropriate language
   - Show only the most relevant parts of the code
3. After each code block:
   - Explain what the code does in simple terms
   - Point out important functions, variables, or patterns
4. If the code is part of a larger system:
   - Explain how it fits into the bigger picture
   - Mention related files or functions if relevant
5. If no relevant code is found:
   - Explain why the code might not be found
   - Suggest what to look for instead
   - Recommend alternative search terms

Keep your responses conversational and engaging, like you're pair programming with the user."""
            },
            {
                "role": "user", 
                "content": f"Please help me understand this code. Query: {query}\n\nHere's the relevant code from the repository:\n{context}"
            }
        ],
        temperature=0.7  # Add some personality to responses
    )

    return response.choices[0].message.content
