import weaviate from "weaviate-ts-client";
import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = weaviate.client({ scheme: "http", host: process.env.WEAVIATE_HOST! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function retrieveDocuments(query: string, repoId: string) {
  const embedding = await openai.embeddings.create({
    input: query,
    model: "text-embedding-ada-002"
  });
  const vector = embedding.data[0].embedding;

  const result = await client.graphql.get()
    .withClassName("RepoChunk")
    .withFields("content repo_id")
    .withNearVector({ vector })
    .withWhere({
      path: ["repo_id"],
      operator: "Equal",
      valueString: repoId
    })
    .withLimit(8)
    .do();

  return result.data.Get.RepoChunk.map((doc: any) => doc.content);
}
