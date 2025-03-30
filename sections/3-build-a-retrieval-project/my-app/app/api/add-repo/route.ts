export async function POST(req: Request) {
    const { repo_url, name, description, language } = await req.json();
    const res = await fetch("http://localhost:8000/add-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url, name, description, language })
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail);
    }
  
    return Response.json({ message: "Repo added!" });
  }
  