"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Send, Github } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import React from "react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Components } from 'react-markdown'

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
}

type CodeComponentProps = {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function RepoChat() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [activeRepo, setActiveRepo] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Reset chat when repository changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [activeRepo]);

  const handleAddRepository = () => {
    if (repoUrl.trim() && repoUrl.includes("github.com")) {
      setIsLoading(true)

      try {
        const urlParts = repoUrl.replace("https://github.com/", "").split("/")
        setRepoName(`${urlParts[0]}/${urlParts[1]}`)
        setActiveRepo(repoUrl)
        setMessages([])
        setError(null)
      } catch (error) {
        console.error("Error processing repository URL:", error)
        alert("Failed to process repository URL")
      } finally {
        setIsLoading(false)
      }
    } else {
      alert("Please enter a valid GitHub repository URL")
    }
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || !activeRepo || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      // Add user message immediately
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        content: userMessage,
        role: "user"
      };
      setMessages(prev => [...prev, newUserMessage]);
      setInput(""); // Clear input right after showing the message

      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          repoUrl: activeRepo
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant message
      setMessages(prev => [...prev, {
        id: data.id || `assistant-${Date.now()}`,
        content: data.content,
        role: "assistant"
      }]);

    } catch (error) {
      console.error("Error submitting message:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (message: Message) => {
    return (
      <div
        key={message.id}
        className={`p-4 rounded-lg ${
          message.role === "user"
            ? "bg-blue-100 ml-12"
            : "bg-gray-100 mr-12"
        }`}
      >
        <div className="text-sm prose dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code: ({ inline, className, children, ...props }: CodeComponentProps) => {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Code Repository AI Assistant</CardTitle>
          <CardDescription>Chat with your GitHub repository code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GitHub Repository Input */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-semibold flex items-center mb-3">
              <Github className="mr-2 h-5 w-5" />
              GitHub Repository
            </h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter GitHub repository URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddRepository} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Add Repository"
                )}
              </Button>
            </div>
            {repoName && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✓ Connected to {repoName}
              </div>
            )}
          </div>

          <Separator />

          {/* AI Chatbot */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-semibold mb-3">AI Chatbot</h2>
            <div className="space-y-3">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <Input
                  placeholder="Ask a question about the code or repository..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!activeRepo || isSending}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !activeRepo || !input.trim()}>
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </form>

              {/* Chat Messages */}
              <div className="space-y-4 mt-4">
                {messages.map(renderMessage)}
                {isSending && (
                  <div className="bg-gray-100 mr-12 p-4 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-500 mt-2">
                  Error: {error}
                </div>
              )}

              {!activeRepo && (
                <div className="text-sm text-gray-500 italic">
                  Please add a repository first to start chatting
                </div>
              )}

              {messages.length > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  Powered by RAG with OpenAI and Weaviate
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
