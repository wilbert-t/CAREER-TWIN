SUGGEST_ROLES_PROMPT = """\
You are a career advisor. Given the candidate's CV below, suggest exactly 5 career roles \
that best match their background, ranging from strong fits to stretch goals.

{context}
Return a JSON array with exactly 5 objects. Each object must have these fields:
- "id": a short snake_case identifier (e.g. "ml_engineer")
- "title": the role title
- "short_description": one sentence describing what this role does
- "preview_match_score": integer from 0 to 100 estimating how well the candidate matches
- "skills": array of 3 key skill tags relevant to this role (short, 1-3 words each)

Rules:
- Return ONLY the JSON array. No markdown, no commentary.
- Scores must be realistic and differentiated (not all the same).
- Order by score descending.
- Skills tags should reflect what the role actually requires, drawn from the candidate's background where matched.

CANDIDATE CV:
{raw_text}
"""
