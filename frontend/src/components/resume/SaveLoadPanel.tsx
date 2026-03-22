"use client";

import { useState, useEffect } from "react";
import { SavedResume } from "@/types";
import { listResumes, saveResume, loadResume, deleteResume } from "@/lib/api";

interface SaveLoadPanelProps {
  latexSource: string;
  onLoad: (latex: string) => void;
}

export default function SaveLoadPanel({ latexSource, onLoad }: SaveLoadPanelProps) {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshList() {
    try {
      const list = await listResumes();
      setResumes(list);
    } catch {
      // Silently fail on list errors
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      await saveResume(saveName.trim(), latexSource);
      setMessage("Saved!");
      setSaveName("");
      refreshList();
      setTimeout(() => setMessage(""), 2000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleLoad(name: string) {
    try {
      const latex = await loadResume(name);
      onLoad(latex);
      setMessage(`Loaded "${name}"`);
      setTimeout(() => setMessage(""), 2000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteResume(name);
      refreshList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="p-3 border-t border-slate-200 bg-slate-50">
      {/* Save */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="Resume name..."
          className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={saving || !saveName.trim()}
          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Save
        </button>
      </div>

      {message && (
        <p className="text-xs text-emerald-600 mb-2">{message}</p>
      )}

      {/* Saved list */}
      {resumes.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {resumes.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between px-2 py-1 text-xs bg-white rounded border border-slate-200"
            >
              <button
                onClick={() => handleLoad(r.name)}
                className="text-indigo-600 hover:text-indigo-700 font-medium truncate mr-2"
              >
                {r.name}
              </button>
              <button
                onClick={() => handleDelete(r.name)}
                className="text-red-400 hover:text-red-600 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
