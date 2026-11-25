import { motion, useReducedMotion } from 'motion/react'
import type { ServiceMicroWorldTheme } from './ServiceMicroWorld'

type Props = {
  /** Optional theme cue; strictly decorative illustration, never a real flight path. */
  theme?: ServiceMicroWorldTheme
  /** Pause patrol orbit and settle at dock. */
  docked?: boolean
  className?: string
}

/**
 * Lightweight decorative miniature quadcopter drone for the AI welcome / guidance chrome.
 * Separated from all real map widgets so it never interferes with map gestures or fabricates routes.
 */
export function MiniatureDroneIllustration({
  theme = 'area',
  docked = false,
  className = '',
}: Props) {
  const reduceMotion = useReducedMotion()
  const animateOrbit = !reduceMotion && !docked

  return (
    <motion.span
      className={`ai-mini-drone is-${theme} ${className}`.trim()}
      data-drone-theme={theme}
      aria-hidden="true"
      animate={
        animateOrbit
          ? {
              x: [0, 10, 4, -8, 0],
              y: [0, -5, -2, -6, 0],
              rotate: [0, 4, -3, -5, 0],
            }
          : { x: 0, y: 0, rotate: 0 }
      }
      transition={{ duration: 6.4, ease: 'easeInOut', repeat: animateOrbit ? Infinity : 0 }}
    >
      <svg viewBox="0 0 64 40" width="44" height="28" focusable="false">
        {/* Arms */}
        <line x1="12" y1="14" x2="52" y2="14" stroke="#1d5be8" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="18" y1="14" x2="26" y2="22" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="14" x2="38" y2="22" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Rotors */}
        <motion.ellipse
          cx="12"
          cy="11"
          rx="9"
          ry="2.3"
          fill="#38bdf8"
          fillOpacity="0.65"
          animate={reduceMotion ? undefined : { opacity: [0.45, 0.95, 0.45], scaleX: [0.85, 1.08, 0.85] }}
          transition={{ duration: 0.24, repeat: Infinity }}
          style={{ transformOrigin: '12px 11px' }}
        />
        <motion.ellipse
          cx="52"
          cy="11"
          rx="9"
          ry="2.3"
          fill="#38bdf8"
          fillOpacity="0.65"
          animate={reduceMotion ? undefined : { opacity: [0.95, 0.45, 0.95], scaleX: [1.08, 0.85, 1.08] }}
          transition={{ duration: 0.24, repeat: Infinity }}
          style={{ transformOrigin: '52px 11px' }}
        />
        {/* Glossy white fuselage */}
        <rect x="22" y="13" width="20" height="10" rx="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.6" />
        {/* Cyan optical lens */}
        <circle cx="32" cy="18" r="2.8" fill="#00c4ff" />
        {/* Landing skids */}
        <path d="M 24 24 L 21 30 M 40 24 L 43 30 M 18 30 L 26 30 M 38 30 L 46 30" stroke="#1e40af" strokeWidth="1.6" strokeLinecap="round" />
        {/* Subtle downward scan cone */}
        <polygon points="29,23 35,23 41,38 23,38" fill="#38bdf8" fillOpacity="0.16" />
      </svg>
    </motion.span>
  )
}
