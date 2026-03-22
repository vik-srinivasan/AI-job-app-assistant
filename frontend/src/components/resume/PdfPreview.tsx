"use client";

import { useState } from "react";
import { compileLatex } from "@/lib/api";

interface PdfPreviewProps {
  latexSource: string;
}

export default function PdfPreview({ latexSource }: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState("");

  async function handleCompile() {
    setCompiling(true);
    setError("");
    try {
      const blob = await compileLatex(latexSource);
      // Revoke old URL to avoid memory leak
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compilation failed");
    } finally {
      setCompiling(false);
    }
  }

  function handleDownloadPdf() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "resume.pdf";
    a.click();
  }

  function handleDownloadTex() {
    const blob = new Blob([latexSource], { type: "text/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.tex";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-slate-200 bg-white">
        <button
          onClick={handleCompile}
          disabled={compiling}
          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors"
        >
          {compiling ? "Compiling..." : "Compile PDF"}
        </button>
        {pdfUrl && (
          <button
            onClick={handleDownloadPdf}
            className="px-3 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors"
          >
            Download PDF
          </button>
        )}
        <button
          onClick={handleDownloadTex}
          className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
          Download .tex
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 bg-slate-100">
        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-medium mb-1">Compilation Error</p>
            <p className="whitespace-pre-wrap text-xs">{error}</p>
          </div>
        )}

        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Resume PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p>Click &quot;Compile PDF&quot; to preview your resume</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
