import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import RoleSuggestion
from app.prompts.suggest_roles import SUGGEST_ROLES_PROMPT
from app.services.retrieval import retrieve_roles

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def suggest_roles(profile: CVProfile) -> list[RoleSuggestion]:
    """Return 3 suggested roles for the given profile. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_roles()

    context = retrieve_roles(profile.raw_text[:500])
    context_block = f"Context from career knowledge base:\n{context}\n\n" if context else ""

    prompt = SUGGEST_ROLES_PROMPT.format(
        raw_text=profile.raw_text[:4000],
        context=context_block,
    )

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
        )
        resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        content = content.rsplit("```", 1)[0].strip()

    data = json.loads(content)
    return [RoleSuggestion(**r) for r in data]


def _mock_roles() -> list[RoleSuggestion]:
    return [
        RoleSuggestion(
            id="ml_engineer",
            title="ML Engineer",
            short_description="Build and deploy machine learning models at scale.",
            preview_match_score=78,
        ),
        RoleSuggestion(
            id="data_scientist",
            title="Data Scientist",
            short_description="Extract insights from data using statistics and ML.",
            preview_match_score=71,
        ),
        RoleSuggestion(
            id="backend_developer",
            title="Backend Developer",
            short_description="Design APIs and scalable server infrastructure.",
            preview_match_score=65,
        ),
    ]
