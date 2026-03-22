"use client";

import { useState } from "react";
import { scrapeUrl } from "@/lib/api";

interface JobDescriptionBarProps {
  jobDescription: string;
  setJobDescription: (jd: string) => void;
}

export default function JobDescriptionBar({
  jobDescription,
  setJobDescription,
}: JobDescriptionBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetchUrl() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await scrapeUrl(url.trim());
      setJobDescription(result.text);
      setUrl("");
      setMode("paste");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch URL");
    } finally {
      setLoading(false);
    }
  }

  const preview = jobDescription
    ? jobDescription.slice(0, 80).replace(/\n/g, " ") + (jobDescription.length > 80 ? "..." : "")
    : "";

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
      >
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-slate-700">Job Description</span>
        {jobDescription ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400 truncate text-xs">{preview}</span>
          </>
        ) : (
          <span className="text-slate-400 text-xs">None added</span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Mode toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setMode("paste")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "paste"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setMode("url")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "url"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              From URL
            </button>
          </div>

          {/* URL input */}
          {mode === "url" && (
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/job-posting"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors"
              />
              <button
                onClick={handleFetchUrl}
                disabled={loading || !url.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                ) : (
                  "Fetch"
                )}
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={6}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm leading-relaxed bg-slate-50/50 focus:bg-white focus:border-indigo-300 resize-y transition-colors placeholder:text-slate-400"
          />

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </p>
          )}

          {jobDescription && (
            <button
              onClick={() => setJobDescription("")}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
