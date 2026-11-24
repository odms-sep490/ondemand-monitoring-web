/**
 * Shared Motion Design Tokens for the Living AI World (V3).
 * Every transition, spring, cyan trail, and holographic accent draws from this palette.
 */
export const AI_MOTION = {
  ease: {
    out: [0.22, 1, 0.36, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
    cinematic: [0.16, 1, 0.3, 1] as const,
    spring: { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const,
    softSpring: { type: 'spring', stiffness: 220, damping: 24 } as const,
    bouncySpring: { type: 'spring', stiffness: 340, damping: 18, mass: 0.75 } as const,
    portalSpring: { type: 'spring', stiffness: 260, damping: 22, mass: 0.9 } as const,
    dockSpring: { type: 'spring', stiffness: 420, damping: 26, mass: 0.85 } as const,
    antennaSpring: { type: 'spring', stiffness: 180, damping: 11, mass: 0.6 } as const,
  },
  duration: {
    micro: 0.14,
    short: 0.22,
    medium: 0.34,
    long: 0.55,
    portalFirst: 0.78,
    portalRepeat: 0.36,
    goodbye: 0.38,
    chipFlight: 0.58,
  },
  stagger: 0.06,
  /** Entrance used by chat bubbles, widgets and new questions. */
  enter: { opacity: 0, y: 8 },
  rest: { opacity: 1, y: 0 },
  idle: {
    minIntervalMs: 5500,
    maxIntervalMs: 10500,
    actionDurationMs: 2200,
    blinkIntervalMs: 3800,
  },
  palette: {
    cyan: '#00c4ff',
    cyanBright: '#38bdf8',
    royal: '#1565e8',
    emerald: '#10b981',
    amber: '#f59e0b',
    glassBg: 'rgba(248, 252, 255, 0.82)',
    glassBorder: 'rgba(56, 189, 248, 0.35)',
  },
} as const

/** Max tilt (deg) for pointer-driven service cards on fine pointers only. */
export const AI_CARD_TILT_DEG = 6
