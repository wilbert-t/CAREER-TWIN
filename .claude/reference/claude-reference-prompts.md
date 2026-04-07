# Parallel Futures - Prompt Reference

## Global prompt rules
- Keep prompts deterministic and sectioned. [file:1]
- Avoid one giant prompt doing everything. [file:1]
- Always request structured JSON output.
- Keep wording stable once the frontend is wired.
- Use retrieval context only when relevant.

---

## 1. Profile Analyzer Prompt

### Objective
Given extracted CV text, return current state summary.

### Output sections
- current_role_guess
- skills
- experience_signals
- strengths
- weaknesses
- standout_traits
- improvement_areas
- likely_fit_domains

### Rules
- Be specific but not overconfident.
- Prefer concise bullet-like strings in arrays.
- If CV is weak, still provide constructive strengths and realistic improvement areas.

---

## 2. Career Path Prompt

### Objective
Given analyzed profile and retrieved role knowledge, return exactly 3 paths.

### Output sections
- role
- description
- why_it_fits
- trajectory
- required_skills
- skill_gaps

### Rules
- Paths must be distinct.
- Blend ambition with realism.
- Include both fit and gap awareness.

---

## 3. Project Recommender Prompt

### Objective
Given selected path, user profile, and project examples from RAG, return 3-5 project ideas tied to real-life pain points. [file:1]

### Output sections
- title
- description
- pain_point
- tech_stack
- build_phases
- estimated_duration
- impact
- uniqueness
- relevance
- difficulty

### Rules
- Avoid generic CRUD-only ideas.
- Tie each idea to a real user or business pain point.
- Make projects believable for a student to build.

---

## 4. Project Detail Prompt

### Objective
Expand one selected project into a clear portfolio-ready build plan.

### Output sections
- project_summary
- problem_solved
- target_users
- tech_stack
- build_phases
- estimated_duration
- impact_on_portfolio
- uniqueness_rationale
- career_relevance

---

## 5. Roadmap Prompt

### Objective
Create a 30/90/180-day learning and building trajectory after project selection. [file:1]

### Output sections
- day_30 focus + deliverable
- day_90 focus + deliverable
- day_180 focus + deliverable

### Rules
- Day 30 = learning + mini deliverable
- Day 90 = milestone + stronger proof
- Day 180 = portfolio-ready / internship-ready state [file:1]

---

## 6. Chat Refinement Prompt

### Objective
Refine or regenerate project ideas based on user request.

### Supported request styles
- more unique
- easier
- more technical
- more business-focused
- startup-style
- real-life pain point version [file:1]

### Rules
- Keep the selected path as anchor.
- Preserve realism.
- Return structured projects, not loose brainstorming.
