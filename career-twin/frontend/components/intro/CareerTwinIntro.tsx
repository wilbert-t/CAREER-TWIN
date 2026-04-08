"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  // Skip intro entirely for users who prefer reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPhase("done");
      onComplete();
    }
  }, [onComplete]);

  // Smooth loading percentage via requestAnimationFrame
  useEffect(() => {
    if (phase !== "loading") return;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / TIMING.loadingMs, 1);
      // Ease-out cubic — slows near 100%
      const eased = 1 - Math.pow(1 - t, 3);
      setPercent(Math.floor(eased * 100));

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
          {/* Small arc marker — travels along the circle bottom */}
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

          {/* Loading % — small + muted, sits above the title */}
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

          {/* Thin progress bar */}
          <div
            className="mt-4 w-40 h-px rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.arcStroke }}
          >
            <motion.div
              className="h-full"
              style={{ backgroundColor: COLORS.muteText, transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: percent / 100 }}
              transition={{ ease: "linear", duration: 0.1 }}
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

      {/* Polygon wipe — mounts when phase reaches "wiping" */}
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
