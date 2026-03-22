from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    text: str
    title: str


class GenerateResponse(BaseModel):
    cover_letter: str


# Resume editor schemas


class ChatMessage(BaseModel):
    role: str
    content: str


class ResumeChatRequest(BaseModel):
    messages: list[ChatMessage]
    latex_source: str
    job_description: str = ""


class CompileRequest(BaseModel):
    latex_source: str


class SaveResumeRequest(BaseModel):
    name: str
    latex_source: str
