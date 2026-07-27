import type { Transition } from 'motion/react';
import gsap from 'gsap';
import { animate } from 'animejs';

/**
 * Standard Spring Physics preset for Motion (Framer Motion)
 */
export const ModalSpringPresets = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: 'easeOut' } as Transition
  },

  container: {
    initial: { opacity: 0, scale: 0.95, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1, y: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 25 } as Transition
  },

  tabTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } as Transition
  }
};

/**
 * GSAP Animated Counter for numeric values (Calorie circles, Water/Step counters)
 */
export const animateCounter = (
  element: HTMLElement | null,
  targetValue: number,
  duration = 0.8,
  decimals = 0
) => {
  if (!element) return;
  const currentVal = parseFloat(element.innerText.replace(/[^0-9.]/g, '')) || 0;
  const obj = { val: currentVal };

  gsap.to(obj, {
    val: targetValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.innerText = decimals > 0 ? obj.val.toFixed(decimals) : Math.round(obj.val).toString();
    }
  });
};

/**
 * Anime.js Micro-interaction: Pulsing ripple feedback on button clicks / checkmarks
 */
export const triggerPulseAnimation = (targets: string | HTMLElement | HTMLElement[]) => {
  animate(targets, {
    scale: [1, 1.15, 1],
    duration: 350,
    ease: 'outElastic(1, .5)'
  });
};

/**
 * Anime.js Progress Bar Fill Animation
 */
export const animateProgressBar = (
  targets: string | HTMLElement | HTMLElement[],
  targetPercent: number,
  duration = 750
) => {
  animate(targets, {
    width: `${Math.min(100, Math.max(0, targetPercent))}%`,
    duration,
    ease: 'outQuad'
  });
};
