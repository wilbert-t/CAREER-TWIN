import json
from app.models.profile import CVProfile, Experience, Education
from app.prompts.cv_structure import STRUCTURE_CV_PROMPT
from app.utils.groq_client import groq_chat_async, GROQ_MODEL, has_keys


async def structure_cv(raw_text: str) -> CVProfile:
    """Call Groq LLM to convert raw CV text into a structured CVProfile."""
    if not has_keys() or not raw_text.strip():
        return _mock_structure(raw_text)

    prompt = STRUCTURE_CV_PROMPT.format(raw_text=raw_text[:12000])

    resp_data = await groq_chat_async({
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    })

    content = resp_data["choices"][0]["message"]["content"]
    # Strip markdown code fences if the LLM wraps the JSON
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        content = content.rsplit("```", 1)[0].strip()
    data = json.loads(content)
    return _dict_to_profile(data, raw_text)


def _dict_to_profile(data: dict, raw_text: str) -> CVProfile:
    return CVProfile(
        name=data.get("name", ""),
        headline=data.get("headline", ""),
        summary=data.get("summary", ""),
        raw_text=raw_text,
        experience=[
            Experience(**e) for e in data.get("experience", [])
            if isinstance(e, dict)
        ],
        education=[
            Education(**e) for e in data.get("education", [])
            if isinstance(e, dict)
        ],
        skills=data.get("skills", []),
        projects=data.get("projects", []),
        certificates=data.get("certificates", []),
        leadership=data.get("leadership", []),
    )


def _mock_structure(raw_text: str) -> CVProfile:
    """Return a plausible mock structure when no API key is set."""
    return CVProfile(
        name="Demo Candidate",
        headline="Software Developer",
        summary="A motivated developer with experience in web technologies.",
        raw_text=raw_text,
        skills=["Python", "JavaScript", "SQL"],
        experience=[
            Experience(
                title="Intern", company="Tech Co", duration="2023–2024",
                description="Built internal tools"
            )
        ],
        education=[
            Education(
                degree="BSc Computer Science",
                institution="State University",
                year="2024"
            )
        ],
    )
