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
