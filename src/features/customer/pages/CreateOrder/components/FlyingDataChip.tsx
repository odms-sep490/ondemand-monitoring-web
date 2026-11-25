import { CheckCircleFilled } from '@ant-design/icons'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { createPortal } from 'react-dom'
import { AI_MOTION } from './aiMotionTokens'

export type FlyingChipPayload = {
  id: string
  label: string
  draftKey: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

type Props = {
  chips: FlyingChipPayload[]
  onComplete: (id: string) => void
}

/**
 * Purely visual FLIP-style flying chip linking a confirmed conversation/form action
 * to its validated row in the Live Draft Summary. Never mutates business state.
 */
export function FlyingDataChipLayer({ chips, onComplete }: Props) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion || typeof document === 'undefined' || !chips.length) return null

  return createPortal(
    <div className="ai-flying-chip-stage" aria-hidden="true">
      <AnimatePresence>
        {chips.map((chip) => {
          const midX = (chip.fromX + chip.toX) / 2
          const midY = Math.min(chip.fromY, chip.toY) - 28
          return (
            <motion.span
              key={chip.id}
              className="ai-flying-chip"
              data-draft-target={chip.draftKey}
              initial={{
                x: chip.fromX,
                y: chip.fromY,
                scale: 0.85,
                opacity: 0,
              }}
              animate={{
                x: [chip.fromX, midX, chip.toX],
                y: [chip.fromY, midY, chip.toY],
                scale: [0.88, 1.06, 0.72],
                opacity: [0, 1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: AI_MOTION.duration.chipFlight,
                ease: AI_MOTION.ease.cinematic,
              }}
              onAnimationComplete={() => onComplete(chip.id)}
            >
              <CheckCircleFilled className="ai-flying-chip__icon" />
              <span>{chip.label}</span>
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
