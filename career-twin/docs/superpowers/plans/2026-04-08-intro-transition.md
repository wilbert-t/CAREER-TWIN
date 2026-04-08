# Career Twin Intro Transition — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen branded intro/loading sequence with a 4-pointed star wipe transition before revealing the existing CV upload page.

**Architecture:** A `CareerTwinIntro` component renders over the existing `page.tsx` upload page. It runs a 4-phase state machine (loading → holding → wiping → done), then unmounts. The upload page sits beneath it the entire time and becomes interactive immediately on unmount. All animation via Framer Motion.

**Tech Stack:** Next.js 16, React 19, Framer Motion (new install), Tailwind CSS

---

## Reference Image Interpretation

| Image | What we take from it |
|---|---|
| 8 (95%) | Large single orbital arc right-side, loading % visible, left status block |
| 9 (100%) | Arc completes, hold moment |
| 10 | Light-colored polygon erupts from center — signals wipe start |
| 11 | **Key shape**: 4-pointed elongated diamond-cross (compass rose) in muted navy, expanding over beige background |
| 12 | Original reveal scene — **DO NOT USE** |
| 13 | Our reveal: existing upload page, untouched |

**Adapted for our palette:**
- Reference dark background → beige/off-white (`#F5F2ED`)
- Reference huge % dominant → small understated % below the title
- Reference terminal box → tiny monospace micro-status, very muted
- Reference navy wipe polygon → muted navy (`#1E2D40`) 4-pointed star

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Install | `framer-motion` | Animation library |
| Create | `frontend/components/intro/CareerTwinIntro.tsx` | Full intro orchestrator (state machine + layout) |
| Create | `frontend/components/intro/PolygonWipe.tsx` | 4-pointed star clip-path wipe overlay |
| Modify | `frontend/app/page.tsx` | Conditionally render intro over upload page |

---

## Color & Timing Constants

All in `CareerTwinIntro.tsx` at the top for easy tuning:

```ts
const COLORS = {
  introBg:    "#F5F2ED",   // beige/off-white intro background
  titleText:  "#1C2B3A",   // charcoal blue — "Career Twin"
  muteText:   "#8A9BAD",   // muted slate — subtitle + %
  arcStroke:  "#D9D4CC",   // very faint arc decoration
  wipeFill:   "#1E2D40",   // muted navy — the polygon wipe
};

const TIMING = {
  loadingMs:     2800,  // 0→100% duration
  holdMs:          400,  // pause at 100% before wipe
  wipeDurationMs:  700,  // star expands to cover screen
  exitDelayMs:     100,  // brief wait after wipe before unmount
};
```

---

## Task 1: Install Framer Motion

**Files:**
- Modify: `career-twin/frontend/package.json` (via npm install)

- [ ] **Step 1: Install**
```bash
cd career-twin/frontend && npm install framer-motion
```
Expected: framer-motion appears in package.json dependencies

- [ ] **Step 2: Verify**
```bash
cd career-twin/frontend && node -e "require('framer-motion'); console.log('OK')" 2>/dev/null || npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3: Commit**
```bash
git add career-twin/frontend/package.json career-twin/frontend/package-lock.json
git commit -m "chore: install framer-motion for intro transition"
```

---

## Task 2: Build PolygonWipe component

**Files:**
- Create: `career-twin/frontend/components/intro/PolygonWipe.tsx`

This component is a full-screen navy overlay whose `clip-path` is a 4-pointed elongated diamond-cross (compass rose shape). It starts at a tiny point in the center and expands until it covers the entire viewport, then calls `onComplete`.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

interface PolygonWipeProps {
  color?: string;       // fill color of the wipe shape
  duration?: number;    // ms
  onComplete: () => void;
}

// 4-pointed elongated star (compass rose).
// Points at top/bottom/left/right extend beyond viewport bounds.
// Inner corners are close to center.
// Values are percentages of the bounding box.
const STAR_TINY =
  "polygon(50% 50%, 51% 50%, 50% 50%, 50% 51%, 50% 50%, 49% 50%, 50% 50%, 50% 49%)";

const STAR_FULL =
  "polygon(50% -60%, 58% 45%, 160% 50%, 58% 55%, 50% 160%, 42% 55%, -60% 50%, 42% 45%)";

export function PolygonWipe({
  color = "#1E2D40",
  duration = 700,
  onComplete,
}: PolygonWipeProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls
      .start({
        clipPath: STAR_FULL,
        transition: {
          duration: duration / 1000,
          ease: [0.16, 1, 0.3, 1], // expo out — fast start, graceful finish
        },
      })
      .then(onComplete);
  }, [controls, duration, onComplete]);

  return (
    <motion.div
      initial={{ clipPath: STAR_TINY }}
      animate={controls}
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
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add career-twin/frontend/components/intro/PolygonWipe.tsx
git commit -m "feat: PolygonWipe component — 4-pointed star clip-path wipe animation"
```

---

## Task 3: Build CareerTwinIntro component

**Files:**
- Create: `career-twin/frontend/components/intro/CareerTwinIntro.tsx`

This is the full intro screen. It renders:
1. A beige full-screen background
2. A centered branding block (title + subtitle + % counter)
3. A subtle large arc SVG decoration (from the reference)
4. A tiny monospace micro-status block (optional texture)
5. The `PolygonWipe` overlay when state reaches `wiping`

State machine: `"loading"` → `"holding"` → `"wiping"` → `"done"`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PolygonWipe } from "./PolygonWipe";

/* ─── Tuneable constants ─────────────────────────────── */
const COLORS = {
  introBg:   "#F5F2ED",
  titleText: "#1C2B3A",
  muteText:  "#8A9BAD",
  arcStroke: "#D9D4CC",
  wipeFill:  "#1E2D40",
};
const TIMING = {
  loadingMs:    2800,
  holdMs:        400,
  wipeDurationMs: 700,
  exitDelayMs:   100,
};
/* ───────────────────────────────────────────────────── */

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
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  // Smooth loading percentage animation
  useEffect(() => {
    if (phase !== "loading") return;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      // Ease-out cubic so it slows near 100
      const t = Math.min(elapsed / TIMING.loadingMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(eased * 100);
      setPercent(value);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPercent(100);
        setPhase("holding");
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Rotate status line every ~900ms during loading
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
    <AnimatePresence>
      <div
        className="fixed inset-0 z-40 overflow-hidden select-none"
        style={{ backgroundColor: COLORS.introBg }}
        // Lock scroll while intro is active
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
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
            opacity="0.6"
          />
        </svg>

        {/* Centered branding block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {/* Loading % — small, above the title */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ color: COLORS.muteText }}
            className="text-xs font-mono tracking-widest tabular-nums"
          >
            {percent.toString().padStart(3, "0")} %
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

          {/* Thin progress bar */}
          <div className="mt-4 w-40 h-px rounded-full overflow-hidden"
               style={{ backgroundColor: COLORS.arcStroke }}>
            <motion.div
              className="h-full"
              style={{ backgroundColor: COLORS.muteText }}
              initial={{ scaleX: 0, transformOrigin: "left" }}
              animate={{ scaleX: percent / 100 }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>
        </div>

        {/* Micro-status — bottom-left, very subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-8 left-8 font-mono text-[10px] leading-relaxed"
          style={{ color: COLORS.muteText }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={statusIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {STATUS_LINES[statusIdx]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Polygon wipe — mounts when phase is "wiping" */}
      {phase === "wiping" && (
        <PolygonWipe
          color={COLORS.wipeFill}
          duration={TIMING.wipeDurationMs}
          onComplete={handleWipeComplete}
        />
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add career-twin/frontend/components/intro/CareerTwinIntro.tsx
git commit -m "feat: CareerTwinIntro component — beige loading screen with arc, %, status, and polygon wipe"
```

---

## Task 4: Integrate intro into page.tsx

**Files:**
- Modify: `career-twin/frontend/app/page.tsx`

The upload page renders normally. We wrap it with a `showIntro` state. While `showIntro` is true, `CareerTwinIntro` sits on top (z-40) and the upload page renders underneath (hidden until intro completes). This means the upload page is already rendered and interactive the instant the intro unmounts.

- [ ] **Step 1: Update page.tsx**

Replace the current `page.tsx` content with:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload/UploadZone";
import { uploadCV } from "@/lib/api";
import { CareerTwinIntro } from "@/components/intro/CareerTwinIntro";
import type { UploadResponse } from "@/lib/types";

const LOADING_MESSAGES = [
  "Reading your CV…",
  "Identifying your experience…",
  "Structuring your profile…",
];

export default function UploadPage() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll while intro is active
  useEffect(() => {
    if (showIntro) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showIntro]);

  async function handleUpload(file: File) {
    setIsLoading(true);
    setError(null);
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 1800);
    try {
      const result: UploadResponse = await uploadCV(file);
      clearInterval(interval);
      sessionStorage.setItem("upload_result", JSON.stringify(result));
      router.push("/review");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Intro transition — sits above the upload page */}
      {showIntro && (
        <CareerTwinIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* Existing upload page — unchanged */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Career Twin
            </h1>
            <p className="text-lg text-slate-500">
              Upload your CV and discover your ideal career path.
            </p>
          </div>
          <UploadZone
            onUpload={handleUpload}
            isLoading={isLoading}
            loadingMessage={loadingMsg}
          />
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}
          <p className="text-xs text-center text-slate-400">
            Your CV is processed securely and never stored permanently.
          </p>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: TypeScript check**
```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: no errors

- [ ] **Step 3: Start dev server and manually verify**
```bash
cd career-twin/frontend && npm run dev
```
Open http://localhost:3000 and verify:
1. ✅ Beige full-screen intro appears (not the upload page)
2. ✅ "Career Twin" is the largest / most prominent element
3. ✅ Loading % counts up smoothly from 0→100 (small, muted)
4. ✅ Thin progress bar tracks the %
5. ✅ Subtle arc visible faintly in the background
6. ✅ Rotating micro-status text in bottom-left (very faint)
7. ✅ At 100%, brief hold, then 4-pointed star expands in navy
8. ✅ Star covers full screen then upload page is revealed
9. ✅ Upload page is fully functional after reveal
10. ✅ Scroll locked during intro, restored after

- [ ] **Step 4: Commit**
```bash
git add career-twin/frontend/app/page.tsx
git commit -m "feat: integrate CareerTwinIntro into upload page — branded loading sequence with polygon wipe"
```

---

## Task 5: Reduced-motion support + polish

**Files:**
- Modify: `career-twin/frontend/components/intro/CareerTwinIntro.tsx`
- Modify: `career-twin/frontend/components/intro/PolygonWipe.tsx`

- [ ] **Step 1: Add prefers-reduced-motion skip in CareerTwinIntro**

In `CareerTwinIntro.tsx`, add at the top of the component (after useState declarations):

```tsx
// Skip intro entirely for users who prefer reduced motion
useEffect(() => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) {
    setPhase("done");
    onComplete();
  }
}, [onComplete]);
```

- [ ] **Step 2: Verify TypeScript and manually check**
```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3: Commit**
```bash
git add career-twin/frontend/components/intro/CareerTwinIntro.tsx
git commit -m "feat: skip intro for prefers-reduced-motion users"
```

---

## Tuning Reference

After implementation, here's where to change each thing:

| What to change | Where | Variable |
|---|---|---|
| Intro background color | `CareerTwinIntro.tsx` | `COLORS.introBg` |
| Title color | `CareerTwinIntro.tsx` | `COLORS.titleText` |
| Subtitle / % color | `CareerTwinIntro.tsx` | `COLORS.muteText` |
| Arc color | `CareerTwinIntro.tsx` | `COLORS.arcStroke` |
| Wipe polygon color | `CareerTwinIntro.tsx` | `COLORS.wipeFill` |
| Loading speed (0→100) | `CareerTwinIntro.tsx` | `TIMING.loadingMs` |
| Hold at 100% | `CareerTwinIntro.tsx` | `TIMING.holdMs` |
| Wipe expansion speed | `CareerTwinIntro.tsx` | `TIMING.wipeDurationMs` |
| Wipe shape | `PolygonWipe.tsx` | `STAR_FULL` clip-path points |
| Subtitle text | `CareerTwinIntro.tsx` | JSX subtitle string |
| Status lines | `CareerTwinIntro.tsx` | `STATUS_LINES` array |
