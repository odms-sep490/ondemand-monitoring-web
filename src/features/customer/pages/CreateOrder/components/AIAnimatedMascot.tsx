import { RobotOutlined } from '@ant-design/icons'
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AI_MOTION } from './aiMotionTokens'
import {
  pickNextIdleAction,
  resolveDirectorSnapshot,
  type AIMascotPointDirection,
  type AIMascotState,
  type AIRobotExpression,
  type AIRobotGesture,
  type RobotGazeVector,
  type RobotIdleAction,
} from './AIRobotAnimationController'
import { useAudioReactiveLevel } from './AudioReactiveAnimator'
import { RobotCharacterRig } from './RobotCharacterRig'
import './AIAnimatedMascot.css'

export type {
  AIMascotPointDirection,
  AIMascotState,
  AIRobotExpression,
  AIRobotGesture,
  RobotGazeVector,
  RobotIdleAction,
}

type Props = {
  state?: AIMascotState
  expression?: AIRobotExpression
  gesture?: AIRobotGesture
  size?: 'launcher' | 'avatar' | 'hero' | 'companion'
  animated?: boolean
  showHologram?: boolean
  className?: string
  speechAnalyser?: AnalyserNode | null
  pointDirection?: AIMascotPointDirection
  /** External gaze vector from RobotTargetRegistry (pointing at real UI widgets). */
  targetGaze?: RobotGazeVector
  /** Suppress playful idle behaviors while customer is typing, reading, or choosing a date. */
  calmFocus?: boolean
  /** Controlled counter for varying success/confirmation gestures. */
  successCounter?: number
  /** Trigger brief aerial entrance spin when emerging from the cyan portal. */
  portalSpin?: boolean
  /** Enable pointer-aware gaze/lean on fine pointers (disabled on touch). */
  interactivePointer?: boolean
  /** Force articulated 2.5D rig or static raster image (defaults to rig on hero/launcher/companion, image on avatar). */
  rigMode?: 'auto' | 'rig' | 'image'
}

const mascotImage = '/assets/ai/ondemand-ai-mascot.webp'

const imageAnimationByState: Record<AIMascotState, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0, -2, 0],
    x: [0, 1.5, 0, -1.5, 0],
    rotate: [0, -1, 0, 1, 0],
    transition: { duration: 4.2, ease: 'easeInOut', repeat: Infinity },
  },
  welcome: {
    y: [12, -6, 0, -3, 0],
    rotate: [0, -6, 4, -3, 0],
    scale: [0.9, 1.06, 1],
    transition: { duration: 1.05, ease: 'easeOut' },
  },
  listening: {
    y: [0, -2, 0],
    rotate: [0, 2.5, 0],
    scale: [1, 1.03, 1],
    transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity },
  },
  thinking: {
    y: [0, -2.5, 0],
    rotate: [-3.5, 3.5, -3.5],
    transition: { duration: 1.85, ease: 'easeInOut', repeat: Infinity },
  },
  speaking: {
    y: [0, -2, 0, -1, 0],
    scale: [1, 1.025, 0.99, 1.02, 1],
    transition: { duration: 0.55, ease: 'easeInOut', repeat: Infinity },
  },
  explaining: {
    y: [0, -3, 0],
    rotate: [-2, 2, -2],
    scale: [1, 1.02, 1],
    transition: { duration: 1.4, ease: 'easeInOut', repeat: Infinity },
  },
  pointing: {
    y: [0, -3, 0],
    x: [0, 3, 0],
    rotate: [0, 4, 2],
    transition: { duration: 1.2, ease: 'easeInOut', repeat: Infinity },
  },
  confirming: {
    y: [0, -5, 0, -2, 0],
    rotate: [0, -2, 2, 0],
    scale: [1, 1.05, 1],
    transition: { duration: 0.7, ease: 'easeOut' },
  },
  success: {
    y: [0, -8, 0, -3, 0],
    rotate: [0, -4, 3, 0],
    scale: [1, 1.08, 1],
    transition: { duration: 0.85, ease: 'easeOut' },
  },
  error: {
    y: [0, 1, 0],
    rotate: [0, -2, 2, -1, 0],
    transition: { duration: 0.65, ease: 'easeInOut' },
  },
  goodbye: {
    y: [0, -4, 4],
    rotate: [0, 6, -4, 0],
    opacity: [1, 1, 0.9],
    transition: { duration: 0.7, ease: 'easeInOut' },
  },
}

const stillPose: TargetAndTransition = { y: 0, x: 0, rotate: 0, scale: 1 }

export function AIAnimatedMascot({
  state = 'idle',
  expression,
  gesture,
  size = 'avatar',
  animated = true,
  showHologram = false,
  className = '',
  speechAnalyser = null,
  pointDirection = 'down',
  targetGaze,
  calmFocus = false,
  successCounter = 0,
  portalSpin = false,
  interactivePointer = false,
  rigMode = 'auto',
}: Props) {
  const reduceMotion = useReducedMotion()
  const [pageVisible, setPageVisible] = useState(true)
  const [imageFailed, setImageFailed] = useState(false)
  const [idleAction, setIdleAction] = useState<RobotIdleAction>('none')
  const [blinking, setBlinking] = useState(false)
  const [pointerGaze, setPointerGaze] = useState<RobotGazeVector | null>(null)
  const [pointerSparkle, setPointerSparkle] = useState(false)
  const mascotRef = useRef<HTMLSpanElement | null>(null)
  const idleSeedRef = useRef(1)
  const lastIdleRef = useRef<RobotIdleAction>('none')

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  const shouldAnimate = animated && reduceMotion === false && pageVisible
  const useArticulatedRig =
    rigMode === 'rig' || (rigMode === 'auto' && size !== 'avatar')

  // Real Web Audio RMS amplitude-driven speaking animation
  const audioReactive = useAudioReactiveLevel(
    speechAnalyser,
    state === 'speaking',
    shouldAnimate,
  )

  useEffect(() => {
    const mascot = mascotRef.current
    if (!mascot || state !== 'speaking' || !shouldAnimate) {
      mascot?.style.removeProperty('--speech-glow')
      mascot?.style.removeProperty('--speech-level')
      return
    }
    mascot.style.setProperty('--speech-glow', `${8 + audioReactive.level * 14}px`)
    mascot.style.setProperty('--speech-level', `${audioReactive.level.toFixed(2)}`)
  }, [audioReactive.level, shouldAnimate, state])

  // Natural eye blinking + double-blink on articulated rig
  useEffect(() => {
    if (!useArticulatedRig || !shouldAnimate) {
      setBlinking(false)
      return
    }
    let blinkTimer = 0
    let unblinkTimer = 0
    const scheduleBlink = () => {
      const delay = AI_MOTION.idle.blinkIntervalMs + (idleSeedRef.current % 3) * 700
      blinkTimer = window.setTimeout(() => {
        setBlinking(true)
        unblinkTimer = window.setTimeout(() => {
          setBlinking(false)
          scheduleBlink()
        }, 130)
      }, delay)
    }
    scheduleBlink()
    return () => {
      window.clearTimeout(blinkTimer)
      window.clearTimeout(unblinkTimer)
    }
  }, [useArticulatedRig, shouldAnimate])

  // Procedural idle personality scheduler (paused when calmFocus or non-idle)
  useEffect(() => {
    if (!useArticulatedRig || !shouldAnimate || state !== 'idle' || calmFocus) {
      setIdleAction('none')
      return
    }
    let nextTimer = 0
    let resetTimer = 0
    const scheduleNext = () => {
      const span = AI_MOTION.idle.maxIntervalMs - AI_MOTION.idle.minIntervalMs
      const deterministicJitter = ((idleSeedRef.current * 1973) % span)
      const waitMs = AI_MOTION.idle.minIntervalMs + deterministicJitter
      nextTimer = window.setTimeout(() => {
        idleSeedRef.current += 1
        const nextAction = pickNextIdleAction(lastIdleRef.current, idleSeedRef.current)
        lastIdleRef.current = nextAction
        setIdleAction(nextAction)
        if (nextAction === 'double_blink') {
          setBlinking(true)
          window.setTimeout(() => setBlinking(false), 110)
          window.setTimeout(() => setBlinking(true), 240)
          window.setTimeout(() => setBlinking(false), 360)
        }
        resetTimer = window.setTimeout(() => {
          setIdleAction('none')
          scheduleNext()
        }, AI_MOTION.idle.actionDurationMs)
      }, waitMs)
    }
    scheduleNext()
    return () => {
      window.clearTimeout(nextTimer)
      window.clearTimeout(resetTimer)
    }
  }, [useArticulatedRig, shouldAnimate, state, calmFocus])

  // Pointer-aware gaze & occasional sparkle on fine pointers only (disabled on touch)
  useEffect(() => {
    if (!interactivePointer || !useArticulatedRig || !shouldAnimate) {
      setPointerGaze(null)
      setPointerSparkle(false)
      return
    }
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return
    }

    let sparkleTimer = 0
    const handlePointerMove = (event: PointerEvent) => {
      const node = mascotRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = event.clientX - cx
      const dy = event.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist > 260) {
        setPointerGaze(null)
        return
      }
      setPointerGaze({
        x: Math.max(-1, Math.min(1, dx / 140)),
        y: Math.max(-1, Math.min(1, dy / 140)),
      })
      if (dist < 110 && !sparkleTimer) {
        setPointerSparkle(true)
        sparkleTimer = window.setTimeout(() => {
          setPointerSparkle(false)
          sparkleTimer = 0
        }, 1200)
      }
    }

    const handlePointerLeave = () => {
      setPointerGaze(null)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      if (sparkleTimer) window.clearTimeout(sparkleTimer)
    }
  }, [interactivePointer, useArticulatedRig, shouldAnimate])

  const director = resolveDirectorSnapshot(
    {
      hasError: state === 'error',
      recording: state === 'listening',
      thinking: state === 'thinking',
      speaking: state === 'speaking',
      pointing: state === 'pointing',
      reaction: state,
      pointDirection,
    },
    {
      idleAction: pointerGaze ? 'pointer_smile' : idleAction,
      successCounter,
      gaze: targetGaze ?? pointerGaze ?? undefined,
      calmFocus,
    },
  )

  const activeExpression = expression ?? director.expression
  const activeGesture = gesture ?? director.gesture

  const showOverlays =
    size !== 'avatar' ||
    state === 'speaking' ||
    state === 'thinking' ||
    state === 'listening'

  return (
    <motion.span
      ref={mascotRef}
      className={`ai-animated-mascot ai-animated-mascot--${size}${useArticulatedRig ? ' is-rig' : ''} ${className}`.trim()}
      data-state={state}
      data-expression={activeExpression}
      data-gesture={activeGesture}
      data-idle-action={director.idleAction}
      data-rig-mode={useArticulatedRig ? '2.5d-rig' : 'image'}
      data-point-direction={state === 'pointing' ? pointDirection : undefined}
      aria-hidden="true"
      animate={
        useArticulatedRig
          ? stillPose
          : shouldAnimate
            ? imageAnimationByState[state]
            : stillPose
      }
      initial={false}
    >
      {/* Layered 2.5D ambient neon ring */}
      <span className="ai-animated-mascot__ring" />

      {useArticulatedRig ? (
        <RobotCharacterRig
          state={state}
          expression={activeExpression}
          gesture={activeGesture}
          idleAction={director.idleAction}
          gaze={director.gaze}
          pointDirection={pointDirection}
          audioLevel={audioReactive.level}
          mouthOpen={audioReactive.mouthOpen}
          blinking={blinking}
          shouldAnimate={shouldAnimate}
          portalSpin={portalSpin}
          pointerSparkle={pointerSparkle}
        />
      ) : imageFailed ? (
        <span className="ai-animated-mascot__fallback">
          <RobotOutlined />
        </span>
      ) : (
        <img
          className="ai-animated-mascot__image"
          src={mascotImage}
          alt=""
          draggable={false}
          decoding="async"
          loading={size === 'launcher' || size === 'hero' ? 'eager' : 'lazy'}
          fetchPriority={size === 'launcher' || size === 'hero' ? 'high' : 'auto'}
          onError={() => setImageFailed(true)}
        />
      )}

      {/* Lightweight holographic assistant panel during analysis */}
      {showHologram && state === 'thinking' && (
        <span className="ai-animated-mascot__hologram">
          <i />
          <i />
          <i />
        </span>
      )}

      {/* Contextual 2.5D state indicators */}
      {showOverlays && state === 'thinking' && (
        <span className="ai-animated-mascot__thought-dots">
          <i />
          <i />
          <i />
        </span>
      )}

      {showOverlays && state === 'listening' && (
        <span className="ai-animated-mascot__listen-waves">
          <i />
          <i />
        </span>
      )}

      {showOverlays && state === 'speaking' && (
        <span className="ai-animated-mascot__voice-bars">
          <i />
          <i />
          <i />
          <i />
        </span>
      )}

      {size !== 'avatar' && state === 'pointing' && (
        <span className={`ai-animated-mascot__pointer is-${pointDirection}`}>
          ➜
        </span>
      )}

      {size !== 'avatar' && (state === 'success' || state === 'confirming') && (
        <span className="ai-animated-mascot__sparkle">✓</span>
      )}
    </motion.span>
  )
}
