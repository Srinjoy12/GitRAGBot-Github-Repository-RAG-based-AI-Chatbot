export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, repoUrl } = await req.json()
    const latestMessage = messages[messages.length - 1]?.content
    
    console.log("Received request:", { messages, repoUrl, latestMessage })

    if (!latestMessage || !repoUrl) {
      throw new Error("Missing message or repository URL")
    }

    const res = await fetch("http://localhost:8000/query-chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: latestMessage, repo_url: repoUrl }),
    })

    const data = await res.json()
    console.log("Backend response:", data)

    if (!res.ok || !data.response) {
      throw new Error(data.detail || "Failed to get response from backend")
    }

    return new Response(
      JSON.stringify({
        id: `assistant-${Date.now()}`,
        content: data.response,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error: any) {
    console.error("Chat API Error:", error)
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}
