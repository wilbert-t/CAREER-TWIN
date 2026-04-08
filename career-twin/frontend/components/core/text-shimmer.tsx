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

// Cache motion components so motion.create() is never called inside a render function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const motionCache = new Map<React.ElementType, ReturnType<typeof motion.create<any>>>();
function getMotionComponent(el: React.ElementType) {
  if (!motionCache.has(el)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    motionCache.set(el, motion.create(el as any));
  }
  return motionCache.get(el)!;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = getMotionComponent(Component);
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
