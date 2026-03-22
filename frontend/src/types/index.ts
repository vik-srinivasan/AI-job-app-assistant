export type Step = 1 | 2;

export interface ScrapeResponse {
  text: string;
  title: string;
}

export interface GenerateResponse {
  cover_letter: string;
}

// Resume editor types

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedResume {
  name: string;
  modified: number;
}
