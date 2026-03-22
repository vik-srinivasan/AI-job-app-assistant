"use client";

import { useState, useEffect } from "react";
import { ChatMessage } from "@/types";
import { getResumeTemplate } from "@/lib/api";
import ChatPanel from "@/components/resume/ChatPanel";
import LatexEditor from "@/components/resume/LatexEditor";
import PdfPreview from "@/components/resume/PdfPreview";
import SaveLoadPanel from "@/components/resume/SaveLoadPanel";

type RightTab = "preview" | "source";

interface ResumeEditorPanelProps {
  jobDescription: string;
}

export default function ResumeEditorPanel({ jobDescription }: ResumeEditorPanelProps) {
  const [latexSource, setLatexSource] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rightTab, setRightTab] = useState<RightTab>("preview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResumeTemplate()
      .then(setLatexSource)
      .catch(() => setLatexSource("% Failed to load template"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading template...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left pane: Chat */}
      <div className="w-1/2 flex flex-col border-r border-slate-200">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-medium text-slate-500">Chat</span>
          <button
            onClick={() => {
              setMessages([]);
              getResumeTemplate().then(setLatexSource);
            }}
            className="px-2 py-1 text-xs border border-slate-300 text-slate-600 rounded-md hover:bg-white font-medium transition-colors"
          >
            New Resume
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel
            messages={messages}
            setMessages={setMessages}
            latexSource={latexSource}
            onLatexUpdate={setLatexSource}
            jobDescription={jobDescription}
          />
        </div>
        <SaveLoadPanel latexSource={latexSource} onLoad={setLatexSource} />
      </div>

      {/* Right pane: Editor/Preview */}
      <div className="w-1/2 flex flex-col">
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setRightTab("preview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              rightTab === "preview"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setRightTab("source")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              rightTab === "source"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Source
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {rightTab === "preview" ? (
            <PdfPreview latexSource={latexSource} />
          ) : (
            <LatexEditor latexSource={latexSource} onChange={setLatexSource} />
          )}
        </div>
      </div>
    </div>
  );
}
