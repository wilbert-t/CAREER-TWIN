# Career Twin – Demo Flow

## Setup (before demo)

1. Start backend: `cd career-twin/backend && .venv/bin/uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd career-twin/frontend && npm run dev`
3. Open browser: `http://localhost:3000`
4. Have the hero CV PDF ready (see Hero CV Selection section below).
5. Confirm `GROQ_API_KEY` is set in `career-twin/backend/.env` for live responses.
   - If key is missing, the app uses mock data — still fully functional for demo.

---

## Demo Script

### Step 1 – Upload CV (30 sec)
- Drag and drop the hero CV PDF onto the upload zone.
- Watch the cycling loading messages ("Extracting text…", "Structuring your profile…").
- Point out: any PDF, no account needed, works in seconds.

### Step 2 – Review & Edit (1 min)
- The review page shows the structured CV parsed by the AI.
- Edit one field (e.g., change job title or add a skill) to show it's fully editable.
- Click **Confirm & Continue**.

### Step 3 – Role Suggestions (45 sec)
- Three role cards appear with personalised match scores.
- Explain: "The AI read your CV and decided these are your best next paths."
- Select one role card (e.g., ML Engineer).
- Click **Open Dashboard** — watch the "Analysing your fit…" overlay.

### Step 4 – Dashboard Walkthrough (3–4 min)

**Score section:**
- Show the overall match score and the breakdown (skills / experience / education).

**Strengths & Weaknesses:**
- Read out 2 strengths and 1 weakness — show they're personalised to the CV.

**Skills Gap:**
- Point to matched skills vs missing skills.
- "This tells you exactly what to learn next."

**Readiness & Action Plan:**
- Show readiness level (Ready / Nearly Ready / Developing).
- Read the first priority improvement.

**Projects:**
- Show 2–3 suggested projects with their one-line descriptions.
- "These are real, portfolio-worthy projects tied to your chosen role."

**Resume Improvements:**
- Show the CV tips in the right panel.

**Career Pathway:**
- Show the 0–6 / 6–18 / 2–4 year goals.

### Step 5 – Utility Tools (1 min)
- Click **⇆ Compare** — show the comparison scores for the second role inline.
- Click a different role in the left sidebar — watch the dashboard re-analyse live.
- Use the **Evidence filter** chips (All / CV / Projects / Certificates) in the right panel.
- Click **↻ Regenerate** to return to role selection.

---

## Hero CV Selection

Test 3 CVs before demo day and pick the one with the most interesting output:

| CV Type | What to look for |
|---------|-----------------|
| Technical student (CS/Eng) | Clear skills gap in cloud/MLOps, strong project suggestions |
| Business student (MBA/Fin) | Product Manager or Strategy roles, soft skill strengths |
| Hybrid (Econ + coding) | Data Analyst or Product path, interesting alternative roles |

**Pick the CV that produces the most specific and believable role analysis.**

Save your chosen PDF as `career-twin/docs/demo-cv.pdf` (add to `.gitignore` — do not commit real CVs).

---

## Fallback: Mock Mode

If the API key is missing or Groq is down, the app automatically returns mock data.
The full flow works identically — mock data looks realistic for demo purposes.

To force mock mode: remove or empty `GROQ_API_KEY` in `career-twin/backend/.env`.

---

## Edge Cases to Avoid

- Very scanned/image-based PDFs (no extractable text → parse warning shown, LLM output will be generic).
- PDFs over 10 MB (blocked with a clean 422 error).
- Extremely short or sparse CVs — output will be less specific.
- Refreshing mid-flow (session storage is cleared on hard refresh — start from upload again).
