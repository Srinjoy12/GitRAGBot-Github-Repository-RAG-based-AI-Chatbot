import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateResponse(query: string, context: string): Promise<string> {
  const answer = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Only answer based on context." },
      { role: "user", content: `Context:\n${context}\n\nQuery: ${query}` }
    ]
  });
  return answer.choices[0].message.content || "No answer found.";
}
