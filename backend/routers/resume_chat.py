import json
import logging
import re
from pathlib import Path

import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse

from models.schemas import ChatMessage, CompileRequest, ResumeChatRequest, SaveResumeRequest
from services.resume_service import stream_chat

logger = logging.getLogger(__name__)

router = APIRouter()

TEMPLATE_PATH = Path(__file__).parent.parent.parent / "main.tex"
SAVED_RESUMES_DIR = Path(__file__).parent.parent.parent / "saved_resumes"

# Ensure saved_resumes directory exists
SAVED_RESUMES_DIR.mkdir(exist_ok=True)


@router.get("/resume/template")
async def get_template():
    """Return the base LaTeX template."""
    if not TEMPLATE_PATH.is_file():
        raise HTTPException(status_code=404, detail="Template not found")
    return {"latex_source": TEMPLATE_PATH.read_text()}


@router.post("/resume/chat")
async def chat(request: ResumeChatRequest):
    """Stream a chat response for resume editing."""
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    def event_stream():
        try:
            for chunk in stream_chat(messages, request.latex_source, request.job_description):
                data = json.dumps({"type": "text", "content": chunk})
                yield f"data: {data}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/resume/compile")
async def compile_latex(request: CompileRequest):
    """Compile LaTeX source to PDF via external API."""
    try:
        response = requests.post(
            "https://latex.ytotech.com/builds/sync",
            json={
                "compiler": "pdflatex",
                "resources": [
                    {
                        "main": True,
                        "content": request.latex_source,
                    }
                ],
            },
            timeout=30,
        )

        # Accept any response that contains PDF content
        content_type = response.headers.get("content-type", "")
        if "application/pdf" in content_type or response.content[:5] == b"%PDF-":
            return Response(
                content=response.content,
                media_type="application/pdf",
            )

        # Not a PDF — treat as error
        error_text = response.text[:500]
        raise HTTPException(
            status_code=502,
            detail=f"LaTeX compilation failed: {error_text}",
        )
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="LaTeX compilation timed out")
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"LaTeX compilation service error: {e}")


@router.post("/resume/save")
async def save_resume(request: SaveResumeRequest):
    """Save a resume .tex file."""
    # Sanitize filename
    safe_name = re.sub(r"[^\w\-]", "_", request.name)
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid name")

    file_path = SAVED_RESUMES_DIR / f"{safe_name}.tex"
    file_path.write_text(request.latex_source)
    return {"name": safe_name, "message": "Resume saved"}


@router.get("/resume/list")
async def list_resumes():
    """List all saved resumes."""
    files = sorted(SAVED_RESUMES_DIR.glob("*.tex"), key=lambda f: f.stat().st_mtime, reverse=True)
    return {"resumes": [{"name": f.stem, "modified": f.stat().st_mtime} for f in files]}


@router.get("/resume/load/{name}")
async def load_resume(name: str):
    """Load a saved resume."""
    safe_name = re.sub(r"[^\w\-]", "_", name)
    file_path = SAVED_RESUMES_DIR / f"{safe_name}.tex"
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"name": safe_name, "latex_source": file_path.read_text()}


@router.delete("/resume/delete/{name}")
async def delete_resume(name: str):
    """Delete a saved resume."""
    safe_name = re.sub(r"[^\w\-]", "_", name)
    file_path = SAVED_RESUMES_DIR / f"{safe_name}.tex"
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Resume not found")
    file_path.unlink()
    return {"message": "Resume deleted"}
