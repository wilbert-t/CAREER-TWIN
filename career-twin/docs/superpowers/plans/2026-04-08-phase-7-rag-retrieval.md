# Phase 7 – Lean RAG Retrieval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional ChromaDB retrieval layer that enriches LLM prompts with context from the knowledge base, with zero hard dependency on RAG for the demo.

**Architecture:** A single `retrieval.py` service wraps ChromaDB + sentence-transformers. It indexes the five JSONL knowledge base files on first call and exposes three context-string functions (`retrieve_roles`, `retrieve_projects`, `retrieve_trajectories`). Every function catches all exceptions and returns `""` (empty string) so the app always works even if ChromaDB or the embedding model is unavailable. The prompts for `suggest_roles` and `analyze_role_fit` are updated with an optional `{context}` placeholder.

**Tech Stack:** ChromaDB 0.4.21, sentence-transformers 2.2.2 (all-MiniLM-L6-v2), Python 3.11, pytest, unittest.mock

---

## File Map

| File | Action |
|------|--------|
| `career-twin/backend/app/services/retrieval.py` | Create – ChromaDB client, indexer, 3 retrieve functions |
| `career-twin/backend/app/prompts/suggest_roles.py` | Modify – add optional `{context}` section |
| `career-twin/backend/app/prompts/analyze_role_fit.py` | Modify – add optional `{context}` section |
| `career-twin/backend/app/services/role_suggester.py` | Modify – call `retrieve_roles`, pass context to prompt |
| `career-twin/backend/app/services/role_analyzer.py` | Modify – call `retrieve_projects` + `retrieve_trajectories`, pass context |
| `career-twin/backend/tests/test_retrieval.py` | Create – 4 tests for retrieval functions |
| `career-twin/backend/.gitignore` (or root `.gitignore`) | Modify – ignore `chroma_db/` directory |

---

### Task 1: Create the retrieval service

**Files:**
- Create: `career-twin/backend/app/services/retrieval.py`
- Test: `career-twin/backend/tests/test_retrieval.py`

- [ ] **Step 1: Write the failing tests first**

```python
# career-twin/backend/tests/test_retrieval.py
from unittest.mock import patch
from app.services.retrieval import retrieve_roles, retrieve_projects, retrieve_trajectories


def test_retrieve_roles_returns_str_when_client_unavailable():
    """If ChromaDB is unavailable, return empty string (no crash)."""
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_roles("Python developer with machine learning experience")
    assert isinstance(result, str)


def test_retrieve_projects_returns_str_when_client_unavailable():
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_projects("Software Engineer")
    assert isinstance(result, str)


def test_retrieve_trajectories_returns_str_when_client_unavailable():
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_trajectories("junior engineer")
    assert isinstance(result, str)


def test_retrieve_roles_returns_str_when_embedding_fn_unavailable():
    """Even with a client, if embeddings fail we return empty string."""
    import chromadb
    client = chromadb.Client()  # in-memory, no persistence
    with patch("app.services.retrieval._get_client", return_value=client), \
         patch("app.services.retrieval._embedding_fn", return_value=None):
        result = retrieve_roles("data analyst")
    assert isinstance(result, str)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_retrieval.py -v
```

Expected: `ModuleNotFoundError` or `ImportError` — `retrieval.py` doesn't exist yet.

- [ ] **Step 3: Create `app/services/retrieval.py`**

```python
# career-twin/backend/app/services/retrieval.py
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# knowledge_base/ is two levels above backend/
KB_PATH = Path(__file__).resolve().parents[4] / "knowledge_base"
# ChromaDB persists inside backend/chroma_db/
CHROMA_PATH = Path(__file__).resolve().parents[2] / "chroma_db"


def _get_client():
    """Return a persistent ChromaDB client. Returns None if unavailable."""
    try:
        import chromadb
        return chromadb.PersistentClient(path=str(CHROMA_PATH))
    except Exception as e:
        logger.warning("ChromaDB unavailable: %s", e)
        return None


def _embedding_fn():
    """Return a ChromaDB-compatible sentence-transformer embedding function."""
    try:
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
        return SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    except Exception as e:
        logger.warning("Embedding function unavailable: %s", e)
        return None


def _ensure_indexed(client, ef, collection_name: str, jsonl_path: Path) -> Optional[object]:
    """Get or create a ChromaDB collection; index JSONL if empty."""
    try:
        coll = client.get_or_create_collection(name=collection_name, embedding_function=ef)
        if coll.count() > 0:
            return coll

        docs, ids, metas = [], [], []
        with open(jsonl_path) as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                obj = json.loads(line)
                # Build a combined text representation from all string fields
                text_parts = [
                    obj.get("description", ""),
                    obj.get("pathway", ""),
                    obj.get("title", ""),
                    obj.get("from_role", ""),
                    obj.get("to_role", ""),
                    " ".join(str(s) for s in obj.get("skills", [])),
                ]
                text = " ".join(p for p in text_parts if p).strip()
                meta = {k: str(v) for k, v in obj.items() if isinstance(v, (str, int, float))}
                docs.append(text or collection_name)
                ids.append(f"{collection_name}_{i}")
                metas.append(meta)

        if docs:
            coll.add(documents=docs, ids=ids, metadatas=metas)
        return coll
    except Exception as e:
        logger.warning("Indexing failed for %s: %s", collection_name, e)
        return None


def retrieve_roles(profile_text: str) -> str:
    """
    Return top relevant roles as a context string for LLM prompts.
    Returns '' on any failure (ChromaDB unavailable, index missing, etc.).
    """
    client = _get_client()
    if not client:
        return ""
    ef = _embedding_fn()
    if not ef:
        return ""

    titles = []
    for filename, coll_name in [
        ("roles_tech.jsonl", "roles_tech"),
        ("roles_business.jsonl", "roles_business"),
    ]:
        path = KB_PATH / filename
        if not path.exists():
            continue
        coll = _ensure_indexed(client, ef, coll_name, path)
        if not coll:
            continue
        try:
            qr = coll.query(query_texts=[profile_text[:500]], n_results=2)
            for meta in qr["metadatas"][0]:
                t = meta.get("title", "")
                if t:
                    titles.append(t)
        except Exception as e:
            logger.warning("Query failed for %s: %s", coll_name, e)

    if not titles:
        return ""
    unique = list(dict.fromkeys(titles))  # deduplicate, preserve order
    return "Relevant roles from knowledge base: " + ", ".join(unique) + "."


def retrieve_projects(role_title: str) -> str:
    """
    Return top relevant project ideas as a context string.
    Returns '' on any failure.
    """
    client = _get_client()
    if not client:
        return ""
    ef = _embedding_fn()
    if not ef:
        return ""

    path = KB_PATH / "project_ideas.jsonl"
    if not path.exists():
        return ""

    coll = _ensure_indexed(client, ef, "project_ideas", path)
    if not coll:
        return ""

    try:
        qr = coll.query(query_texts=[role_title], n_results=3)
        titles = [m.get("title", "") for m in qr["metadatas"][0] if m.get("title")]
        if not titles:
            return ""
        return "Relevant project ideas from knowledge base: " + ", ".join(titles) + "."
    except Exception as e:
        logger.warning("Project retrieval failed: %s", e)
        return ""


def retrieve_trajectories(role_title: str) -> str:
    """
    Return relevant career trajectory context as a string.
    Returns '' on any failure.
    """
    client = _get_client()
    if not client:
        return ""
    ef = _embedding_fn()
    if not ef:
        return ""

    path = KB_PATH / "career_trajectories.jsonl"
    if not path.exists():
        return ""

    coll = _ensure_indexed(client, ef, "career_trajectories", path)
    if not coll:
        return ""

    try:
        qr = coll.query(query_texts=[role_title], n_results=2)
        pathways = []
        for m in qr["metadatas"][0]:
            fr = m.get("from_role", "")
            to = m.get("to_role", "")
            if fr and to:
                pathways.append(f"{fr} → {to}")
        if not pathways:
            return ""
        return "Relevant career pathways: " + ", ".join(pathways) + "."
    except Exception as e:
        logger.warning("Trajectory retrieval failed: %s", e)
        return ""
```

- [ ] **Step 4: Add `chroma_db/` to `.gitignore`**

Open `/Users/wilbert/Documents/GitHub/CAREER-TWIN/.gitignore` and add:

```
# ChromaDB local vector store
career-twin/backend/chroma_db/
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_retrieval.py -v
```

Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
cd career-twin/backend && git add app/services/retrieval.py tests/test_retrieval.py ../../.gitignore
git commit -m "feat: lean RAG retrieval service with ChromaDB + sentence-transformers"
```

---

### Task 2: Update `suggest_roles` prompt and service

**Files:**
- Modify: `career-twin/backend/app/prompts/suggest_roles.py`
- Modify: `career-twin/backend/app/services/role_suggester.py`

- [ ] **Step 1: Update the prompt to accept optional context**

Replace the entire content of `career-twin/backend/app/prompts/suggest_roles.py`:

```python
SUGGEST_ROLES_PROMPT = """\
You are a career advisor. Given the candidate's CV below, suggest exactly 3 career roles \
that best match their background.

{context}
Return a JSON array with exactly 3 objects. Each object must have these fields:
- "id": a short snake_case identifier (e.g. "ml_engineer")
- "title": the role title
- "short_description": one sentence describing what this role does
- "preview_match_score": integer from 0 to 100 estimating how well the candidate matches

Rules:
- Return ONLY the JSON array. No markdown, no commentary.
- Scores must be realistic and differentiated (not all the same).
- Order by score descending.

CANDIDATE CV:
{raw_text}
"""
```

Note: when `{context}` is an empty string, the blank line is harmless.

- [ ] **Step 2: Update `role_suggester.py` to pass context**

Replace the `suggest_roles` function in `career-twin/backend/app/services/role_suggester.py`:

```python
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
```

- [ ] **Step 3: Run existing tests to confirm no regression**

```bash
cd career-twin/backend && .venv/bin/pytest tests/test_roles.py -v
```

Expected: all tests PASS (retrieval fails silently when called with no real DB in test env).

- [ ] **Step 4: Commit**

```bash
git add career-twin/backend/app/prompts/suggest_roles.py career-twin/backend/app/services/role_suggester.py
git commit -m "feat: enrich suggest-roles prompt with optional RAG context"
```

---

### Task 3: Update `analyze_role_fit` prompt and service

**Files:**
- Modify: `career-twin/backend/app/prompts/analyze_role_fit.py`
- Modify: `career-twin/backend/app/services/role_analyzer.py`

- [ ] **Step 1: Update the analyze_role_fit prompt to accept context and tag evidence items**

Replace `career-twin/backend/app/prompts/analyze_role_fit.py` entirely:

```python
ANALYZE_ROLE_FIT_PROMPT = """\
You are a career analyst. Given the candidate's CV and their target role, produce a \
comprehensive career fit analysis.

{context}
Return a single JSON object with EXACTLY these fields:

{{
  "selected_role": {{"title": "...", "id": "...", "description": "one sentence"}},
  "match_score": {{"overall": <int 0-100>, "label": "Good Match|Strong Match|Developing Match"}},
  "score_breakdown": {{"skills": <int 0-100>, "experience": <int 0-100>, "education": <int 0-100>}},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "readiness_summary": {{"level": "Ready|Nearly Ready|Developing", "summary": "2 sentence summary"}},
  "priority_improvements": ["action 1", "action 2", "action 3"],
  "learning_steps": ["step 1", "step 2", "step 3", "step 4"],
  "possible_projects": ["Project name: one sentence description", "Project name: one sentence description", "Project name: one sentence description"],
  "resume_improvements": ["improvement 1", "improvement 2"],
  "alternative_roles": ["Role A", "Role B"],
  "goal_pathway": {{"short_term": "0-6 months goal", "mid_term": "6-18 months goal", "long_term": "2-4 years goal"}},
  "evidence_items": [
    "[CV] CV line that shows a directly transferable skill or experience",
    "[Project] A project or portfolio item that demonstrates relevant work",
    "[Certificate] A certification or course that supports readiness"
  ]
}}

Rules:
- Return ONLY valid JSON. No markdown, no commentary.
- Be specific and personalised to this candidate's actual CV content.
- All list fields must have at least 2 items.
- Every evidence_items entry MUST start with exactly one of: [CV], [Project], or [Certificate].
  If the evidence doesn't fit project or certificate, use [CV].

TARGET ROLE: {role}

CANDIDATE CV:
{raw_text}
"""
```

- [ ] **Step 2: Update `role_analyzer.py` to pass context and update mock evidence items**

Replace `career-twin/backend/app/services/role_analyzer.py` entirely:

```python
import os
import json
import httpx
from app.models.profile import CVProfile
from app.models.analysis import AnalyzeRoleFitResponse
from app.prompts.analyze_role_fit import ANALYZE_ROLE_FIT_PROMPT
from app.services.retrieval import retrieve_projects, retrieve_trajectories

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def analyze_role_fit(profile: CVProfile, role: str) -> AnalyzeRoleFitResponse:
    """Run full role fit analysis. Uses mock if no API key."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
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
            "[CV] Python listed as primary skill — directly transferable to ML engineering",
            "[CV] Research Assistant role shows analytical thinking and experiment design",
            "[Project] Academic data analysis project demonstrates applied statistics",
        ],
    )
```

- [ ] **Step 3: Run all tests to confirm no regression**

```bash
cd career-twin/backend && .venv/bin/pytest -v
```

Expected: all tests PASS (19+ passing).

- [ ] **Step 4: Commit**

```bash
git add career-twin/backend/app/prompts/analyze_role_fit.py career-twin/backend/app/services/role_analyzer.py
git commit -m "feat: enrich analyze-role-fit prompt with RAG context; tag evidence items with [CV/Project/Certificate]"
```

---

### Self-Review Checklist

1. **Spec coverage:**
   - ✅ `retrieve_roles(profile)` — Task 1
   - ✅ `retrieve_projects(role)` — Task 1
   - ✅ `retrieve_trajectories(role)` — Task 1
   - ✅ RAG used to assist prompts — Tasks 2 and 3
   - ✅ Demo does NOT depend on RAG (all functions return "" on failure) — Task 1
   - ✅ JSONL files already exist in `knowledge_base/` — pre-existing

2. **Placeholder scan:** No TBD, no incomplete steps, all code provided.

3. **Type consistency:** All three retrieve functions return `str`. `context_block` in services is `str`. Prompt `{context}` placeholder accepts `str`. Consistent.
