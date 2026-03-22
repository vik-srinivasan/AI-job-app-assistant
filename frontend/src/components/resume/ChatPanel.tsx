"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types";
import { streamResumeChat } from "@/lib/api";

interface ChatPanelProps {
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  latexSource: string;
  onLatexUpdate: (latex: string) => void;
  jobDescription: string;
}

function extractLatex(text: string): string | null {
  const match = text.match(/```latex\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export default function ChatPanel({
  messages,
  setMessages,
  latexSource,
  onLatexUpdate,
  jobDescription,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    let assistantContent = "";
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };

    setMessages([...newMessages, assistantMsg]);

    await streamResumeChat(
      newMessages,
      latexSource,
      jobDescription,
      (chunk) => {
        assistantContent += chunk;
        setMessages([
          ...newMessages,
          { role: "assistant", content: assistantContent },
        ]);
      },
      () => {
        const latex = extractLatex(assistantContent);
        if (latex) {
          onLatexUpdate(latex);
        }
        setStreaming(false);
      },
      (error) => {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${error}` },
        ]);
        setStreaming(false);
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function renderMessageContent(content: string) {
    const parts = content.split(/```latex\s*\n[\s\S]*?```/);
    const hasLatex = content.match(/```latex\s*\n[\s\S]*?```/);

    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && hasLatex && (
              <span className="inline-block mt-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                Resume updated — check the editor
              </span>
            )}
          </span>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            <p className="font-medium text-slate-500 mb-1">Resume Editor</p>
            <p>Ask me to tailor your resume, add experiences, or optimize for a specific role.</p>
            {!jobDescription && (
              <p className="mt-2">Tip: Add a job description above for targeted suggestions.</p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.role === "assistant"
                ? renderMessageContent(msg.content)
                : msg.content}
              {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask to modify your resume..."
            rows={2}
            disabled={streaming}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="self-end px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {streaming ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
