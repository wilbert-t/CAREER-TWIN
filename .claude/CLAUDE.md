# TITLE Parallel Futures - Session Start - do this first

1. Read `.claude-session-log.md` to know where we left off.
2. Read the last 30 lines of `.claude-lessons.md` to avoid repeat mistakes.
3. Confirm the environment is active and dependencies are installed.
4. Confirm required env vars exist before running anything.
5. Read `AGENTS.md` for ownership rules and current execution mode.

Update `.claude-session-log.md` during the session with:
- What was completed this session
- Current blockers or open questions
- Exact next step to resume; be specific with file, function, route, or component
- Any new lesson also log in `.claude-lessons.md`

Keep only the last 10 sessions in the log.

---

# TITLE Parallel Futures - Session End - do this before stopping

Before ending any session:
- Run the app or changed module and confirm no errors.
- Verify at least one happy path end-to-end for the feature worked on.
- Test one edge case such as empty CV text, malformed PDF, missing API key, invalid path selection, or empty retrieval result.
- Update `.claude-session-log.md` with completed work, blockers, and exact next step.
- If a mistake, surprise, or integration issue happened, append it to `.claude-lessons.md`.

---

# TITLE Parallel Futures - Project

Parallel Futures is an AI career project strategist for university students. A user uploads a PDF CV, the system analyzes their current state, recommends 3 future career paths, suggests portfolio projects tied to real-world pain points, generates a selected project breakdown, and produces a 30/90/180-day roadmap. The app should feel like a guided assistant, not just a CV analyzer. [file:1]

Core journey:
1. Upload CV PDF
2. Extract CV text
3. Analyze current state
4. Generate 3 future career paths
5. Generate 3-5 projects for a selected path
6. Generate project detail for a selected project
7. Generate 30/90/180-day roadmap
8. Refine projects through assistant chat [file:1]

---

# TITLE Parallel Futures - Tech Stack

## Frontend
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React dropzone style PDF upload UI
- Recharts only if truly needed; charts are optional and cut first [file:1]

## Backend
- FastAPI
- Pydantic
- httpx
- Uvicorn
- Python 3.11+

## PDF extraction
- PyMuPDF as primary extractor
- pdfplumber as fallback only if extraction quality fails [file:1]

## LLM + AI
- Groq API as primary model provider for speed
- Google Gemma API as fallback
- Simple API key rotation logic for rate limits [file:1]

## RAG layer
- ChromaDB local vector store
- Sentence Transformers for embeddings
- Knowledge base in JSON/JSONL only
- Keep RAG lean; do not overbuild retrieval or agents [file:1]

## Deployment
- Vercel for frontend
- Railway or Render for backend [file:1]

---

# TITLE Parallel Futures - Build Phases

1. Setup and app scaffolding
2. Core backend contracts and endpoints
3. PDF extraction and current-state analysis
4. Lean RAG foundation for roles, projects, and trajectories
5. Frontend shell and dashboard
6. Career path generation
7. Project recommendation system
8. Project detail and roadmap generation
9. Chat refinement
10. Final polish, testing, and deployment [file:1]

---

# TITLE Parallel Futures - Reference Files

Static details live in reference files. Load only when relevant.

- `.claude-reference-schema.md` — API contracts, response objects, route payloads
- `.claude-reference-rag.md` — RAG data shape, retrieval strategy, embedding rules, prompt context usage
- `.claude-reference-prompts.md` — prompt blocks and deterministic output rules
- `.claude-reference-ui.md` — page structure, card hierarchy, drawer behavior, MVP screen flow
- `AGENTS.md` — execution mode, ownership, no-conflict rules, handoff rules
- `STARTUP_PLAN_PARALLEL_FUTURES.md` — copy-paste execution plan

---

# TITLE Parallel Futures - Workflow Rules - Planning

- Write a 3-step task plan before coding.
- For each step include: action, expected output, blockers.
- If a step fails, stop and re-plan; do not randomly try fixes.
- Build from contracts first; UI and backend must share the same response shape.
- Prefer one active builder workflow. Do not simulate multiple agents unless explicitly asked.

---

# TITLE Parallel Futures - Workflow Rules - Verification before marking done

- Run the code and confirm no errors.
- Verify the changed route or component with real or mocked data.
- Spot-check outputs for structure and realism.
- Test one edge case.
- Paste evidence into session log; “it should work” is not done.

---

# TITLE Parallel Futures - Workflow Rules - Bug Fixing

- Read the full error and identify file, route, component, or function.
- Fix root cause, not symptoms.
- Verify after fixing.
- Log new lessons in `.claude-lessons.md`.
- Do not ask for information already available in logs, code, or reference files.

---

# TITLE Parallel Futures - Workflow Rules - Elegance

- Get it working first, then simplify.
- Refactor only if logic is repeated 3 times, nesting is too deep, or schema drift is happening.
- Do not refactor while debugging a broken core flow.
- Keep prompts deterministic and sectioned. Avoid one giant prompt doing everything. [file:1]

---

# TITLE Parallel Futures - Workflow Rules - Always

- Use `.env` for all secrets; never hardcode.
- Use mocked responses first when that speeds frontend progress.
- Keep the MVP focused on strong first impression, clear flow, polished cards, believable personalized outputs, and useful project ideas. [file:1]
- Do not overbuild agents.
- Do not overbuild the RAG. [file:1]
