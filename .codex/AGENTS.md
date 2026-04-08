# Parallel Futures - AGENTS

## Execution mode

Primary mode for this project:
- Claude Code is the main builder.
- Codex is optional and should be used near the end for review, bug catching, cleanup suggestions, and small isolated tasks.
- Do not run multiple AI builders on the same files at the same time unless the user explicitly switches to multi-agent mode.

This project is a 2-day hackathon-style MVP. Speed, coherence, and polish matter more than parallelism. [file:1]

---

## Current recommendation

Use a single-builder workflow:
- Builder: Claude Code
- Reviewer: Codex at the end
- No parallel file ownership during the initial MVP build

Reason:
- The product already has enough moving parts: PDF extraction, profile analysis, 3 path generation, project recommendations, project detail, roadmap generation, and chat refinement. A multi-tool setup increases coordination overhead and schema conflicts. [file:1]

---

## If reviewer mode is used

Codex may be used for:
- Final code review
- Test suggestions
- Refactor suggestions after the app works
- Contract mismatch detection
- Bug triage for isolated issues
- Frontend polish after the core flow is stable
- UI cleanup, spacing, hierarchy, and animation refinement
- Landing page and loading transition improvements

Codex should not:
- Rewrite the product architecture mid-build
- Change prompt schemas without approval
- Touch the same files Claude is actively editing
- Expand scope beyond the MVP
- Redesign the product flow unless explicitly requested

---

## Codex skill usage

If Codex is used for frontend work, load and follow this skill:

- `.codex/skills/frontend-design/SKILL.md`

Use this skill for:
- landing page polish
- dashboard cleanup
- loading animation refinement
- smoother transitions
- spacing and typography improvements
- color consistency and visual hierarchy
- presentation-ready UI improvements for demo day

When using the frontend-design skill, Codex should:
- preserve the existing app structure where possible
- avoid rebuilding working pages from scratch
- prioritize polish over unnecessary complexity
- make the UI feel modern, coherent, and trustworthy
- keep changes realistic for a 2-day hackathon MVP
- prefer high-impact visual improvements with low implementation risk

For this project’s frontend direction:
- overall feel should be polished, modern, and demo-ready
- career-tech tone should feel trustworthy and guided, not overly playful
- UI should avoid generic AI-dashboard styling
- loading and transition work should feel smooth and connected to the landing page
- visual decisions should support presentation quality and first impression

---

## No-conflict rules

1. One active owner per file.
2. Shared contracts must be updated first before dependent code changes.
3. Frontend must consume stable mocked or real payloads from the schema reference.
4. Backend cannot silently rename keys after frontend implementation starts.
5. RAG context shape must stay stable once prompt integration begins.
6. Every session must update `.claude-session-log.md` and `.claude-lessons.md`.
7. If Codex is invited for frontend polish, it should work only after the relevant page is functionally stable.
8. Codex frontend refinement should not break existing routes, payload bindings, or upload/analysis flow.

---

## Session handoff format

When pausing, log:
- Completed
- In progress
- Blocker
- Exact next file
- Exact next route or component
- Required verification still pending

If Codex worked on frontend polish, also log:
- exact component or page refined
- whether changes were visual-only or structural
- any animation or styling dependencies added
- anything Claude should avoid overwriting

---

## MVP ownership map

### Claude Code owns
- Frontend app shell
- Backend endpoint implementation
- Prompt blocks
- Integration wiring
- Demo flow
- Deploy readiness
- Core UX flow and page structure

### Codex owns when invited late-stage
- Review comments
- Bug list
- Test ideas
- Cleanup suggestions
- Edge case checklist
- Frontend polish with the frontend-design skill
- Transition smoothness improvements
- Visual consistency pass before demo

---

## Hard scope boundaries

Must-have only:
- PDF upload
- Current state analysis
- 3 future paths
- 3 projects minimum per path
- One project detail view
- 30/90/180-day roadmap
- Polished UI [file:1]

Cut first if time is short:
- Export
- Charts
- Multi-language
- Too many role categories
- Excessive chat complexity [file:1]

---

## Frontend polish priority order

If there is limited time, frontend polish should be done in this order:
1. clarity of user flow
2. landing page first impression
3. upload and analysis experience
4. spacing and typography consistency
5. loading transition smoothness
6. dashboard/detail page cleanup
7. minor micro-interactions

Do not spend time on decorative redesign before the main flow is working.

---

## Final principle

For this project, working product quality comes first, and visual polish comes second.
But once the MVP works, polish should focus on making the app feel:
- smooth
- coherent
- trustworthy
- presentation-ready
- impressive in a hackathon demo without increasing technical risk