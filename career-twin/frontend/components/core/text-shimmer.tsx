'use client';

import { CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type TextShimmerProps = {
  children: string;
  as?: 'p' | 'span' | 'strong' | 'div' | 'h1' | 'h2' | 'h3';
  className?: string;
  duration?: number;
  spread?: number;
};

function ShimmerWrapper({
  as,
  className,
  children,
  style,
  duration,
}: {
  as: NonNullable<TextShimmerProps['as']>;
  className: string;
  children: ReactNode;
  style: CSSProperties;
  duration: number;
}) {
  const animationProps = {
    className,
    initial: { backgroundPosition: '100% center' },
    animate: { backgroundPosition: '0% center' },
    transition: {
      repeat: Infinity,
      duration,
      ease: 'linear',
    },
    style,
  };

  switch (as) {
    case 'span':
      return <motion.span {...animationProps}>{children}</motion.span>;
    case 'strong':
      return <motion.strong {...animationProps}>{children}</motion.strong>;
    case 'div':
      return <motion.div {...animationProps}>{children}</motion.div>;
    case 'h1':
      return <motion.h1 {...animationProps}>{children}</motion.h1>;
    case 'h2':
      return <motion.h2 {...animationProps}>{children}</motion.h2>;
    case 'h3':
      return <motion.h3 {...animationProps}>{children}</motion.h3>;
    case 'p':
    default:
      return <motion.p {...animationProps}>{children}</motion.p>;
  }
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const dynamicSpread = children.length * spread;

  return (
    <ShimmerWrapper
      as={Component}
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent',
        '[--base-color:#a1a1aa] [--base-gradient-color:#ffffff]',
        '[background-image:linear-gradient(90deg,transparent_calc(var(--width)_-_var(--spread)),var(--base-gradient-color)_var(--width),transparent_calc(var(--width)_+_var(--spread))),linear-gradient(var(--base-color),var(--base-color))]',
        className
      )}
      duration={duration}
      style={
        {
          '--spread': `${spread}em`,
          '--width': `${dynamicSpread}em`,
        } as CSSProperties
      }
    >
      {children}
    </ShimmerWrapper>
  );
}
