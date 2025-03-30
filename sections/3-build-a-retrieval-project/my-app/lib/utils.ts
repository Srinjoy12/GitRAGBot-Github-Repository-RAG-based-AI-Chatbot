import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export async function queryRepo(query: string, repoUrl: string) {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, repo_url: repoUrl }),
  });
  if (!res.ok) throw new Error("Failed to fetch response");
  return await res.json();
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
