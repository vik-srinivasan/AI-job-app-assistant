import { ChatMessage, GenerateResponse, SavedResume, ScrapeResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function scrapeUrl(url: string): Promise<ScrapeResponse> {
  const res = await fetch(`${API_BASE}/scrape-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to scrape URL" }));
    throw new Error(err.detail || "Failed to scrape URL");
  }
  return res.json();
}

export async function generateCoverLetter(
  jobDescription: string,
  resumeFile: File,
  additionalDocs: File[] = [],
  previousLetter?: string,
  feedback?: string
): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append("job_description", jobDescription);
  formData.append("resume", resumeFile);
  additionalDocs.forEach((doc) => formData.append("additional_docs", doc));
  if (previousLetter) formData.append("previous_letter", previousLetter);
  if (feedback) formData.append("feedback", feedback);

  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Generation failed" }));
    throw new Error(err.detail || "Generation failed");
  }
  return res.json();
}

// Resume editor API functions

export async function getResumeTemplate(): Promise<string> {
  const res = await fetch(`${API_BASE}/resume/template`);
  if (!res.ok) throw new Error("Failed to load template");
  const data = await res.json();
  return data.latex_source;
}

export async function streamResumeChat(
  messages: ChatMessage[],
  latexSource: string,
  jobDescription: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/resume/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      latex_source: latexSource,
      job_description: jobDescription,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Chat failed" }));
    onError(err.detail || "Chat failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "text") {
          onChunk(data.content);
        } else if (data.type === "done") {
          onDone();
          return;
        } else if (data.type === "error") {
          onError(data.content);
          return;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }
  onDone();
}

export async function compileLatex(latexSource: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/resume/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex_source: latexSource }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Compilation failed" }));
    throw new Error(err.detail || "Compilation failed");
  }
  return res.blob();
}

export async function saveResume(name: string, latexSource: string): Promise<void> {
  const res = await fetch(`${API_BASE}/resume/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, latex_source: latexSource }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Save failed" }));
    throw new Error(err.detail || "Save failed");
  }
}

export async function listResumes(): Promise<SavedResume[]> {
  const res = await fetch(`${API_BASE}/resume/list`);
  if (!res.ok) throw new Error("Failed to list resumes");
  const data = await res.json();
  return data.resumes;
}

export async function loadResume(name: string): Promise<string> {
  const res = await fetch(`${API_BASE}/resume/load/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Failed to load resume");
  const data = await res.json();
  return data.latex_source;
}

export async function deleteResume(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/resume/delete/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete resume");
}
