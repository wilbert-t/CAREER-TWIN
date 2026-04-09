# Design: Role Score Differentiation

**Date:** 2026-04-09
**Status:** Approved

## Problem

The `/suggest-roles` endpoint returns 5 career roles each with a `preview_match_score`. When a candidate's background is similarly relevant across multiple roles, the LLM at `temperature=0.3` collapses scores — e.g. 4 of 5 roles all show 56. This makes the ranking feel meaningless.

## Goal

Each of the 5 suggested roles must have a visibly distinct score. Scores should feel tight (no wild 40-point gaps) but clearly distinct (min 5 points apart between adjacent roles).

## Approach: Hybrid — Prompt Bands + Post-processing Enforcement

### Change 1 — Prompt: Explicit Ranked Score Bands (`suggest_roles.py`)

Replace the vague instruction `"Scores must be realistic and differentiated (not all the same)"` with explicit bands per rank:

| Rank | Band | Meaning |
|------|------|---------|
| 1 (best fit) | 62–80 | strong fit |
| 2 | 52–68 | good fit |
| 3 | 42–58 | moderate fit |
| 4 | 32–48 | developing fit |
| 5 (stretch) | 20–38 | stretch goal |

Additional rule in prompt: adjacent scores must differ by ≥ 5 points.

Bands overlap slightly by design — the LLM picks within the band based on actual CV evidence. This keeps scores realistic rather than mechanical.

### Change 2 — Post-processing: Spread Enforcement (`role_suggester.py`)

After JSON parsing, run `_enforce_score_spread(roles)` before returning:

1. Sort roles by `preview_match_score` descending
2. Walk adjacent pairs — if gap < 5, push lower role down by `(5 - gap)` points
3. Clamp all scores to `[10, 100]`
4. Re-sort to restore descending order

Maximum nudge per role: 4 points. This is a safety net only — the prompt bands should do the heavy lifting.

## Files Changed

| File | Change |
|------|--------|
| `backend/app/prompts/suggest_roles.py` | Replace differentiation instruction with explicit rank bands + min-gap rule |
| `backend/app/services/role_suggester.py` | Add `_enforce_score_spread()` post-processing before return |

## No Frontend Changes

`RoleCard.tsx` already animates `preview_match_score` as-is. No changes needed.

## Success Criteria

- All 5 returned roles have distinct `preview_match_score` values
- Adjacent scores differ by ≥ 5 points
- Highest score ≤ 80, lowest score ≥ 10 for typical student CVs
- No change to role titles, descriptions, or skills tags
