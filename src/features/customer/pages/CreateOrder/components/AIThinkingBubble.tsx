import { motion, useReducedMotion } from 'motion/react'
import { AIAnimatedMascot } from './AIAnimatedMascot'
import { AI_MOTION } from './aiMotionTokens'

type Props = {
  /** Real processing state from the conversation request lifecycle. */
  phase: 'SENDING' | 'PROCESSING' | 'RESPONDING' | 'IDLE' | 'ERROR'
}

/**
 * Processing bubble shown only while a real conversation request is in flight.
 * Ring, scanline and data glyphs are abstract visuals; no fake progress or invented reasoning text.
 */
export function AIThinkingBubble({ phase }: Props) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      layoutId="ai-assistant-turn"
      className="order-chat-processing ai-thinking-bubble"
      data-state={phase}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: AI_MOTION.duration.short, ease: AI_MOTION.ease.out }}
    >
      <span className="ai-thinking-holo" aria-hidden="true">
        <span className="ai-thinking-ring" />
        <AIAnimatedMascot className="order-chat-processing-avatar" state="thinking" animated size="avatar" />
        <span className="ai-thinking-glyph is-a" />
        <span className="ai-thinking-glyph is-b" />
        <span className="ai-thinking-glyph is-c" />
      </span>
      <span className="order-chat-processing-copy">
        <span className="order-chat-processing-label">Trợ lý đang xử lý yêu cầu...</span>
        <span className="order-chat-processing-meta">
          <span className="order-chat-typing" aria-hidden="true"><i /><i /><i /></span>
        </span>
      </span>
      <span className="ai-thinking-scan" aria-hidden="true" />
    </motion.div>
  )
}
