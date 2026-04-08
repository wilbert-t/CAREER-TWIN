# Transition Smoothness + Background Unification — Design Spec
**Date:** 2026-04-08  
**Status:** Approved

---

## Problem Summary

The intro transition has four bugs causing visible choppiness:

1. **RAF + setState every frame** — `requestAnimationFrame` calls `setPercent()` ~60×/second. Every call triggers a full React re-render. Each re-render restarts Framer Motion's `animate={{ scaleX: percent/100 }}` with a 100ms duration — the progress bar chases itself and never settles.
2. **PolygonWipe 1-frame pop** — `useAnimation` + `useEffect` creates a ~16ms gap between mount and `controls.start()`. The collapsed star shape flashes briefly before expanding.
3. **AnimatePresence misuse** — children have no `key` props and no `exit` animations, so Framer Motion cannot orchestrate them correctly.
4. **Background inconsistency** — upload page uses `bg-gradient-to-br from-slate-50 to-blue-50`, review uses `bg-white`/`bg-slate-50`, dashboard uses `bg-white`. All differ from the beige intro, making the post-transition reveal feel visually jarring.

---

## Part A: Animation Fixes

### `PolygonWipe.tsx` — rewrite

**Remove:** `useAnimation`, `useEffect`, `controls.start()`  
**Replace with:** direct `initial`/`animate` props + `onAnimationComplete` callback

```tsx
<motion.div
  initial={{ clipPath: STAR_TINY }}
  animate={{ clipPath: STAR_FULL }}
  transition={{ duration: wipeDuration / 1000, ease: [0.16, 1, 0.3, 1] }}
  onAnimationComplete={onComplete}
  style={{ backgroundColor: color }}
  className="fixed inset-0 z-50"
  aria-hidden="true"
/>
```

This fires the animation on the same frame as mount — no gap, no pop.

### `CareerTwinIntro.tsx` — rewrite loading section

**Remove:** `requestAnimationFrame` loop, `useState(percent)`, `setState` on every frame, `animate={{ scaleX: percent/100 }}` driven by state  
**Replace with:** Framer Motion `useMotionValue` + `animate()` (imperative)

```ts
const progress = useMotionValue(0); // 0–100, never touches React state
const barScale  = useTransform(progress, [0, 100], [0, 1]);

useEffect(() => {
  if (phase !== "loading") return;
  const controls = animate(progress, 100, {
    duration: TIMING.loadingMs / 1000,
    ease: [0.33, 1, 0.68, 1], // ease-out cubic
    onComplete: () => setPhase("holding"),
  });
  return () => controls.stop();
}, [phase, progress]);
```

Progress bar uses `scaleX={barScale}` — zero React re-renders during the animation.

Counter text: subscribe to the motion value and only update integer state when the floored value changes:
```ts
useEffect(() => {
  return progress.on("change", v => {
    const int = Math.floor(v);
    setPercent(prev => prev === int ? prev : int);
  });
}, [progress]);
```
This caps state updates to at most 100 total (one per integer step) instead of ~168 per-frame.

**Remove `AnimatePresence`** from the outer wrapper — it isn't needed since neither the intro div nor the PolygonWipe uses exit animations. Replace with direct conditional rendering.

---

## Part B: Background Unification

**Single source of truth:** `globals.css` sets the site-wide background to beige.

```css
:root {
  --background: #F5F2ED;
}
/* Remove the dark mode override block entirely — product is light-only */
```

Per-page changes:
- `app/page.tsx` — remove `bg-gradient-to-br from-slate-50 to-blue-50` → `bg-[#F5F2ED]` (or just let body bg show through)
- `app/review/page.tsx` — change `bg-slate-50` and `bg-white` (main containers) → `bg-[#F5F2ED]`
- `app/roles/page.tsx` — add `bg-[#F5F2ED]` to main wrapper
- `app/dashboard/page.tsx` — change `bg-white` wrapper → `bg-[#F5F2ED]`

Card/panel surfaces (`bg-white`, `bg-slate-50`) inside those pages remain unchanged — only the outermost page background changes to beige.

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/components/intro/PolygonWipe.tsx` | Rewrite: remove useAnimation/useEffect, use direct props + onAnimationComplete |
| `frontend/components/intro/CareerTwinIntro.tsx` | Rewrite: useMotionValue + animate(), remove AnimatePresence, fix counter |
| `frontend/app/globals.css` | Set `--background: #F5F2ED`, remove dark mode block |
| `frontend/app/page.tsx` | Remove gradient bg class |
| `frontend/app/review/page.tsx` | Unify bg to beige on outer containers |
| `frontend/app/roles/page.tsx` | Add beige bg to main wrapper |
| `frontend/app/dashboard/page.tsx` | Change bg-white wrapper to beige |

---

## What Does NOT Change

- All card surfaces (`bg-white`, `bg-slate-50`) inside pages — unchanged
- All text colors, borders, component styles — unchanged
- The `COLORS` and `TIMING` constants in `CareerTwinIntro.tsx` — unchanged
- The star polygon shape — unchanged
- Animation timings — unchanged
- The upload page content and layout — unchanged
