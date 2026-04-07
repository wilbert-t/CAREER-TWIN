# TITLE Parallel Futures - 2-Day Sprint Plan - Claude Code Build Mode

Project setup: Next.js frontend, FastAPI backend, Groq primary LLM, Gemma fallback, PyMuPDF extraction, ChromaDB + Sentence Transformers lean RAG. Product goal: polished guided dashboard for CV analysis, future path recommendations, project ideas, project deep dive, chat refinement, and 30/90/180-day roadmap. [file:1]

Timeline: hard focus on a 2-day hackathon MVP. Do not overbuild agents or RAG. Optimize for clear demo flow, believable outputs, and polished UI. [file:1]

---

# TITLE Parallel Futures - Working Mode

Claude Code is the main builder.
Codex is optional at the end for review only.

Daily supervision ritual:
- Start by reading `.claude-session-log.md`
- Read last lessons from `.claude-lessons.md`
- Write a 3-step plan
- Build one phase at a time
- Verify before marking done [file:2]

---

# TITLE Parallel Futures - Must-Have by Demo End

- PDF upload working [file:1]
- CV text extraction working [file:1]
- Current state analysis shown [file:1]
- 3 career paths shown [file:1]
- At least 3 projects for one path [file:1]
- One project detail view [file:1]
- 30/90/180-day roadmap section [file:1]
- Polished dashboard UI [file:1]

Cut first if time is short:
- Charts [file:1]
- Export [file:1]
- Multi-language [file:1]
- Too many role categories [file:1]
- Heavy chat complexity [file:1]

---

# TITLE Parallel Futures - Repo Structure

```text
parallel-futures/
  frontend/
    app/
    components/
    lib/
    hooks/
  backend/
    app/
      api/
      services/
      models/
      prompts/
      rag/
      utils/
  knowledge_base/
    roles_tech.jsonl
    roles_business.jsonl
    skills_map.jsonl
    project_ideas.jsonl
    career_trajectories.jsonl
  docs/
  .claude-session-log.md
  .claude-lessons.md
  CLAUDE.md
  AGENTS.md
```

---

# TITLE Parallel Futures - DAY 1 BUILD THE ENGINE

## Week Goal
Get end-to-end MVP skeleton working: upload -> extract -> analyze -> generate 3 paths -> display dashboard. [file:1]

---

## DAY 1 - Phase 1 Setup 1.5 hours

### Claude Code Task Initialize Project Structure

Run in terminal:
```bash
mkdir -p parallel-futures/{frontend,backend,knowledge_base,docs}
mkdir -p parallel-futures/frontend/{app,components,lib,hooks}
mkdir -p parallel-futures/backend/app/{api,services,models,prompts,rag,utils}
cd parallel-futures
```

### Claude Code Task Frontend Bootstrap
- Create Next.js app in `frontend`
- Install Tailwind CSS
- Install shadcn/ui
- Install Framer Motion

### Claude Code Task Backend Bootstrap
- Create FastAPI app in `backend`
- Install FastAPI, uvicorn, pydantic, httpx, pymupdf, pdfplumber, chromadb, sentence-transformers, python-dotenv

### Claude Code Task Create Env Template
Add:
```env
GROQ_API_KEY=
GEMMA_API_KEY=
NEXT_PUBLIC_API_BASE_URL=
PYTHON_ENV=development
```

### Verify
- Frontend runs locally
- Backend health route runs locally
- `.env` template exists
- Base folders created

---

## DAY 1 - Phase 2 Core Backend 3 hours

### Claude Code Task Define Schemas
Create models for:
- profile analysis response
- path response
- project response
- project detail response
- roadmap response
- chat refinement response

### Claude Code Task Create API Routes
Implement:
- `POST /upload-cv`
- `POST /analyze-profile`
- `POST /generate-paths`
- `POST /generate-projects`
- `POST /project-detail`
- `POST /generate-roadmap`
- `POST /chat-projects` [file:1]

### Claude Code Task Add Health Route
- `GET /health`

### Verify
- OpenAPI docs show routes
- Request bodies validate
- Mock JSON returns correct shapes
- Bad payload returns validation error

---

## DAY 1 - Phase 3 RAG Foundation 2.5 hours

### Claude Code Task Create Knowledge Base
Add lean JSONL datasets for:
- business roles
- tech roles
- skill maps
- project ideas
- career trajectories [file:1]

### Claude Code Task Build Retrieval Layer
- Create embedding loader with Sentence Transformers
- Store vectors in ChromaDB
- Add helper functions:
  - retrieve_roles(profile)
  - retrieve_projects(path)
  - retrieve_trajectories(path)

### Rule
Do not overbuild RAG. Keep it small, fast, and demo-friendly. [file:1]

### Verify
- Retrieval returns relevant records for one sample student profile
- Empty retrieval handled gracefully

---

## DAY 1 - Phase 4 Frontend Shell 3 hours

### Claude Code Task Build Landing Page
- Product title
- Tagline
- Upload CV CTA [file:1]

### Claude Code Task Build Loading State
- Animated status messages:
  - reading your profile
  - mapping future paths [file:1]

### Claude Code Task Build Dashboard Layout
- Current state card
- 3 path cards
- Right-side or bottom detail panel [file:1]

### Verify
- Upload flow reaches loading state
- Mock results render in UI
- Dashboard layout works on desktop and mobile

---

# TITLE Parallel Futures - DAY 2 POLISH THE DEMO

## Day Goal
Complete projects, project detail, roadmap, chat refinement, integration, and demo polish. [file:1]

---

## DAY 2 - Phase 5 Project System 3 hours

### Claude Code Task Generate Projects
Return 3-5 projects for selected path with:
- description
- tech stack
- build phases
- estimated duration
- impact
- uniqueness
- relevance [file:1]

### Claude Code Task Project Detail View
Return:
- summary
- problem solved
- target users
- stack
- phases
- duration
- portfolio impact
- uniqueness rationale
- career relevance [file:1]

### Claude Code Task Chat Refinement
Support:
- more unique
- easier
- more technical
- more business-focused
- startup-style
- real-life pain point versions [file:1]

### Verify
- Selected path generates projects
- Selected project opens detail view
- Chat refinement changes project suggestions in a controlled way

---

## DAY 2 - Phase 6 Roadmap and Polish 2.5 hours

### Claude Code Task Roadmap Generator
Create 30 / 90 / 180-day roadmap section:
- 30 days = learn + mini deliverable
- 90 days = milestone + stronger proof
- 180 days = portfolio-ready / internship-ready state [file:1]

### Claude Code Task UI Polish
- Improve spacing
- Improve hierarchy
- Add transitions
- Improve empty and error states

### Verify
- Roadmap appears after project selection
- Dashboard feels like one coherent guided experience

---

## DAY 2 - Phase 7 Final Demo Prep 2.5 hours

### Claude Code Task Full Integration
- Connect frontend and backend fully
- Replace mocks where ready
- Add fallback handling for bad uploads and API failures

### Claude Code Task Test 3 Sample Profiles
- technical student
- business student
- hybrid student [file:1]

### Claude Code Task Deployment if time permits
- Deploy frontend to Vercel
- Deploy backend to Railway or Render [file:1]

### Claude Code Task Demo Flow
Prepare demo path:
1. Upload CV
2. Show current state
3. Show 3 futures
4. Pick one path
5. Show projects
6. Pick one project
7. Show roadmap
8. Refine via chat

### Verify
- One clean end-to-end demo works without manual patching
- At least one backup mock path exists in case live APIs fail

---

# TITLE Parallel Futures - Prompt Blocks

Keep prompts separated:
- Profile Analyzer Prompt [file:1]
- Career Path Prompt [file:1]
- Project Recommender Prompt [file:1]
- Project Detail Prompt [file:1]
- Roadmap Prompt [file:1]
- Chat Refinement Prompt [file:1]

Important rule:
- Keep prompts deterministic and sectioned.
- Avoid one giant prompt doing everything. [file:1]

---

# TITLE Parallel Futures - Validation Rules

Before marking any phase done:
- Run code, confirm no errors [file:2]
- Spot-check output structure [file:2]
- Test one edge case [file:2]
- Update `.claude-session-log.md` [file:2]
- Add any lesson to `.claude-lessons.md` [file:2]

---

# TITLE Parallel Futures - Final Recommendation

Build this app as a guided assistant experience with one beautiful main dashboard. Focus on strong first impression, clear flow, polished cards, believable personalized outputs, and practical project recommendations that students can actually build. Do not overbuild agents. Do not overbuild the RAG. That is the best path to winning in 2 days. [file:1]
