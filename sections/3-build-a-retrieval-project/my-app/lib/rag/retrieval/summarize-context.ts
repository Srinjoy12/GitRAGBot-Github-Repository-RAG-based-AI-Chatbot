import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function summarizeContext(docs: string[]): Promise<string> {
  const combined = docs.join("\n\n");
  const summary = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Summarize the following content for a concise answer." },
      { role: "user", content: combined }
    ]
  });
  return summary.choices[0].message.content || combined;
}
