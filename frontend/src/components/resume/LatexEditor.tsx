"use client";

interface LatexEditorProps {
  latexSource: string;
  onChange: (value: string) => void;
}

export default function LatexEditor({ latexSource, onChange }: LatexEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <textarea
        value={latexSource}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 text-slate-800 resize-none border-0 focus:ring-0 focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
