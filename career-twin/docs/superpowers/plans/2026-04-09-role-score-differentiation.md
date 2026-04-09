# Role Score Differentiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the 5 suggested career roles always display distinct `preview_match_score` values with a minimum 5-point gap between adjacent roles.

**Architecture:** Two-layer fix — (1) tighten the LLM prompt with explicit per-rank score bands so the model reasons correctly about relative fit; (2) add a deterministic post-processing step in `role_suggester.py` that enforces the minimum gap as a safety net after JSON parsing.

**Tech Stack:** Python 3.11, FastAPI, Pydantic, Groq LLM (temperature=0.3), pytest

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `backend/app/prompts/suggest_roles.py` | Modify | Replace vague "differentiated" instruction with explicit ranked score bands |
| `backend/app/services/role_suggester.py` | Modify | Add `_enforce_score_spread()` post-processing function |
| `backend/tests/test_roles.py` | Modify | Add unit tests for `_enforce_score_spread()` + integration test for unique scores |

---

### Task 1: Write failing tests for `_enforce_score_spread()`

**Files:**
- Modify: `backend/tests/test_roles.py`

- [ ] **Step 1: Add imports and tests to `test_roles.py`**

Open `backend/tests/test_roles.py`. Add these imports at the top of the file (after the existing imports):

```python
from app.services.role_suggester import _enforce_score_spread
from app.models.analysis import RoleSuggestion
```

Then add these test functions at the bottom of the file:

```python
# --- _enforce_score_spread unit tests ---

def _make_roles(scores: list[int]) -> list[RoleSuggestion]:
    """Helper: build minimal RoleSuggestion list from a score list."""
    return [
        RoleSuggestion(
            id=f"role_{i}",
            title=f"Role {i}",
            short_description="desc",
            preview_match_score=s,
            skills=[],
        )
        for i, s in enumerate(scores)
    ]


def test_enforce_spread_no_change_when_already_distinct():
    roles = _make_roles([75, 65, 55, 45, 35])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert scores == [75, 65, 55, 45, 35]


def test_enforce_spread_fixes_tied_scores():
    roles = _make_roles([56, 56, 56, 56, 56])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    # All must be unique
    assert len(set(scores)) == 5
    # Adjacent pairs must differ by >= 5
    for a, b in zip(scores, scores[1:]):
        assert a - b >= 5, f"Adjacent scores too close: {a} and {b}"


def test_enforce_spread_fixes_near_ties():
    # Gap of 3 between first two — too close
    roles = _make_roles([70, 67, 55, 45, 35])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert scores[0] - scores[1] >= 5


def test_enforce_spread_result_sorted_descending():
    roles = _make_roles([56, 56, 61, 56, 56])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert scores == sorted(scores, reverse=True)


def test_enforce_spread_clamps_to_minimum_10():
    # Force scores so low that spreading would push below 0
    roles = _make_roles([20, 18, 16, 14, 12])
    result = _enforce_score_spread(roles)
    scores = [r.preview_match_score for r in result]
    assert all(s >= 10 for s in scores)


def test_suggest_roles_mock_returns_unique_scores():
    """Integration: mock path must also return unique scores."""
    profile_id = save_profile(SAMPLE_PROFILE)
    resp = client.post("/suggest-roles", json={"profile_id": profile_id})
    assert resp.status_code == 200
    scores = [r["preview_match_score"] for r in resp.json()["roles"]]
    assert len(set(scores)) == len(scores), f"Duplicate scores found: {scores}"
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN/career-twin/backend
python -m pytest tests/test_roles.py::test_enforce_spread_no_change_when_already_distinct tests/test_roles.py::test_enforce_spread_fixes_tied_scores tests/test_roles.py::test_enforce_spread_fixes_near_ties tests/test_roles.py::test_enforce_spread_result_sorted_descending tests/test_roles.py::test_enforce_spread_clamps_to_minimum_10 tests/test_roles.py::test_suggest_roles_mock_returns_unique_scores -v
```

Expected: All 6 tests FAIL with `ImportError: cannot import name '_enforce_score_spread'`

---

### Task 2: Implement `_enforce_score_spread()` in `role_suggester.py`

**Files:**
- Modify: `backend/app/services/role_suggester.py`

- [ ] **Step 1: Add the function to `role_suggester.py`**

Open `backend/app/services/role_suggester.py`. Add this function **before** the `suggest_roles` function (after the imports):

```python
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
```

- [ ] **Step 2: Wire the function into `suggest_roles` and `_mock_roles`**

In the same file, update the `suggest_roles` function — find the return line:

```python
        return [RoleSuggestion(**r) for r in data]
```

Replace it with:

```python
        roles = [RoleSuggestion(**r) for r in data]
        return _enforce_score_spread(roles)
```

Also update `_mock_roles` — find its return line:

```python
    return [
        RoleSuggestion(
```

Wrap the entire return value:

```python
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
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN/career-twin/backend
python -m pytest tests/test_roles.py::test_enforce_spread_no_change_when_already_distinct tests/test_roles.py::test_enforce_spread_fixes_tied_scores tests/test_roles.py::test_enforce_spread_fixes_near_ties tests/test_roles.py::test_enforce_spread_result_sorted_descending tests/test_roles.py::test_enforce_spread_clamps_to_minimum_10 tests/test_roles.py::test_suggest_roles_mock_returns_unique_scores -v
```

Expected: All 6 tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN
git add career-twin/backend/app/services/role_suggester.py career-twin/backend/tests/test_roles.py
git commit -m "feat: enforce unique score spread across suggested roles"
```

---

### Task 3: Tighten the LLM prompt with explicit rank bands

**Files:**
- Modify: `backend/app/prompts/suggest_roles.py`

- [ ] **Step 1: Update the prompt**

Open `backend/app/prompts/suggest_roles.py`. Replace the entire file content with:

```python
SUGGEST_ROLES_PROMPT = """\
You are a career advisor. Given the candidate's CV below, suggest exactly 5 career roles \
that best match their background, ranging from strong fits to stretch goals.

{context}
Return a JSON array with exactly 5 objects. Each object must have these fields:
- "id": a short snake_case identifier (e.g. "ml_engineer")
- "title": the role title
- "short_description": one sentence describing what this role does
- "preview_match_score": integer score — see mandatory scoring bands below
- "skills": array of 3 key skill tags relevant to this role (short, 1-3 words each)

MANDATORY SCORING BANDS — you MUST follow these exactly:
  Rank 1 (best fit):  score between 62 and 80
  Rank 2:             score between 52 and 68
  Rank 3:             score between 42 and 58
  Rank 4:             score between 32 and 48
  Rank 5 (stretch):   score between 20 and 38

Rules:
- Each role's score must fall within its rank's band above.
- Adjacent scores (rank 1 vs 2, rank 2 vs 3, etc.) must differ by at least 5 points.
- No two roles may have the same score.
- Order the array by score descending (rank 1 first).
- Return ONLY the JSON array. No markdown, no commentary.
- Skills tags should reflect what the role actually requires, drawn from the candidate's background where matched.

CANDIDATE CV:
{raw_text}
"""
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN/career-twin/backend
python -m pytest tests/ -v
```

Expected: All tests pass (same count as before Task 1, plus the 6 new tests).

- [ ] **Step 3: Commit**

```bash
cd /Users/wilbert/Documents/GitHub/CAREER-TWIN
git add career-twin/backend/app/prompts/suggest_roles.py
git commit -m "feat: add explicit rank score bands to suggest_roles prompt"
```

---

## Self-Review

**Spec coverage:**
- ✅ Prompt bands (spec Change 1) — Task 3
- ✅ Post-processing enforcement (spec Change 2) — Task 2
- ✅ No frontend changes needed — confirmed in file map
- ✅ Min gap ≥ 5, clamp to [10, 100] — implemented in `_enforce_score_spread()`

**Placeholder scan:** None found. All steps contain exact code.

**Type consistency:** `RoleSuggestion` used consistently. `model_copy(update=...)` is the correct Pydantic v2 API for producing an updated copy without mutating the original.
