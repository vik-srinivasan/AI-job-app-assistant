"use client";

type Tool = "cover-letter" | "resume";

interface TopBarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export default function TopBar({ activeTool, onToolChange }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h1 className="text-sm font-semibold text-slate-800">AI Job Assistant</h1>
      </div>

      <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
        <button
          onClick={() => onToolChange("cover-letter")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTool === "cover-letter"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Cover Letter
        </button>
        <button
          onClick={() => onToolChange("resume")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTool === "resume"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Resume Editor
        </button>
      </div>
    </header>
  );
}
