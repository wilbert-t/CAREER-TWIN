STRUCTURE_CV_PROMPT = """\
You are a CV parser. Given the raw text of a CV below, extract and return a JSON object with exactly these fields:

{{
  "name": "Full name of candidate",
  "headline": "Job title or role they identify as",
  "summary": "2–3 sentence professional summary",
  "experience": [
    {{"title": "Job title", "company": "Company name", "duration": "Start–End", "description": "Full description preserving all bullet points, achievements, and metrics"}}
  ],
  "education": [
    {{"degree": "Degree name", "institution": "University/school", "year": "Graduation year"}}
  ],
  "skills": ["skill1", "skill2"],
  "projects": ["Project name: full description preserving all details and outcomes"],
  "certificates": ["Certificate name"],
  "leadership": ["Role or activity: full description preserving all details"]
}}

Rules:
- Return ONLY valid JSON. No markdown, no commentary.
- If a field has no data, return an empty list [] or empty string "".
- Preserve all detail in descriptions — do not summarise or truncate.

CV TEXT:
{raw_text}
"""
