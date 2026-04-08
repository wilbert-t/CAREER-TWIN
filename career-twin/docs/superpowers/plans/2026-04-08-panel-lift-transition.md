# Panel Lift Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the polygon star wipe with a clean panel-lift transition — the beige intro overlay fades its content out, then slides up off screen to reveal the upload page beneath.

**Architecture:** `CareerTwinIntro` gains two new phases: `exiting` (content fades out, 300ms) and `lifting` (full panel translates Y -100%, 500ms). `PolygonWipe` is deleted entirely. No clip-path, no RAF — only `translateY` and `opacity`, both GPU-accelerated.

**Tech Stack:** Next.js App Router, Framer Motion 12 (`motion.div`, `useMotionValue`, `animate`, `useTransform`)

---

## File Map

| Action | Path | Change |
|--------|------|--------|
| Modify | `career-twin/frontend/components/intro/CareerTwinIntro.tsx` | New phase sequence + panel lift animation |
| Delete | `career-twin/frontend/components/intro/PolygonWipe.tsx` | No longer used |

---

## Task 1: Delete PolygonWipe and remove its import

**Files:**
- Delete: `career-twin/frontend/components/intro/PolygonWipe.tsx`
- Modify: `career-twin/frontend/components/intro/CareerTwinIntro.tsx`

- [ ] **Step 1: Delete PolygonWipe**

```bash
rm career-twin/frontend/components/intro/PolygonWipe.tsx
```

- [ ] **Step 2: Remove PolygonWipe import from CareerTwinIntro.tsx**

Find and remove this line in `CareerTwinIntro.tsx`:
```tsx
import { PolygonWipe } from "./PolygonWipe";
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1; echo "exit:$?"
```

Expected: will fail because `PolygonWipe` is still referenced in JSX — that's fine, we fix it in Task 2.

- [ ] **Step 4: Commit**

```bash
git rm career-twin/frontend/components/intro/PolygonWipe.tsx
git add career-twin/frontend/components/intro/CareerTwinIntro.tsx
git commit -m "chore: remove PolygonWipe — replaced by panel lift transition"
```

---

## Task 2: Rewrite CareerTwinIntro with panel-lift sequence

**Files:**
- Modify: `career-twin/frontend/components/intro/CareerTwinIntro.tsx`

The phase sequence changes from `loading → holding → wiping → done` to `loading → holding → exiting → lifting → done`.

- `exiting`: content group animates to `opacity: 0, y: -8` over 300ms
- `lifting`: outer panel animates to `y: "-100%"` over 500ms ease-in-out
- Panel has a subtle bottom shadow so the "peel" is visible

- [ ] **Step 1: Replace entire CareerTwinIntro.tsx**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

/* ─── Tuneable constants ─────────────────────────────────────────────────── */
const COLORS = {
  introBg:   "#F5F2ED",
  titleText: "#1C2B3A",
  muteText:  "#8A9BAD",
  arcStroke: "#D9D4CC",
};

const TIMING = {
  loadingMs:    2800,
  holdMs:        400,
  contentExitMs: 300,
  liftMs:        500,
  exitDelayMs:   100,
};
/* ───────────────────────────────────────────────────────────────────────── */

type Phase = "loading" | "holding" | "exiting" | "lifting" | "done";

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

  const progress = useMotionValue(0);
  const barScale = useTransform(progress, [0, 100], [0, 1]);

  // Reduced motion: skip immediately
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { setPhase("done"); onComplete(); }
  }, [onComplete]);

  // Animate progress 0→100
  useEffect(() => {
    if (phase !== "loading") return;
    const controls = animate(progress, 100, {
      duration: TIMING.loadingMs / 1000,
      ease: [0.33, 1, 0.68, 1],
      onComplete: () => setPhase("holding"),
    });
    return () => controls.stop();
  }, [phase, progress]);

  // Sync integer counter
  useEffect(() => {
    return progress.on("change", (v) => {
      const int = Math.floor(v);
      setPercent((prev) => (prev === int ? prev : int));
    });
  }, [progress]);

  // Rotate status line
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_LINES.length), 900);
    return () => clearInterval(id);
  }, [phase]);

  // Hold → exiting
  useEffect(() => {
    if (phase !== "holding") return;
    const id = setTimeout(() => setPhase("exiting"), TIMING.holdMs);
    return () => clearTimeout(id);
  }, [phase]);

  // After content fades → lifting
  const handleContentExited = useCallback(() => {
    setPhase("lifting");
  }, []);

  // After panel lifts → done
  const handlePanelLifted = useCallback(() => {
    setTimeout(() => { setPhase("done"); onComplete(); }, TIMING.exitDelayMs);
  }, [onComplete]);

  if (phase === "done") return null;

  const isExiting = phase === "exiting";
  const isLifting = phase === "lifting";

  return (
    // Outer panel — this is what lifts off screen
    <motion.div
      className="fixed inset-0 z-40 overflow-hidden select-none"
      style={{
        backgroundColor: COLORS.introBg,
        // Subtle bottom shadow — makes the "peel" visible
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
      animate={isLifting ? { y: "-100%" } : { y: "0%" }}
      transition={
        isLifting
          ? { duration: TIMING.liftMs / 1000, ease: [0.76, 0, 0.24, 1] }
          : { duration: 0 }
      }
      onAnimationComplete={isLifting ? handlePanelLifted : undefined}
    >
      {/* Decorative arc */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="72%" cy="50%" r="42%" fill="none" stroke={COLORS.arcStroke} strokeWidth="1" opacity="0.7" />
        <circle cx="60%" cy="84%" r="3" fill={COLORS.arcStroke} opacity="0.8" />
      </svg>

      {/* Content group — fades and lifts slightly on exit */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        animate={isExiting || isLifting ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
        transition={{ duration: TIMING.contentExitMs / 1000, ease: "easeOut" }}
        onAnimationComplete={isExiting ? handleContentExited : undefined}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ color: COLORS.muteText }}
          className="text-xs font-mono tracking-widest tabular-nums"
        >
          {String(percent).padStart(3, "0")} %
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
          style={{ color: COLORS.titleText }}
          className="text-5xl font-bold tracking-tight leading-none"
        >
          Career Twin
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          style={{ color: COLORS.muteText }}
          className="text-sm tracking-wide"
        >
          Discover your strengths and map your career path
        </motion.p>

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
      </motion.div>

      {/* Micro-status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isExiting || isLifting ? { opacity: 0 } : { opacity: 0.35 }}
        transition={{ delay: isExiting ? 0 : 0.8, duration: 0.5 }}
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
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1; echo "exit:$?"
```

Expected: `exit:0` — no output before it

- [ ] **Step 3: Verify build**

```bash
cd career-twin/frontend && npm run build 2>&1 | tail -12
```

Expected: clean build, routes listed — `/ /_not-found /dashboard /review /roles`

- [ ] **Step 4: Commit**

```bash
git add career-twin/frontend/components/intro/CareerTwinIntro.tsx
git commit -m "feat: replace star wipe with panel-lift transition — content fades then panel slides up"
```

---

## Task 3: End-to-end verification

- [ ] **Step 1: Start dev server**

```bash
cd career-twin/frontend && npm run dev
```

Open http://localhost:3000

- [ ] **Step 2: Verify loading phase**

1. ✅ Beige intro screen appears immediately
2. ✅ "Career Twin" title fades in
3. ✅ Progress counter ticks up smoothly 000%→100%
4. ✅ Progress bar fills without jitter
5. ✅ Status line rotates every 900ms

- [ ] **Step 3: Verify transition**

1. ✅ At 100%, brief hold (~400ms)
2. ✅ Title + subtitle + bar fade out and shift up slightly (300ms)
3. ✅ Entire beige panel slides up off screen in one smooth motion (500ms)
4. ✅ Upload page revealed from bottom — no flash, no white frame, no jitter
5. ✅ Shadow visible on bottom edge of lifting panel (subtle depth cue)

- [ ] **Step 4: Verify reduced motion**

In macOS System Settings → Accessibility → Display → Reduce Motion: ON

Open http://localhost:3000 — upload page should appear immediately with no animation.

- [ ] **Step 5: Push**

```bash
git push origin main
```
