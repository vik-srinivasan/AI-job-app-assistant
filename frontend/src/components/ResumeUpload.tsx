"use client";

import { useCallback, useState } from "react";

interface Props {
  onSubmit: (resume: File, additionalDocs: File[]) => void;
  onBack?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ResumeUpload({ onSubmit, onBack }: Props) {
  const [resume, setResume] = useState<File | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  function validateFile(file: File): string | null {
    if (file.type !== "application/pdf") return "Only PDF files are accepted";
    if (file.size > MAX_FILE_SIZE) return "File must be under 10MB";
    return null;
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError("");
    setResume(file);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError("");
    setResume(file);
  }

  function handleAdditionalDocs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const invalid = files.find((f) => validateFile(f));
    if (invalid) { setError(validateFile(invalid)!); return; }
    setError("");
    setAdditionalDocs((prev) => [...prev, ...files]);
  }

  function removeAdditionalDoc(index: number) {
    setAdditionalDocs((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="animate-fade-in-up bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Upload Resume</h2>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
          dragActive
            ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]"
            : resume
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
        }`}
      >
        {resume ? (
          <div className="animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900">{resume.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              {(resume.size / 1024).toFixed(0)} KB
            </p>
            <button
              onClick={() => setResume(null)}
              className="mt-3 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">
              Drag and drop your resume here, or{" "}
              <label className="text-indigo-600 font-semibold cursor-pointer hover:text-indigo-700 transition-colors">
                browse
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </p>
            <p className="text-xs text-slate-400 mt-2">PDF only, up to 10MB</p>
          </div>
        )}
      </div>

      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Additional documents <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add files
          <input type="file" accept=".pdf" multiple onChange={handleAdditionalDocs} className="hidden" />
        </label>
        {additionalDocs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {additionalDocs.map((doc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700"
              >
                {doc.name}
                <button onClick={() => removeAdditionalDoc(i)} className="w-4 h-4 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      <div className="mt-7 flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={() => resume && onSubmit(resume, additionalDocs)}
          disabled={!resume}
          className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 active:scale-[0.99]"
        >
          Generate Cover Letter
        </button>
      </div>
    </div>
  );
}
