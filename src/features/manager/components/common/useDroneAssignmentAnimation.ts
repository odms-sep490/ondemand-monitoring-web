import { useCallback, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export type DroneAssignmentAnimationPhase =
  | 'IDLE'
  | 'PREPARING'
  | 'FLYING'
  | 'AWAITING_CONFIRMATION'
  | 'LANDING'
  | 'SUCCESS'
  | 'ROLLING_BACK'
  | 'ERROR'

type Point = { x: number; y: number }
type FlightGeometry = {
  source: HTMLElement
  target: HTMLElement
  start: Point
  end: Point
}

function centerOf(element: HTMLElement): Point {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function reducedMotionEnabled() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Owns only transient flight visuals; Mission props remain the assignment source of truth. */
export function useDroneAssignmentAnimation(
  scopeRef: RefObject<HTMLElement | null>,
) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Animation | null>(null)
  const rotorTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const targetPulseTimelineRef = useRef<gsap.core.Animation | null>(null)
  const hoverTimelineRef = useRef<gsap.core.Tween | null>(null)
  const geometryRef = useRef<FlightGeometry | null>(null)
  const progressRef = useRef(0)
  const settleFlightRef = useRef<(() => void) | null>(null)
  const removeViewportListenersRef = useRef<(() => void) | null>(null)
  const phaseRef = useRef<DroneAssignmentAnimationPhase>('IDLE')
  const [phase, setPhaseState] = useState<DroneAssignmentAnimationPhase>('IDLE')

  const setPhase = useCallback((next: DroneAssignmentAnimationPhase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const clearViewportListeners = useCallback(() => {
    removeViewportListenersRef.current?.()
    removeViewportListenersRef.current = null
  }, [])

  const stopRotors = useCallback(() => {
    rotorTimelineRef.current?.kill()
    rotorTimelineRef.current = null
    if (overlayRef.current) {
      gsap.set(overlayRef.current.querySelectorAll('.mg-drone-propeller'), {
        clearProps: 'rotation',
      })
    }
  }, [])

  const stopTargetPulse = useCallback(() => {
    targetPulseTimelineRef.current?.kill()
    targetPulseTimelineRef.current = null
    const pulseRings = targetRef.current?.querySelectorAll('.mg-drone-target-pulse')
    if (pulseRings?.length) {
      gsap.set(pulseRings, { clearProps: 'transform,opacity,visibility' })
    }
  }, [])

  const finishFlight = useCallback(() => {
    const settle = settleFlightRef.current
    settleFlightRef.current = null
    settle?.()
  }, [])

  const reset = useCallback(() => {
    timelineRef.current?.kill()
    timelineRef.current = null
    hoverTimelineRef.current?.kill()
    hoverTimelineRef.current = null
    stopRotors()
    stopTargetPulse()
    clearViewportListeners()
    finishFlight()
    if (overlayRef.current) {
      gsap.set(overlayRef.current, {
        autoAlpha: 0,
        clearProps: 'transform,willChange',
      })
    }
    setPhase('IDLE')
  }, [clearViewportListeners, finishFlight, setPhase, stopRotors, stopTargetPulse])

  const cancel = useCallback(() => {
    timelineRef.current?.kill()
    timelineRef.current = null
    hoverTimelineRef.current?.kill()
    hoverTimelineRef.current = null
    stopRotors()
    stopTargetPulse()
    clearViewportListeners()
    finishFlight()
    if (overlayRef.current) {
      gsap.set(overlayRef.current, {
        autoAlpha: 0,
        clearProps: 'transform,willChange',
      })
    }
    phaseRef.current = 'IDLE'
  }, [clearViewportListeners, finishFlight, stopRotors, stopTargetPulse])

  const { contextSafe } = useGSAP(
    () => () => {
      timelineRef.current?.kill()
      hoverTimelineRef.current?.kill()
      rotorTimelineRef.current?.kill()
      targetPulseTimelineRef.current?.kill()
      clearViewportListeners()
      finishFlight()
    },
    { scope: scopeRef },
  )

  const awaitConfirmation = contextSafe(() => {
    if (phaseRef.current === 'ROLLING_BACK' || phaseRef.current === 'ERROR') return
    setPhase('AWAITING_CONFIRMATION')
    const overlay = overlayRef.current
    if (!overlay || reducedMotionEnabled()) return
    hoverTimelineRef.current?.kill()
    hoverTimelineRef.current = gsap.to(overlay, {
      y: '-=3',
      duration: 0.62,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  })

  const flyToTarget = contextSafe(
    (
      sourceElement: HTMLElement | null,
      targetElement: HTMLElement | null,
      onArrival: () => void,
    ) => {
      const overlay = overlayRef.current
      setPhase('PREPARING')
      if (!overlay || !sourceElement || !targetElement || reducedMotionEnabled()) {
        setPhase('FLYING')
        onArrival()
        return Promise.resolve()
      }

      timelineRef.current?.kill()
      hoverTimelineRef.current?.kill()
      clearViewportListeners()
      geometryRef.current = {
        source: sourceElement,
        target: targetElement,
        start: centerOf(sourceElement),
        end: centerOf(targetElement),
      }
      const targetPulseRings = targetElement.querySelectorAll('.mg-drone-target-pulse')
      if (targetPulseRings.length) {
        targetPulseTimelineRef.current = gsap.fromTo(
          targetPulseRings,
          { scale: 0.35, autoAlpha: 0.55 },
          {
            scale: 1.65,
            autoAlpha: 0,
            duration: 1.15,
            stagger: 0.48,
            repeat: -1,
            ease: 'power2.out',
          },
        )
      }
      progressRef.current = 0

      const pointAt = (progress: number): Point => {
        const geometry = geometryRef.current
        if (!geometry) return { x: 0, y: 0 }
        const { start, end } = geometry
        const arc = Math.max(34, Math.min(78, Math.abs(end.x - start.x) * 0.15))
        const control = {
          x: (start.x + end.x) / 2,
          y: Math.min(start.y, end.y) - arc,
        }
        const inverse = 1 - progress
        return {
          x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
          y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
        }
      }

      const renderFlightFrame = () => {
        const progress = progressRef.current
        const point = pointAt(progress)
        const scale =
          progress < 0.4
            ? 0.58 + (progress / 0.4) * 0.46
            : progress < 0.8
              ? 1.04 - ((progress - 0.4) / 0.4) * 0.28
              : 0.76 - ((progress - 0.8) / 0.2) * 0.2
        const rotation = progress < 0.5 ? -8 + progress * 32 : 8 - (progress - 0.5) * 16
        gsap.set(overlay, { x: point.x, y: point.y, scale, rotation })
      }

      const reposition = () => {
        const geometry = geometryRef.current
        if (!geometry?.source.isConnected || !geometry.target.isConnected) return
        geometry.start = centerOf(geometry.source)
        geometry.end = centerOf(geometry.target)
        renderFlightFrame()
      }
      window.addEventListener('resize', reposition, { passive: true })
      window.addEventListener('scroll', reposition, { passive: true, capture: true })
      removeViewportListenersRef.current = () => {
        window.removeEventListener('resize', reposition)
        window.removeEventListener('scroll', reposition, true)
      }

      const start = geometryRef.current.start
      gsap.set(overlay, {
        x: start.x,
        y: start.y,
        xPercent: -50,
        yPercent: -50,
        scale: 0.58,
        rotation: -8,
        autoAlpha: 0,
        willChange: 'transform,opacity',
      })
      const propellers = overlay.querySelectorAll('.mg-drone-propeller')
      rotorTimelineRef.current = gsap.timeline().to(propellers, {
        rotation: (index) => (index % 2 === 0 ? 360 : -360),
        transformOrigin: '50% 50%',
        duration: 0.14,
        repeat: -1,
        ease: 'none',
        stagger: 0,
      })

      let resolveFlight!: () => void
      const flightPromise = new Promise<void>((resolve) => {
        resolveFlight = resolve
      })
      settleFlightRef.current = resolveFlight
      const proxy = { progress: 0 }
      const flightTimeline = gsap.timeline({
        onComplete: () => {
          timelineRef.current = null
          clearViewportListeners()
          onArrival()
          finishFlight()
        },
        onInterrupt: () => {
          if (timelineRef.current === flightTimeline) timelineRef.current = null
          clearViewportListeners()
          finishFlight()
        },
      })
      timelineRef.current = flightTimeline
      flightTimeline
        .to(overlay, { autoAlpha: 1, duration: 0.08, ease: 'power1.out' })
        .to(
          overlay,
          {
            y: '-=6',
            scale: 0.68,
            duration: 0.18,
            ease: 'power2.out',
            onComplete: () => setPhase('FLYING'),
          },
          '<',
        )
        .to(proxy, {
          progress: 1,
          duration: 0.98,
          ease: 'power3.inOut',
          onUpdate: () => {
            progressRef.current = proxy.progress
            renderFlightFrame()
          },
        })
      return flightPromise
    },
  )

  const land = contextSafe(() => {
    const overlay = overlayRef.current
    const target = targetRef.current
    hoverTimelineRef.current?.kill()
    hoverTimelineRef.current = null
    stopRotors()
    stopTargetPulse()
    setPhase('LANDING')
    if (!overlay || reducedMotionEnabled()) {
      if (overlay) gsap.set(overlay, { autoAlpha: 0 })
      setPhase('SUCCESS')
      return Promise.resolve()
    }

    const pulseRings = target?.querySelectorAll('.mg-drone-target-pulse')
    return new Promise<void>((resolve) => {
      const landingTimeline = gsap.timeline({
        onComplete: () => {
          timelineRef.current = null
          gsap.set(overlay, { autoAlpha: 0, clearProps: 'willChange' })
          setPhase('SUCCESS')
          resolve()
        },
      })
      timelineRef.current = landingTimeline
      landingTimeline
        .to(overlay, {
          scale: 0.52,
          rotation: 0,
          y: '+=2',
          duration: 0.2,
          ease: 'power2.in',
        })
        .to(overlay, { autoAlpha: 0, duration: 0.16, ease: 'power1.out' }, '-=0.04')
      if (pulseRings?.length) {
        landingTimeline.fromTo(
          pulseRings,
          { scale: 0.35, autoAlpha: 0.8 },
          {
            scale: 1.8,
            autoAlpha: 0,
            duration: 0.54,
            stagger: 0.08,
            ease: 'power2.out',
          },
          '-=0.28',
        )
      }
    })
  })

  const rollback = contextSafe(() => {
    const overlay = overlayRef.current
    const source = geometryRef.current?.source
    timelineRef.current?.kill()
    timelineRef.current = null
    hoverTimelineRef.current?.kill()
    hoverTimelineRef.current = null
    clearViewportListeners()
    stopRotors()
    stopTargetPulse()
    setPhase('ROLLING_BACK')
    if (!overlay || !source || reducedMotionEnabled()) {
      if (overlay) gsap.set(overlay, { autoAlpha: 0 })
      setPhase('ERROR')
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      timelineRef.current = gsap.to(overlay, {
        x: centerOf(source).x,
        y: centerOf(source).y,
        scale: 0.58,
        rotation: -8,
        autoAlpha: 0,
        duration: 0.34,
        ease: 'power2.inOut',
        onComplete: () => {
          timelineRef.current = null
          setPhase('ERROR')
          resolve()
        },
      })
    })
  })

  return {
    overlayRef,
    targetRef,
    phase,
    flyToTarget,
    awaitConfirmation,
    land,
    rollback,
    reset,
    cancel,
  }
}
