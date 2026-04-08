"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

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
