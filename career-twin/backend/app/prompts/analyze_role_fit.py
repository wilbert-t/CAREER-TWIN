ANALYZE_ROLE_FIT_PROMPT = """\
You are a strict career assessor. Given the candidate's CV and their target role, produce an \
honest, calibrated career fit analysis. Do NOT inflate scores to encourage the candidate.

{context}
Return a single JSON object with EXACTLY these fields:

{{
  "selected_role": {{"title": "...", "id": "...", "description": "one sentence"}},
  "score_breakdown": {{
    "skills": <int 0-100>,
    "experience": <int 0-100>,
    "education": <int 0-100>
  }},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "readiness_summary": {{"level": "Ready|Nearly Ready|Developing", "summary": "2 sentence summary"}},
  "priority_improvements": [
    {{"area": "Skills|Experience|Education", "title": "concise improvement title (5-10 words)", "detail": "2-sentence explanation of why this gap matters for this specific role", "action": "one specific, concrete first action the candidate can take now"}},
    {{"area": "Skills|Experience|Education", "title": "...", "detail": "...", "action": "..."}}
  ],
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

STRICT SCORING CALIBRATION — you MUST follow these tables exactly:

Skills score (how many required skills does the candidate demonstrably have):
  85-100: Has 90%+ of required skills with clear evidence of proficiency
  70-84:  Has 70-89% of required skills
  55-69:  Has 50-69% of required skills — noticeable gaps
  40-54:  Has 30-49% of required skills — significant gaps
  <40:    Has fewer than 30% of required skills

Experience score (industry experience directly relevant to this role):
  85-100: 3+ years of directly relevant, paid industry experience
  70-84:  1-3 years relevant experience, or strong internship (6+ months)
  55-69:  Some internship or part-time relevant work (<6 months total)
  40-54:  Academic/personal projects only — zero paid industry experience
  <40:    No relevant experience of any kind

Education score (how well the candidate's education aligns with this role):
  85-100: Directly relevant degree from a strong institution, excellent results
  70-84:  Related degree with solid academic performance
  55-69:  Somewhat related degree, or relevant self-taught evidence
  40-54:  Unrelated degree, limited self-study evidence
  <40:    No relevant educational background at all

MANDATORY RULES:
- Be a strict, honest assessor. A score of 80+ means genuinely exceptional for this dimension.
- Candidate with academic projects only and no paid experience: experience MUST be ≤ 55.
- Candidate missing more than 40% of role-critical skills: skills MUST be ≤ 60.
- Do NOT award 80+ to be kind. Reserve high scores for candidates who truly earn them.
- Do NOT include match_score in your output — it is calculated separately.
- All list fields must have at least 2 items.
- Every item in possible_projects MUST use a specific project title before the colon. Never use generic placeholders like "Project", "Project Idea", or "Case Study" as the title.
- Every evidence_items entry MUST start with exactly one of: [CV], [Project], or [Certificate].
- Return ONLY valid JSON. No markdown, no commentary.

TARGET ROLE: {role}

CANDIDATE CV:
{raw_text}
"""
