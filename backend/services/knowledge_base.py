import logging
from pathlib import Path

logger = logging.getLogger(__name__)

KNOWLEDGE_BASE_DIR = Path(__file__).parent.parent.parent / "knowledge_base"

# Map of category keywords to filenames
CATEGORY_FILES = {
    "experience": "experience.md",
    "education": "education.md",
    "projects": "projects.md",
    "skills": "skills.md",
}


def load_knowledge_base() -> str:
    """Read all .md files from the knowledge base directory and return as a single string."""
    if not KNOWLEDGE_BASE_DIR.is_dir():
        return ""

    sections = []
    for md_file in sorted(KNOWLEDGE_BASE_DIR.glob("*.md")):
        sections.append(md_file.read_text())

    return "\n\n---\n\n".join(sections)


def append_to_knowledge_base(category: str, content: str) -> str:
    """Append content to a knowledge base .md file. Returns status message."""
    filename = CATEGORY_FILES.get(category.lower())
    if not filename:
        return f"Unknown category '{category}'. Use one of: {', '.join(CATEGORY_FILES.keys())}"

    file_path = KNOWLEDGE_BASE_DIR / filename
    if not file_path.exists():
        return f"File {filename} not found"

    # Append with a newline separator
    existing = file_path.read_text().rstrip()
    file_path.write_text(existing + "\n\n" + content.strip() + "\n")
    logger.info(f"Updated knowledge base: {filename}")
    return f"Successfully added to {filename}"
