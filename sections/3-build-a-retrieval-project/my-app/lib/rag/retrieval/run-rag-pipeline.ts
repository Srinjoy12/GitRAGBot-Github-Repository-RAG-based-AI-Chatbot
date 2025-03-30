import { optimizeQuery } from "./optimize-query";
import { retrieveDocuments } from "./retrieve-documents";
import { rerankDocuments } from "./rerank-documents";
import { summarizeContext } from "./summarize-context";
import { filterSensitive } from "./filter-sensitive";
import { generateResponse } from "./generate-response";

export async function runRAGPipeline(query: string, repoId: string) {
  const optimized = await optimizeQuery(query);
  const retrieved = await retrieveDocuments(optimized, repoId);
  const topRanked = await rerankDocuments(query, retrieved);
  const summary = await summarizeContext(topRanked.slice(0, 3));
  const filtered = filterSensitive(summary);
  const response = await generateResponse(query, filtered);
  return response;
}
