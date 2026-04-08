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
