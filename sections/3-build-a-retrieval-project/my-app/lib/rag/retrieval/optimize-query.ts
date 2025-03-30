// retrieval/optimize-query.ts
import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function optimizeQuery(query: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Rephrase the query for better document search." },
      { role: "user", content: query }
    ]
  });
  return completion.choices[0].message.content || query;
}
