# AI Job Assistant

A full-stack AI-powered tool for tailoring resumes and generating cover letters for specific job applications.

## What It Does

**Resume Editor** — Chat with Claude Sonnet to tailor a LaTeX resume for a target role. Paste a job description (or scrape one from a URL), and the AI restructures and rewrites resume content to emphasize relevant experience. The editor includes a live PDF preview via server-side LaTeX compilation, a source editor for direct LaTeX editing, and save/load for managing multiple resume versions.

**Cover Letter Generator** — Upload a resume PDF and job description to generate a personalized cover letter. Supports iterative refinement through a feedback loop — request changes and the AI revises in place.

**Knowledge Base** — Experiences, projects, education, and skills are stored in structured Markdown files. The AI draws from this persistent knowledge base when building resumes, so past roles and projects are always available without re-entering them. The AI can also scrape GitHub links and other URLs to pull in new project details, and automatically updates the knowledge base with new information.

Both tools share a unified interface with a single job description input, so context flows naturally between resume editing and cover letter generation.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), Anthropic SDK (Claude Sonnet)
- **LaTeX Rendering**: Server-side compilation via external API, rendered as PDF in-browser
- **Deployment**: Single Render web service (static frontend export served by FastAPI)

## Architecture

```
Frontend (Next.js static export)
  ├── Unified single-page app with tool switcher
  ├── Streaming SSE chat interface
  ├── LaTeX source editor + PDF preview pane
  └── Cover letter generation with iterative refinement

Backend (FastAPI)
  ├── /api/resume/chat     — Streaming AI chat with tool use (URL scraping, knowledge base updates)
  ├── /api/resume/compile  — LaTeX → PDF compilation proxy
  ├── /api/resume/save|load|list|delete — Resume version management
  ├── /api/generate        — Cover letter generation + refinement
  └── /api/scrape-url      — Job posting URL scraper
```

## Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add ANTHROPIC_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
