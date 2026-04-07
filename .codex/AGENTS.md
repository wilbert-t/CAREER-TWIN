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

Codex should not:
- Rewrite the product architecture mid-build
- Change prompt schemas without approval
- Touch the same files Claude is actively editing
- Expand scope beyond the MVP

---

## No-conflict rules

1. One active owner per file.
2. Shared contracts must be updated first before dependent code changes.
3. Frontend must consume stable mocked or real payloads from the schema reference.
4. Backend cannot silently rename keys after frontend implementation starts.
5. RAG context shape must stay stable once prompt integration begins.
6. Every session must update `.claude-session-log.md` and `.claude-lessons.md`.

---

## Session handoff format

When pausing, log:
- Completed
- In progress
- Blocker
- Exact next file
- Exact next route or component
- Required verification still pending

---

## MVP ownership map

### Claude Code owns
- Frontend app shell
- Backend endpoint implementation
- Prompt blocks
- Integration wiring
- Demo flow
- Deploy readiness

### Codex owns when invited late-stage
- Review comments
- Bug list
- Test ideas
- Cleanup suggestions
- Edge case checklist

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
