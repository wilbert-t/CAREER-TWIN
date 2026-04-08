
# Transition Smoothness + Background Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix choppy animation in the intro transition and unify all page backgrounds to the beige `#F5F2ED` brand color.

**Architecture:** Two independent changes — (A) rewrite `PolygonWipe` and `CareerTwinIntro` to eliminate RAF+setState choppiness by using Framer Motion's `useMotionValue`/`animate()` imperative API; (B) set a single `--background` CSS variable in globals.css and remove per-page background overrides.

**Tech Stack:** Next.js 16, React 19, Framer Motion 12, Tailwind CSS

---

## File Map

| Action | Path | Change |
|--------|------|--------|
| Modify | `frontend/components/intro/PolygonWipe.tsx` | Remove `useAnimation`+`useEffect`, use direct props + `onAnimationComplete` |
| Modify | `frontend/components/intro/CareerTwinIntro.tsx` | Replace RAF+setState with `useMotionValue`+`animate()`, remove `AnimatePresence` |
| Modify | `frontend/app/globals.css` | Set `--background: #F5F2ED`, remove dark mode block |
| Modify | `frontend/app/page.tsx` | Remove gradient bg class |
| Modify | `frontend/app/review/page.tsx` | Replace inline gradient style with beige, fix loading overlay bg |
| Modify | `frontend/app/roles/page.tsx` | Replace bg-slate-50 and bg-white on outer wrappers |
| Modify | `frontend/app/dashboard/page.tsx` | Replace bg-white on outer wrapper |

---

## Task 1: Rewrite PolygonWipe — remove useAnimation gap

**Files:**
- Modify: `career-twin/frontend/components/intro/PolygonWipe.tsx`

The current implementation uses `useAnimation` + `useEffect` which creates a ~16ms gap between mount and animation start, causing a visible pop. Replace with direct `initial`/`animate` props and `onAnimationComplete`.

- [ ] **Step 1: Replace the entire file**

```tsx
"use client";

import { motion } from "framer-motion";

interface PolygonWipeProps {
  color?: string;    // fill color of the wipe shape
  duration?: number; // ms
  onComplete: () => void;
}

// 4-pointed elongated star (compass rose) clip-path values.
// STAR_TINY: all points collapsed to center — invisible at start.
// STAR_FULL: points extend well beyond viewport bounds — covers everything.
const STAR_TINY =
  "polygon(50% 50%, 51% 50%, 50% 50%, 50% 51%, 50% 50%, 49% 50%, 50% 50%, 50% 49%)";

const STAR_FULL =
  "polygon(50% -60%, 58% 45%, 160% 50%, 58% 55%, 50% 160%, 42% 55%, -60% 50%, 42% 45%)";

export function PolygonWipe({
  color = "#1E2D40",
  duration = 700,
  onComplete,
}: PolygonWipeProps) {
  return (
    <motion.div
      initial={{ clipPath: STAR_TINY }}
      animate={{ clipPath: STAR_FULL }}
      transition={{
        duration: duration / 1000,
        ease: [0.16, 1, 0.3, 1], // expo out — fast start, graceful finish
      }}
      onAnimationComplete={onComplete}
      style={{ backgroundColor: color }}
      className="fixed inset-0 z-50"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -10
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/components/intro/PolygonWipe.tsx
git commit -m "fix: remove useAnimation gap in PolygonWipe — use direct props + onAnimationComplete"
```

---

## Task 2: Rewrite CareerTwinIntro — eliminate RAF+setState choppiness

**Files:**
- Modify: `career-twin/frontend/components/intro/CareerTwinIntro.tsx`

The current RAF loop calls `setPercent()` ~60×/second causing full React re-renders every frame. The progress bar's `animate={{ scaleX: percent/100 }}` restarts a 100ms Framer animation every render — it never settles. Replace with `useMotionValue` + Framer's imperative `animate()`.

- [ ] **Step 1: Replace the entire file**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { PolygonWipe } from "./PolygonWipe";

/* ─── Tuneable constants ─────────────────────────────────────────────────── */
const COLORS = {
  introBg:   "#F5F2ED", // beige/off-white intro background
  titleText: "#1C2B3A", // charcoal blue — "Career Twin"
  muteText:  "#8A9BAD", // muted slate — subtitle + percentage
  arcStroke: "#D9D4CC", // very faint arc decoration
  wipeFill:  "#1E2D40", // muted navy — the polygon wipe
};

const TIMING = {
  loadingMs:      2800, // duration of 0→100% counter
  holdMs:          400, // pause at 100% before wipe starts
  wipeDurationMs:  700, // star expands to cover screen
  exitDelayMs:     100, // brief wait after wipe before unmount
};
/* ───────────────────────────────────────────────────────────────────────── */

type Phase = "loading" | "holding" | "wiping" | "done";

const STATUS_LINES = [
  "/ Initializing profile engine",
  "/ Loading career models",
  "/ System ready",
];

interface CareerTwinIntroProps {
  onComplete: () => void;
}

export function CareerTwinIntro({ onComplete }: CareerTwinIntroProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [percent, setPercent] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  // Motion value drives progress bar directly — zero React re-renders during animation
  const progress = useMotionValue(0);
  const barScale = useTransform(progress, [0, 100], [0, 1]);

  // Skip intro entirely for users who prefer reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPhase("done");
      onComplete();
    }
  }, [onComplete]);

  // Animate progress 0→100 using Framer's imperative animate() — no setState per frame
  useEffect(() => {
    if (phase !== "loading") return;
    const controls = animate(progress, 100, {
      duration: TIMING.loadingMs / 1000,
      ease: [0.33, 1, 0.68, 1], // ease-out cubic
      onComplete: () => setPhase("holding"),
    });
    return () => controls.stop();
  }, [phase, progress]);

  // Update integer counter text — fires only when integer value changes (max 100 updates)
  useEffect(() => {
    return progress.on("change", (v) => {
      const int = Math.floor(v);
      setPercent((prev) => (prev === int ? prev : int));
    });
  }, [progress]);

  // Rotate micro-status line every 900ms during loading
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(
      () => setStatusIdx((i) => (i + 1) % STATUS_LINES.length),
      900
    );
    return () => clearInterval(id);
  }, [phase]);

  // Hold at 100%, then trigger wipe
  useEffect(() => {
    if (phase !== "holding") return;
    const id = setTimeout(() => setPhase("wiping"), TIMING.holdMs);
    return () => clearTimeout(id);
  }, [phase]);

  const handleWipeComplete = useCallback(() => {
    setTimeout(() => {
      setPhase("done");
      onComplete();
    }, TIMING.exitDelayMs);
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <>
      {/* Full-screen intro overlay */}
      <div
        className="fixed inset-0 z-40 overflow-hidden select-none"
        style={{ backgroundColor: COLORS.introBg }}
      >
        {/* Subtle orbital arc — large SVG circle, right-skewed, very faint */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="72%"
            cy="50%"
            r="42%"
            fill="none"
            stroke={COLORS.arcStroke}
            strokeWidth="1"
            opacity="0.7"
          />
          {/* Small arc marker */}
          <circle
            cx="60%"
            cy="84%"
            r="3"
            fill={COLORS.arcStroke}
            opacity="0.8"
          />
        </svg>

        {/* ── Centered branding block ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {/* Loading % — small + muted, above the title */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ color: COLORS.muteText }}
            className="text-xs font-mono tracking-widest tabular-nums"
          >
            {String(percent).padStart(3, "0")} %
          </motion.p>

          {/* Main title — primary focal point */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
            style={{ color: COLORS.titleText }}
            className="text-5xl font-bold tracking-tight leading-none"
          >
            Career Twin
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            style={{ color: COLORS.muteText }}
            className="text-sm tracking-wide"
          >
            Discover your strengths and map your career path
          </motion.p>

          {/* Thin progress bar — driven by motionValue directly, no re-renders */}
          <div
            className="mt-4 w-40 h-px rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.arcStroke }}
          >
            <motion.div
              className="h-full"
              style={{
                backgroundColor: COLORS.muteText,
                transformOrigin: "left",
                scaleX: barScale,
              }}
            />
          </div>
        </div>

        {/* Micro-status — bottom-left, very faint editorial texture */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-8 left-8 font-mono text-[10px] leading-relaxed"
          style={{ color: COLORS.muteText }}
        >
          <motion.span
            key={statusIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {STATUS_LINES[statusIdx]}
          </motion.span>
        </motion.div>
      </div>

      {/* Polygon wipe — mounts when phase reaches "wiping" */}
      {phase === "wiping" && (
        <PolygonWipe
          color={COLORS.wipeFill}
          duration={TIMING.wipeDurationMs}
          onComplete={handleWipeComplete}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -10
```

Expected: no output

- [ ] **Step 3: Verify build**

```bash
cd career-twin/frontend && npm run build 2>&1 | tail -10
```

Expected: clean build, all routes listed

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/components/intro/CareerTwinIntro.tsx
git commit -m "fix: replace RAF+setState with useMotionValue+animate() for smooth progress animation"
```

---

## Task 3: Unify background color via globals.css

**Files:**
- Modify: `career-twin/frontend/app/globals.css`

Set a single source of truth for the beige background. Remove the dark mode block — the product is light-only.

- [ ] **Step 1: Update globals.css**

Replace the entire file with:

```css
@import "tailwindcss";

:root {
  --background: #F5F2ED;
  --foreground: #171717;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.6%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.6%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 9.0%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --primary: 0 0% 9.0%;
  --primary-foreground: 0 0% 98%;
  --ring: 0 0% 3.7%;
  --radius: 0.5rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--muted);
  --color-secondary-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

@layer components {
  .input {
    @apply w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add career-twin/frontend/app/globals.css
git commit -m "fix: set --background to beige #F5F2ED, remove dark mode override"
```

---

## Task 4: Remove per-page background overrides

**Files:**
- Modify: `career-twin/frontend/app/page.tsx`
- Modify: `career-twin/frontend/app/review/page.tsx`
- Modify: `career-twin/frontend/app/roles/page.tsx`
- Modify: `career-twin/frontend/app/dashboard/page.tsx`

Each page has a hardcoded background that overrides the CSS variable. Strip them so the body background shows through.

- [ ] **Step 1: Update upload page (page.tsx)**

Find:
```tsx
<main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-blue-50">
```

Replace with:
```tsx
<main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
```

- [ ] **Step 2: Update review page (review/page.tsx)**

Find the main tag with inline gradient style (lines 41–46):
```tsx
<main className="min-h-screen py-12 px-6" style={{
  background:
    "radial-gradient(ellipse at 85% 5%, rgba(253,220,218,0.45) 0%, transparent 45%), " +
    "radial-gradient(ellipse at 15% 95%, rgba(220,218,253,0.35) 0%, transparent 45%), " +
    "#f8f8fb",
}}>
```

Replace with:
```tsx
<main className="min-h-screen py-12 px-6">
```

Also find the loading overlay (line ~130):
```tsx
<main className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-6 z-50">
```

Replace with:
```tsx
<main className="fixed inset-0 flex flex-col items-center justify-center gap-6 z-50" style={{ backgroundColor: "#F5F2ED" }}>
```

- [ ] **Step 3: Update roles page (roles/page.tsx)**

Find the loading state main (line ~130):
```tsx
<main className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-6 z-50">
```

Replace with:
```tsx
<main className="fixed inset-0 flex flex-col items-center justify-center gap-6 z-50" style={{ backgroundColor: "#F5F2ED" }}>
```

Find the main content wrapper (line ~140):
```tsx
<main className="min-h-screen bg-slate-50 py-12 px-4">
```

Replace with:
```tsx
<main className="min-h-screen py-12 px-4">
```

- [ ] **Step 4: Update dashboard page (dashboard/page.tsx)**

Find (line ~140):
```tsx
<div className="flex h-screen overflow-hidden bg-white">
```

Replace with:
```tsx
<div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F5F2ED" }}>
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -10
```

Expected: no output

- [ ] **Step 6: Verify build**

```bash
cd career-twin/frontend && npm run build 2>&1 | tail -10
```

Expected: clean build

- [ ] **Step 7: Commit**

```bash
git add career-twin/frontend/app/page.tsx career-twin/frontend/app/review/page.tsx career-twin/frontend/app/roles/page.tsx career-twin/frontend/app/dashboard/page.tsx
git commit -m "fix: unify all page backgrounds to beige #F5F2ED"
```

---

## Task 5: End-to-end verification

- [ ] **Step 1: Start dev server**

```bash
cd career-twin/frontend && npm run dev
```

Open http://localhost:3000

- [ ] **Step 2: Verify intro animation**

1. ✅ Progress bar fills smoothly — no choppiness or jitter
2. ✅ Counter text ticks up cleanly (not fighting itself)
3. ✅ At 100%, brief hold, then star expands from center in one smooth motion — no pop or flash
4. ✅ Star covers full screen then upload page revealed

- [ ] **Step 3: Verify background consistency**

1. ✅ Upload page background: beige (matches intro)
2. ✅ Review page background: beige
3. ✅ Roles page background: beige (both loading and content states)
4. ✅ Dashboard background: beige
5. ✅ Cards, panels, and sidebars inside pages remain white/slate (unchanged)

- [ ] **Step 4: Push**

```bash
git push origin main
```
