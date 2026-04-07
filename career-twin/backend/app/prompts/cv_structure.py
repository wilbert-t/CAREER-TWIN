STRUCTURE_CV_PROMPT = """\
You are a CV parser. Given the raw text of a CV below, extract and return a JSON object with exactly these fields:

{{
  "name": "Full name of candidate",
  "headline": "Job title or role they identify as",
  "summary": "2–3 sentence professional summary",
  "experience": [
    {{"title": "Job title", "company": "Company name", "duration": "Start–End", "description": "One sentence summary"}}
  ],
  "education": [
    {{"degree": "Degree name", "institution": "University/school", "year": "Graduation year"}}
  ],
  "skills": ["skill1", "skill2"],
  "projects": ["Project name: one sentence description"],
  "certificates": ["Certificate name"],
  "leadership": ["Role or activity: one sentence description"]
}}

Rules:
- Return ONLY valid JSON. No markdown, no commentary.
- If a field has no data, return an empty list [] or empty string "".
- Keep values concise.

CV TEXT:
{raw_text}
"""
