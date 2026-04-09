import json
from app.models.profile import CVProfile
from app.models.analysis import AnalyzeRoleFitResponse
from app.prompts.analyze_role_fit import ANALYZE_ROLE_FIT_PROMPT
from app.services.retrieval import retrieve_projects, retrieve_trajectories
from app.utils.groq_client import groq_chat_sync, GROQ_MODEL, has_keys


def _weighted_overall(breakdown: dict) -> int:
    """Calculate overall score as weighted average of breakdown dimensions."""
    skills     = breakdown.get("skills", 0)
    experience = breakdown.get("experience", 0)
    education  = breakdown.get("education", 0)
    return round(skills * 0.40 + experience * 0.35 + education * 0.25)


def _score_label(overall: int) -> str:
    if overall >= 80: return "Strong Match"
    if overall >= 65: return "Good Match"
    if overall >= 50: return "Developing Match"
    return "Early Stage"


def analyze_role_fit(profile: CVProfile, role: str) -> AnalyzeRoleFitResponse:
    """Run full role fit analysis. Uses mock if no API key."""
    if not has_keys():
        return _mock_analysis(role)

    ctx_projects = retrieve_projects(role)
    ctx_trajectories = retrieve_trajectories(role)
    context_parts = [p for p in [ctx_projects, ctx_trajectories] if p]
    context_block = (
        "Context from career knowledge base:\n" + "\n".join(context_parts) + "\n\n"
        if context_parts else ""
    )

    prompt = ANALYZE_ROLE_FIT_PROMPT.format(
        role=role,
        raw_text=profile.raw_text[:4000],
        context=context_block,
    )

    resp_data = groq_chat_sync({
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
    # Calculate overall score from weighted breakdown (LLM does not set this)
    breakdown = data.get("score_breakdown", {})
    overall = _weighted_overall(breakdown)
    data["match_score"] = {"overall": overall, "label": _score_label(overall)}
    try:
        return AnalyzeRoleFitResponse(**data)
    except Exception as exc:
        raise ValueError(f"LLM response did not match expected schema: {exc}") from exc


def _mock_analysis(role: str) -> AnalyzeRoleFitResponse:
    # Realistic scores for a typical university student — strict calibration applied
    breakdown = {"skills": 58, "experience": 42, "education": 72}
    overall = _weighted_overall(breakdown)
    return AnalyzeRoleFitResponse(
        selected_role={"title": role, "id": "custom", "description": f"A career as {role}"},
        match_score={"overall": overall, "label": _score_label(overall)},
        score_breakdown=breakdown,
        strengths=[
            "Strong programming fundamentals",
            "Research and analytical experience",
            "Fast learner with academic track record",
        ],
        weaknesses=[
            "No paid industry experience — academic projects only",
            "Missing core production tools (Docker, cloud, CI/CD)",
        ],
        matched_skills=["Python", "Statistics", "Git", "Data Analysis"],
        missing_skills=["PyTorch", "MLOps", "Docker", "Cloud platforms"],
        readiness_summary={
            "level": "Developing",
            "summary": (
                "Strong academic foundation but no paid industry experience yet. "
                "Needs 1-2 shipped projects and an internship to be competitive for junior roles."
            ),
        },
        priority_improvements=[
            {
                "area": "Skills",
                "title": "Build an end-to-end PyTorch project",
                "detail": "You have Python proficiency but no ML framework experience on your CV. Most ML engineer roles expect at least one shipped model built with PyTorch or TensorFlow.",
                "action": "Complete fast.ai Practical Deep Learning (Lessons 1–4) and deploy a sentiment classifier to Hugging Face Spaces this month.",
            },
            {
                "area": "Experience",
                "title": "Get hands-on cloud platform exposure",
                "detail": "Your experience is entirely academic with no cloud deployments mentioned. Production ML roles require comfort with AWS, GCP, or Azure for model hosting and data pipelines.",
                "action": "Create a free-tier AWS account and deploy one project using SageMaker or Lambda — even a simple inference endpoint counts.",
            },
            {
                "area": "Education",
                "title": "Earn a recognised ML certification",
                "detail": "Certifications signal commitment and baseline knowledge to recruiters, especially for candidates transitioning from academia. AWS and Google ML certificates are highly regarded.",
                "action": "Register for the Google Professional Machine Learning Engineer exam and target completion within 8 weeks using the official study guide.",
            },
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
            "Use stronger action verbs at the start of each bullet, such as built, deployed, automated, or improved",
            "List the exact tools, libraries, and platforms used in each project so recruiters can match keywords quickly",
            "Bring the most role-relevant experience and technical skills higher up the CV for faster scanning",
        ],
        alternative_roles=["Data Analyst", "ML Research Assistant", "Data Engineer"],
        goal_pathway={
            "short_term": "Build 2 portfolio projects and complete fast.ai course (0–6 months)",
            "mid_term": "Land a junior ML engineer or data scientist role (6–18 months)",
            "long_term": "Lead ML initiatives and mentor junior engineers (2–4 years)",
        },
        evidence_items=[
            "[CV] Python listed as primary skill — directly transferable to ML engineering",
            "[CV] Research Assistant role shows analytical thinking and experiment design",
            "[Project] Academic data analysis project demonstrates applied statistics",
            "[Certificate] Relevant coursework and self-study can strengthen early-career ML positioning",
            "[CV] Degree background suggests strong mathematical and technical foundations",
            "[Project] Portfolio-style project work can compensate for limited paid industry experience",
        ],
    )
