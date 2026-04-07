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
