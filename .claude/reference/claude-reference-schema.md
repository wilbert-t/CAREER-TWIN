# Parallel Futures - Schema Reference

## Core response rule
Every LLM-facing backend route must return deterministic JSON that is parseable into Pydantic models. Avoid free-form mixed prose.

---

## 1. Analyze Profile

### Route
`POST /analyze-profile`

### Input
```json
{
  "cv_text": "string"
}
```

### Output
```json
{
  "current_role_guess": "string",
  "skills": ["string"],
  "experience_signals": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "standout_traits": ["string"],
  "improvement_areas": ["string"],
  "likely_fit_domains": ["string"]
}
```

---

## 2. Generate Paths

### Route
`POST /generate-paths`

### Input
```json
{
  "profile": {},
  "retrieved_roles": []
}
```

### Output
```json
{
  "paths": [
    {
      "id": "string",
      "role": "string",
      "description": "string",
      "why_it_fits": ["string"],
      "trajectory": ["string"],
      "required_skills": ["string"],
      "skill_gaps": ["string"]
    }
  ]
}
```

---

## 3. Generate Projects

### Route
`POST /generate-projects`

### Input
```json
{
  "selected_path": {},
  "profile": {},
  "retrieved_projects": []
}
```

### Output
```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "pain_point": "string",
      "tech_stack": ["string"],
      "build_phases": ["string"],
      "estimated_duration": "string",
      "impact": "string",
      "uniqueness": "string",
      "relevance": "string",
      "difficulty": "string"
    }
  ]
}
```

---

## 4. Project Detail

### Route
`POST /project-detail`

### Input
```json
{
  "selected_project": {},
  "selected_path": {},
  "profile": {}
}
```

### Output
```json
{
  "project_summary": "string",
  "problem_solved": "string",
  "target_users": ["string"],
  "tech_stack": ["string"],
  "build_phases": ["string"],
  "estimated_duration": "string",
  "impact_on_portfolio": "string",
  "uniqueness_rationale": "string",
  "career_relevance": "string"
}
```

---

## 5. Roadmap

### Route
`POST /generate-roadmap`

### Input
```json
{
  "selected_project": {},
  "selected_path": {},
  "profile": {}
}
```

### Output
```json
{
  "day_30": {
    "focus": "string",
    "deliverable": "string"
  },
  "day_90": {
    "focus": "string",
    "deliverable": "string"
  },
  "day_180": {
    "focus": "string",
    "deliverable": "string"
  }
}
```

---

## 6. Chat Refinement

### Route
`POST /chat-projects`

### Input
```json
{
  "selected_path": {},
  "profile": {},
  "user_request": "make it more unique"
}
```

### Output
```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "pain_point": "string",
      "tech_stack": ["string"],
      "build_phases": ["string"],
      "estimated_duration": "string",
      "impact": "string",
      "uniqueness": "string",
      "relevance": "string",
      "difficulty": "string"
    }
  ],
  "refinement_mode": "string"
}
```

---

## Frontend contract note
Use these objects directly in cards, drawers, and roadmap panels. Do not invent alternative keys in the frontend.
