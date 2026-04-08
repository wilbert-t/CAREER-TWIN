# Intro Screen Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the intro loading screen with a TextShimmer title, 1.5× larger heading, and an animated dot orbiting the decorative arc.

**Architecture:** Two changes — (A) add `TextShimmer` component file (manual copy from motion-primitives, no npm install needed since Framer Motion is already installed); (B) update `CareerTwinIntro` to use TextShimmer for the title, bump title to `text-7xl`, replace the static arc dot with a CSS-orbit `motion.div`.

**Tech Stack:** Next.js App Router, Framer Motion 12, Tailwind CSS, `cn` from `@/lib/utils`

---

## File Map

| Action | Path | Change |
|--------|------|--------|
| Create | `career-twin/frontend/components/core/text-shimmer.tsx` | TextShimmer component (manual motion-primitives copy) |
| Modify | `career-twin/frontend/components/intro/CareerTwinIntro.tsx` | TextShimmer title, text-7xl, orbiting dot |

---

## Task 1: Create TextShimmer component

**Files:**
- Create: `career-twin/frontend/components/core/text-shimmer.tsx`

TextShimmer is a motion-primitives component. It works by animating a `backgroundPosition` on a gradient that sweeps a bright highlight across text. Colors are controlled via `--base-color` and `--base-gradient-color` CSS custom properties set in `className`.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p career-twin/frontend/components/core
```

Write `career-twin/frontend/components/core/text-shimmer.tsx`:

```tsx
'use client';

import { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  // motion.create() wraps any HTML element in a motion component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionComponent = motion.create(Component as any);
  const dynamicSpread = children.length * spread;

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent',
        // Default colors — override via className with [--base-color:...] [--base-gradient-color:...]
        '[--base-color:#a1a1aa] [--base-gradient-color:#ffffff]',
        '[background-image:linear-gradient(90deg,transparent_calc(var(--width)_-_var(--spread)),var(--base-gradient-color)_var(--width),transparent_calc(var(--width)_+_var(--spread))),linear-gradient(var(--base-color),var(--base-color))]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={
        {
          '--spread': `${spread}em`,
          '--width': `${dynamicSpread}em`,
        } as CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1; echo "exit:$?"
```

Expected: `exit:0`

- [ ] **Step 3: Commit**

```bash
git add career-twin/frontend/components/core/text-shimmer.tsx
git commit -m "feat: add TextShimmer component (motion-primitives manual install)"
```

---

## Task 2: Apply TextShimmer + title resize + orbiting dot to CareerTwinIntro

**Files:**
- Modify: `career-twin/frontend/components/intro/CareerTwinIntro.tsx`

Three changes to this file:
1. Replace `motion.h1` with `<TextShimmer as="h1">` at `text-7xl` (1.5× the current `text-5xl`)
2. Remove the static dot `<circle cx="60%" cy="84%" r="3" .../>` from the SVG
3. Add an orbiting `motion.div` dot outside the SVG, positioned at the visual center of the arc and animated with `rotate: 360`

**Color for orbiting dot:** `#C4A882` — warm cream-brown that fits the beige brand palette and is visible without being loud. Dot gets a soft glow: `boxShadow: "0 0 6px rgba(196,168,130,0.9), 0 0 14px rgba(196,168,130,0.35)"`.

**Orbit radius:** `45vmin` — approximates the visual radius of the arc across common viewport sizes.

**Orbit speed:** 12s per revolution — slow and calm, not distracting.

- [ ] **Step 1: Add TextShimmer import**

At the top of `CareerTwinIntro.tsx`, add:
```tsx
import { TextShimmer } from "@/components/core/text-shimmer";
```

- [ ] **Step 2: Replace the motion.h1 with TextShimmer**

Find and replace:
```tsx
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
          style={{ color: COLORS.titleText }}
          className="text-5xl font-bold tracking-tight leading-none"
        >
          Career Twin
        </motion.h1>
```

Replace with:
```tsx
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
        >
          <TextShimmer
            as="h1"
            duration={2.5}
            spread={1.5}
            className="text-7xl font-bold tracking-tight leading-none [--base-color:#1C2B3A] [--base-gradient-color:#C4A882]"
          >
            Career Twin
          </TextShimmer>
        </motion.div>
```

- [ ] **Step 3: Remove the static dot from the SVG**

Find and remove this line inside the `<svg>` block:
```tsx
        <circle cx="60%" cy="84%" r="3" fill={COLORS.arcStroke} opacity="0.8" />
```

- [ ] **Step 4: Add the orbiting dot div after the closing `</svg>` tag**

After `</svg>` and before the content group `<motion.div>`, insert:

```tsx
      {/* Orbiting dot — rotates around the decorative arc */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: "72%", top: "50%", width: 0, height: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: "#C4A882",
            boxShadow: "0 0 6px rgba(196,168,130,0.9), 0 0 14px rgba(196,168,130,0.35)",
            transform: "translate(-50%, calc(-45vmin - 50%))",
          }}
        />
      </motion.div>
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd career-twin/frontend && npx tsc --noEmit 2>&1; echo "exit:$?"
```

Expected: `exit:0`

- [ ] **Step 6: Verify build**

```bash
cd career-twin/frontend && npm run build 2>&1 | tail -10
```

Expected: clean build, all 5 routes listed.

- [ ] **Step 7: Commit**

```bash
git add career-twin/frontend/components/intro/CareerTwinIntro.tsx
git commit -m "feat: TextShimmer title, text-7xl heading, orbiting dot on intro arc"
```

---

## Task 3: Visual verification

- [ ] **Step 1: Start dev server**

```bash
cd career-twin/frontend && npm run dev
```

Open http://localhost:3000

- [ ] **Step 2: Verify shimmer**

1. ✅ "Career Twin" title is larger than before (7xl ≈ 72px)
2. ✅ Warm shimmer sweeps continuously left-to-right across the text
3. ✅ Base color is dark charcoal, shimmer highlight is cream-brown (`#C4A882`)

- [ ] **Step 3: Verify orbiting dot**

1. ✅ A small cream-brown dot orbits the decorative arc continuously
2. ✅ Orbit is smooth (no jank, no stutter)
3. ✅ Dot has a soft warm glow
4. ✅ Static dot is gone (replaced by orbiting one)

- [ ] **Step 4: Verify transition still works**

1. ✅ Loading completes → content fades → panel lifts — still clean

- [ ] **Step 5: Push**

```bash
git push origin main
```
