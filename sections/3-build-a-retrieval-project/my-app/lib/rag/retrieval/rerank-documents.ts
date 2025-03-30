import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function rerankDocuments(query: string, docs: string[]): Promise<string[]> {
  const ranked = await Promise.all(
    docs.map(async (doc) => {
      const res = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Score how well this document answers the query." },
          { role: "user", content: `Query: ${query}\nDocument: ${doc}` }
        ]
      });
      const score = parseFloat(res.choices[0].message.content || "0");
      return { doc, score };
    })
  );
  return ranked.sort((a, b) => b.score - a.score).map(d => d.doc);
}

