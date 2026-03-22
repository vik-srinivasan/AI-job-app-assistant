import logging
from pathlib import Path

from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routers import generate, resume_chat, scrape

app = FastAPI(title="AI Job Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api")
app.include_router(scrape.router, prefix="/api")
app.include_router(resume_chat.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve frontend static export if available (production build)
static_dir = Path(__file__).parent / "static"
if static_dir.is_dir():
    # Mount Next.js assets
    next_dir = static_dir / "_next"
    if next_dir.is_dir():
        app.mount("/_next", StaticFiles(directory=next_dir), name="next-static")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        # Never serve static files for /api paths
        if path.startswith("api/"):
            return {"detail": "Not found"}
        file = static_dir / path
        if file.is_file():
            return FileResponse(file)
        # Support directory-style routes (e.g., /resume -> /resume/index.html)
        index = static_dir / path / "index.html"
        if index.is_file():
            return FileResponse(index)
        return FileResponse(static_dir / "index.html")
