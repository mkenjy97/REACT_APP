import type { Variants, Transition } from 'framer-motion';

export const TRANSITIONS = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30
  } as Transition,
  smooth: {
    duration: 0.3,
    ease: 'easeInOut'
  } as Transition,
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 10
  } as Transition,
};

export const PAGE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: TRANSITIONS.smooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(10px)',
    transition: TRANSITIONS.smooth,
  },
};

export const STAGGER_CONTAINER: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

/* ───────────── PREMIUM EDITABLE ROW ANIMATIONS ───────────── */

export const EDITABLE_VIEW: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: TRANSITIONS.smooth,
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: TRANSITIONS.smooth,
  },
};

export const EDITABLE_COLLAPSE: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: TRANSITIONS.smooth,
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: TRANSITIONS.smooth,
  },
};

export const SUCCESS_FLASH = {
  initial: { backgroundColor: "rgba(34,197,94,0)" },
  animate: {
    backgroundColor: "rgba(34,197,94,0.12)",
    transition: { duration: 0.3 },
  },
};
