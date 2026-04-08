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
