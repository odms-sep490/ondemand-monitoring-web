import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { createPortal } from 'react-dom'

import { defineMessages, useI18n } from '../../../../../shared/i18n'
import { AI_MOTION } from './aiMotionTokens'
import { AIAnimatedMascot, type AIMascotState } from './AIAnimatedMascot'
import './OrderAssistantLauncher.css'

const messages = defineMessages({
  vi: {
    open: 'Mở trợ lý tạo yêu cầu',
    drag: 'Giữ và kéo để di chuyển',
  },
  en: {
    open: 'Open request assistant',
    drag: 'Drag to move',
  },
})

type Position = { left: number; top: number }

type DragState = {
  pointerId: number
  pointerX: number
  pointerY: number
  originLeft: number
  originTop: number
  left: number
  top: number
  width: number
  height: number
  moved: boolean
}

type Props = {
  open: boolean
  onOpen: () => void
  state?: AIMascotState
}

const EDGE_GAP = 16
const SAFE_BOTTOM_GAP = 20
const SAFE_TOP_GAP = 72
const DRAG_THRESHOLD = 4

function clampPosition(
  left: number,
  top: number,
  width: number,
  height: number,
): Position {
  const maxLeft = Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP)
  const maxTop = Math.max(SAFE_TOP_GAP, window.innerHeight - height - SAFE_BOTTOM_GAP)

  return {
    left: Math.min(Math.max(EDGE_GAP, left), maxLeft),
    top: Math.min(Math.max(SAFE_TOP_GAP, top), maxTop),
  }
}

/** Magnetic edge docking: snaps smoothly to nearest left or right viewport edge. */
function snapToMagneticEdge(
  left: number,
  top: number,
  width: number,
  height: number,
): Position {
  const clamped = clampPosition(left, top, width, height)
  const centerX = clamped.left + width / 2
  const dockedLeft =
    centerX < window.innerWidth / 2
      ? EDGE_GAP
      : Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP)
  return { left: dockedLeft, top: clamped.top }
}

export function OrderAssistantLauncher({ open, onOpen, state = 'idle' }: Props) {
  const { t } = useI18n(messages)
  const reduceMotion = useReducedMotion()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const positionRef = useRef<Position | null>(null)
  const suppressClickUntil = useRef(0)
  const [position, setPosition] = useState<Position | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dockBounce, setDockBounce] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right')

  useEffect(() => {
    function keepLauncherInViewport() {
      const current = positionRef.current
      const button = buttonRef.current
      if (!current || !button) return

      const rect = button.getBoundingClientRect()
      const next = snapToMagneticEdge(
        current.left,
        current.top,
        rect.width,
        rect.height,
      )
      positionRef.current = next
      setDockSide(next.left < window.innerWidth / 2 ? 'left' : 'right')
      setPosition(next)
    }

    window.addEventListener('resize', keepLauncherInViewport)
    return () => window.removeEventListener('resize', keepLauncherInViewport)
  }, [])

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.pointerX
    const deltaY = event.clientY - drag.pointerY
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return

    drag.moved = true
    const next = clampPosition(
      drag.originLeft + deltaX,
      drag.originTop + deltaY,
      drag.width,
      drag.height,
    )
    drag.left = next.left
    drag.top = next.top

    // Keep high-frequency pointer movement out of React state; commit once on release.
    event.currentTarget.style.left = `${next.left}px`
    event.currentTarget.style.top = `${next.top}px`
    event.currentTarget.style.right = 'auto'
    event.currentTarget.style.bottom = 'auto'
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setDragging(false)
    if (!drag.moved) return

    const snapped = snapToMagneticEdge(drag.left, drag.top, drag.width, drag.height)
    positionRef.current = snapped
    setDockSide(snapped.left < window.innerWidth / 2 ? 'left' : 'right')
    setPosition(snapped)
    setDockBounce(true)
    window.setTimeout(() => setDockBounce(false), 420)
    suppressClickUntil.current = Date.now() + 250
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!event.shiftKey) return

    const movement: Record<string, Position> = {
      ArrowUp: { left: 0, top: -24 },
      ArrowDown: { left: 0, top: 24 },
      ArrowLeft: { left: -24, top: 0 },
      ArrowRight: { left: 24, top: 0 },
    }
    const delta = movement[event.key]
    if (!delta) return

    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const current = positionRef.current ?? { left: rect.left, top: rect.top }
    const next = clampPosition(
      current.left + delta.left,
      current.top + delta.top,
      rect.width,
      rect.height,
    )
    positionRef.current = next
    setDockSide(next.left < window.innerWidth / 2 ? 'left' : 'right')
    setPosition(next)
  }

  function triggerOpen() {
    setLaunching(true)
    onOpen()
    window.setTimeout(() => setLaunching(false), 180)
  }

  if (open || typeof document === 'undefined') return null

  return createPortal(
    <motion.button
      ref={buttonRef}
      type="button"
      className={`order-assistant-launcher is-dock-${dockSide}${dragging ? ' is-dragging' : ''}${dockBounce ? ' is-dock-settling' : ''}${launching ? ' is-launching' : ''}`}
      data-mascot-state={launching ? 'welcome' : state}
      data-dock-side={dockSide}
      style={
        position
          ? {
              left: position.left,
              top: position.top,
              right: 'auto',
              bottom: 'auto',
            }
          : undefined
      }
      animate={
        reduceMotion
          ? undefined
          : launching
            ? { scale: 1.12, y: -6 }
            : dockBounce
              ? { scale: [1.06, 0.95, 1.02, 1], transition: { duration: 0.36, ease: AI_MOTION.ease.out } }
              : { scale: 1, y: 0 }
      }
      transition={AI_MOTION.ease.dockSpring}
      aria-label={t.open}
      aria-haspopup="dialog"
      title={`${t.open} · ${t.drag}`}
      onClick={(event) => {
        if (event.detail > 0 && Date.now() < suppressClickUntil.current) return
        triggerOpen()
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onKeyDown={handleKeyDown}
    >
      <span className="order-assistant-launcher__portal-halo" aria-hidden="true" />
      <AIAnimatedMascot
        state={launching ? 'welcome' : state}
        size="launcher"
        interactivePointer={!dragging}
      />
      <span className="order-assistant-launcher__invite" aria-hidden="true">
        Cần em hỗ trợ tạo yêu cầu không?
      </span>
    </motion.button>,
    document.body,
  )
}
