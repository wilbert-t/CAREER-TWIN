import json
from app.models.profile import CVProfile
from app.models.analysis import RoleSuggestion
from app.prompts.suggest_roles import SUGGEST_ROLES_PROMPT
from app.services.retrieval import retrieve_roles
from app.utils.groq_client import groq_chat_async, GROQ_MODEL, has_keys


def _enforce_score_spread(roles: list[RoleSuggestion], min_gap: int = 5) -> list[RoleSuggestion]:
    """
    Ensure adjacent roles differ by at least min_gap points.
    Sorts descending, nudges scores down where gaps are too small,
    clamps to [10, 100], then re-sorts.
    """
    if not roles:
        return roles

    # Sort descending by score so we walk top → bottom
    sorted_roles = sorted(roles, key=lambda r: r.preview_match_score, reverse=True)
    scores = [r.preview_match_score for r in sorted_roles]

    # Walk pairs; push lower score down if gap is too small
    for i in range(len(scores) - 1):
        gap = scores[i] - scores[i + 1]
        if gap < min_gap:
            scores[i + 1] = scores[i] - min_gap

    # Clamp all scores to [10, 100]
    scores = [max(10, min(100, s)) for s in scores]

    # Write scores back into role objects (they are Pydantic models — rebuild)
    result = []
    for role, score in zip(sorted_roles, scores):
        result.append(role.model_copy(update={"preview_match_score": score}))

    # Re-sort descending after clamping (clamping can reorder bottom roles)
    return sorted(result, key=lambda r: r.preview_match_score, reverse=True)


async def suggest_roles(profile: CVProfile) -> list[RoleSuggestion]:
    """Return 5 suggested roles for the given profile. Uses mock if no API key."""
    if not has_keys():
        return _mock_roles()

    context = retrieve_roles(profile.raw_text[:500])
    context_block = f"Context from career knowledge base:\n{context}\n\n" if context else ""

    prompt = SUGGEST_ROLES_PROMPT.format(
        raw_text=profile.raw_text[:12000],
        context=context_block,
    )

    resp_data = await groq_chat_async({
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    })

    content = resp_data["choices"][0]["message"]["content"].strip()
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
        roles = [RoleSuggestion(**r) for r in data]
        return _enforce_score_spread(roles)
    except Exception as exc:
        raise ValueError(f"LLM response did not match expected schema: {exc}") from exc


def _mock_roles() -> list[RoleSuggestion]:
    return _enforce_score_spread([
        RoleSuggestion(
            id="ml_engineer",
            title="ML Engineer",
            short_description="Build and deploy machine learning models at scale.",
            preview_match_score=82,
            skills=["Python", "Model Deployment", "MLOps"],
        ),
        RoleSuggestion(
            id="data_scientist",
            title="Data Scientist",
            short_description="Extract insights from data using statistics and ML.",
            preview_match_score=74,
            skills=["SQL", "Statistical Analysis", "Data Viz"],
        ),
        RoleSuggestion(
            id="data_engineer",
            title="Data Engineer",
            short_description="Design and maintain scalable data pipelines and infrastructure.",
            preview_match_score=68,
            skills=["ETL Pipelines", "Cloud", "Spark"],
        ),
        RoleSuggestion(
            id="backend_developer",
            title="Backend Developer",
            short_description="Design APIs and scalable server infrastructure.",
            preview_match_score=59,
            skills=["APIs", "Databases", "System Design"],
        ),
        RoleSuggestion(
            id="product_analyst",
            title="Product Analyst",
            short_description="Use data to inform product decisions and drive growth.",
            preview_match_score=45,
            skills=["Analytics", "A/B Testing", "Dashboards"],
        ),
    ])
