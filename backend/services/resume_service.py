import json
import logging
import os
import re

import anthropic
from dotenv import load_dotenv

from services.knowledge_base import append_to_knowledge_base, load_knowledge_base
from services.scrape_service import scrape_job_description

load_dotenv()
logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

TOOLS = [
    {
        "name": "scrape_url",
        "description": "Fetch and extract text content from a URL. Use this when the user shares a link (GitHub repo, project page, job posting, etc.) and you need to understand what it contains.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to scrape",
                }
            },
            "required": ["url"],
        },
    },
    {
        "name": "update_knowledge_base",
        "description": "Add new information to the knowledge base so it persists for future resume sessions. Use this when the user provides new experiences, projects, education, or skills that should be remembered. Categories: experience, education, projects, skills.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["experience", "education", "projects", "skills"],
                    "description": "Which knowledge base file to update",
                },
                "content": {
                    "type": "string",
                    "description": "The markdown-formatted content to append. Use the same format as the existing entries in the knowledge base.",
                },
            },
            "required": ["category", "content"],
        },
    },
]

SYSTEM_PROMPT_TEMPLATE = """You are an expert resume editor and career advisor for Vikram Srinivasan. \
You help tailor LaTeX resumes for specific job applications.

You have access to Vikram's full background below. When asked to add or modify \
experiences, projects, or skills, draw from this knowledge base — do not invent information.

--- KNOWLEDGE BASE ---
{knowledge_base}

--- CURRENT LATEX RESUME ---
{latex_source}

## Tools:
You have two tools available:
1. **scrape_url**: Use this when the user shares any link (GitHub, project pages, job postings). \
Scrape it first to understand the content before making resume changes.
2. **update_knowledge_base**: Use this when the user provides NEW information about their \
experiences, projects, or skills that isn't already in the knowledge base. This persists the \
info for future sessions. Use markdown formatting matching the existing style.

## Instructions:
- When the user asks for resume changes, return the COMPLETE updated LaTeX source \
in a fenced code block like: ```latex ... ```
- Preserve the existing LaTeX template structure and custom commands \
(\\resumeSubheading, \\resumeItem, \\resumeProjectHeading, etc.).
- Keep the resume to one page — be selective about what to include.
- Explain what changes you made conversationally before the code block.
- If given a job description, analyze it and tailor the resume to highlight \
the most relevant experiences and skills.
- If the user shares a link, use scrape_url to fetch its contents first.
- If the user provides new experiences/projects/skills not in the knowledge base, \
use update_knowledge_base to save them for future use.
- If the user just wants to chat or ask questions, respond normally without a code block.
- Only output LaTeX code blocks when you are actually making changes to the resume."""


def _handle_tool_call(tool_name: str, tool_input: dict) -> str:
    """Execute a tool call and return the result."""
    if tool_name == "scrape_url":
        try:
            result = scrape_job_description(tool_input["url"])
            return f"Title: {result['title']}\n\nContent:\n{result['text'][:3000]}"
        except Exception as e:
            return f"Failed to scrape URL: {e}"
    elif tool_name == "update_knowledge_base":
        return append_to_knowledge_base(tool_input["category"], tool_input["content"])
    return f"Unknown tool: {tool_name}"


def build_system_prompt(latex_source: str, job_description: str = "") -> str:
    """Build the system prompt with knowledge base and current LaTeX."""
    knowledge_base = load_knowledge_base()
    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        knowledge_base=knowledge_base,
        latex_source=latex_source,
    )
    if job_description:
        prompt += f"\n\n--- TARGET JOB DESCRIPTION ---\n{job_description}"
    return prompt


def stream_chat(messages: list[dict], latex_source: str, job_description: str = ""):
    """Handle chat with tool use, then stream the final response."""
    system_prompt = build_system_prompt(latex_source, job_description)

    # First pass: non-streaming to handle any tool calls
    current_messages = list(messages)

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=current_messages,
            tools=TOOLS,
        )

        logger.info(f"Response stop_reason: {response.stop_reason}")

        # If no tool use, stream this response's text
        if response.stop_reason != "tool_use":
            for block in response.content:
                if block.type == "text":
                    yield block.text
            return

        # Handle tool calls
        tool_results = []
        text_parts = []
        for block in response.content:
            if block.type == "text" and block.text:
                text_parts.append(block.text)
            elif block.type == "tool_use":
                logger.info(f"Tool call: {block.name}({json.dumps(block.input)})")
                result = _handle_tool_call(block.name, block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    }
                )

        # Yield any text that came before/with the tool calls
        for text in text_parts:
            yield text

        # Add the assistant response and tool results to continue the conversation
        current_messages.append({"role": "assistant", "content": response.content})
        current_messages.append({"role": "user", "content": tool_results})


def extract_latex_from_response(response_text: str) -> str | None:
    """Extract LaTeX code block from an AI response, if present."""
    match = re.search(r"```latex\s*\n(.*?)```", response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None
