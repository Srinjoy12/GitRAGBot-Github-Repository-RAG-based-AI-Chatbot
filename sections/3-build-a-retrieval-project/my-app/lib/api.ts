export async function addRepository(repoUrl: string) {
    const res = await fetch("http://localhost:8000/add-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl }),
    });
    if (!res.ok) throw new Error("Failed to add repository");
    return res.json();
  }
  
  export async function queryChatbot(query: string, repoUrl: string) {
    const res = await fetch("http://localhost:8000/query-chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, repo_url: repoUrl }),
    });
    if (!res.ok) throw new Error("Failed to query chatbot");
    return res.json();
  }
  