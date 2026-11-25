import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AI_MOTION } from './aiMotionTokens'

type Props = {
  /** Active portal burst when opening the consultation workspace. */
  active: boolean
  /** First opening plays the full layered cyan ring sequence; repeat opens play a brisk variation. */
  firstOpen: boolean
  /** Closing state shrinks the cyan portal rings smoothly during goodbye. */
  closing?: boolean
}

/**
 * Layered cyan circular portal rings positioned behind the robot hero.
 * Never blocks interaction or covers the full screen; respects prefers-reduced-motion.
 */
export function AIPortalTransition({ active, firstOpen, closing = false }: Props) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  const duration = firstOpen ? AI_MOTION.duration.portalFirst : AI_MOTION.duration.portalRepeat

  return (
    <AnimatePresence>
      {(active || closing) && (
        <motion.span
          key={closing ? 'portal-close' : firstOpen ? 'portal-first' : 'portal-repeat'}
          className={`ai-portal-rings${closing ? ' is-closing' : ''}`}
          aria-hidden="true"
          initial={{ opacity: closing ? 0.9 : 0, scale: closing ? 1 : 0.25 }}
          animate={{
            opacity: closing ? 0 : [0, 1, 0.85, 0],
            scale: closing ? 0.2 : firstOpen ? [0.25, 1.18, 1.38] : [0.45, 1.14, 1.26],
          }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: closing ? AI_MOTION.duration.goodbye : duration, ease: AI_MOTION.ease.cinematic }}
        >
          <span className="ai-portal-ring is-outer" />
          <span className="ai-portal-ring is-mid" />
          <span className="ai-portal-ring is-core" />
          <span className="ai-portal-flare" />
        </motion.span>
      )}
    </AnimatePresence>
  )
}
