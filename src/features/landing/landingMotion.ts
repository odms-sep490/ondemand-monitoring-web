export const LANDING_MOTION = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  spring: { type: 'spring', stiffness: 320, damping: 30 } as const,
  duration: {
    micro: 0.16,
    short: 0.28,
    medium: 0.45,
    cinematic: 0.72,
  },
  stagger: 0.07,
  viewport: { once: true, amount: 0.18 } as const,
} as const
