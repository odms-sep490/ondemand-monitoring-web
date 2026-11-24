import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AI_MOTION } from './aiMotionTokens'

type Props = {
  /** Only active while a real AI request is in flight. */
  active: boolean
  label?: string
  compact?: boolean
}

/**
 * Compact holographic document scanner shown during real AI processing.
 * Purely visual — never fabricates internal reasoning steps or fake percentages.
 */
export function HologramEffectLayer({
  active,
  label = 'Đang phân tích yêu cầu…',
  compact = false,
}: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={`ai-holo-layer${compact ? ' is-compact' : ''}`}
          role="status"
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.96 }}
          transition={{ duration: AI_MOTION.duration.short, ease: AI_MOTION.ease.out }}
        >
          <span className="ai-holo-doc" aria-hidden="true">
            <span className="ai-holo-doc-line is-1" />
            <span className="ai-holo-doc-line is-2" />
            <span className="ai-holo-doc-line is-3" />
            <span className="ai-holo-scanline" />
          </span>
          <span className="ai-holo-glyphs" aria-hidden="true">
            <i className="is-diamond" />
            <i className="is-ring" />
            <i className="is-dot" />
          </span>
          <span className="ai-holo-label">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
