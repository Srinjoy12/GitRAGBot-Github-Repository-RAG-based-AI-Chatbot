import { RepoChat } from "@/components/repo-chat"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <RepoChat />
      </div>
    </main>
  )
}

