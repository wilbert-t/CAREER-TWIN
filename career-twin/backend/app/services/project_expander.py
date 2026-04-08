import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import ExpandProjectResponse
from app.prompts.expand_project import EXPAND_PROJECT_PROMPT

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def expand_project(
    profile: CVProfile,
    role: str,
    project_name: str,
    short_description: str,
) -> ExpandProjectResponse:
    """Expand a project idea into a detailed breakdown. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_expansion(project_name, short_description)

    prompt = EXPAND_PROJECT_PROMPT.format(
        role=role,
        project_name=project_name,
        short_description=short_description,
        raw_text=profile.raw_text[:2000],
    )

    with httpx.Client(timeout=60) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.4,
            },
        )
        resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        content = content.rsplit("```", 1)[0].strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM returned non-JSON content. First 200 chars: {content[:200]}"
        ) from exc
    try:
        return ExpandProjectResponse(**data)
    except Exception as exc:
        raise ValueError(f"LLM response did not match expected schema: {exc}") from exc


def _mock_expansion(project_name: str, short_description: str) -> ExpandProjectResponse:
    return ExpandProjectResponse(
        name=project_name,
        short_description=short_description,
        difficulty=3,
        uniqueness=3,
        duration="2-3 weeks",
        description=(
            f"{project_name} involves building a full-stack application that {short_description.lower()}. "
            "The project starts with data modelling and a backend API, then adds a clean frontend interface. "
            "By the end you will have a deployable application with real-world structure and documented code."
        ),
        objectives=(
            "This project directly demonstrates skills that hiring managers look for in entry-level candidates. "
            "You will practise the full development lifecycle — from design to deployment — and produce a "
            "portfolio piece you can walk through in interviews."
        ),
        tools_required=["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "pytest"],
    )
