import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import AnalyzeRoleFitResponse
from app.prompts.analyze_role_fit import ANALYZE_ROLE_FIT_PROMPT

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def analyze_role_fit(profile: CVProfile, role: str) -> AnalyzeRoleFitResponse:
    """Run full role fit analysis. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return _mock_analysis(role)

    prompt = ANALYZE_ROLE_FIT_PROMPT.format(role=role, raw_text=profile.raw_text[:4000])

    with httpx.Client(timeout=60) as client:
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
    return AnalyzeRoleFitResponse(**data)


def _mock_analysis(role: str) -> AnalyzeRoleFitResponse:
    return AnalyzeRoleFitResponse(
        selected_role={"title": role, "id": "custom", "description": f"A career as {role}"},
        match_score={"overall": 74, "label": "Good Match"},
        score_breakdown={"skills": 80, "experience": 65, "education": 78},
        strengths=[
            "Strong programming fundamentals",
            "Research and analytical experience",
            "Fast learner with academic track record",
        ],
        weaknesses=[
            "Limited industry / production experience",
            "No cloud platform certifications",
        ],
        matched_skills=["Python", "Statistics", "Git", "Data Analysis"],
        missing_skills=["PyTorch", "MLOps", "Docker", "Cloud platforms"],
        readiness_summary={
            "level": "Nearly Ready",
            "summary": (
                "Strong academic foundation with directly relevant technical skills. "
                "Needs hands-on project experience to bridge the gap to industry roles."
            ),
        },
        priority_improvements=[
            "Build a portfolio project using PyTorch end-to-end",
            "Get certified in AWS or GCP (Cloud Practitioner level)",
            "Contribute to an open-source ML project on GitHub",
        ],
        learning_steps=[
            "Complete fast.ai Practical Deep Learning course (free, 7 lessons)",
            "Build and deploy one end-to-end ML project with a public API",
            "Learn Docker basics and containerise your project",
            "Practice on 2 Kaggle competitions to build public proof of work",
        ],
        possible_projects=[
            "Sentiment analysis API: Build a REST API that classifies text sentiment using a fine-tuned transformer",
            "Image classifier: Train a CNN on a public dataset and serve predictions via FastAPI",
            "Recommendation system: Build a collaborative filtering engine using MovieLens data",
        ],
        resume_improvements=[
            "Quantify the impact of internship work (e.g. 'reduced processing time by 30%')",
            "Add a Projects section showcasing 2-3 ML projects with GitHub links",
        ],
        alternative_roles=["Data Analyst", "ML Research Assistant", "Data Engineer"],
        goal_pathway={
            "short_term": "Build 2 portfolio projects and complete fast.ai course (0–6 months)",
            "mid_term": "Land a junior ML engineer or data scientist role (6–18 months)",
            "long_term": "Lead ML initiatives and mentor junior engineers (2–4 years)",
        },
        evidence_items=[
            "Python listed as primary skill — directly transferable to ML engineering",
            "Research Assistant role shows analytical thinking and experiment design",
        ],
    )
