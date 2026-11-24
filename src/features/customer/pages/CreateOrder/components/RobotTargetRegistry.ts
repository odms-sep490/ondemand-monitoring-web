import { useCallback, useRef } from 'react'
import type { AIMascotPointDirection, RobotGazeVector } from './AIRobotAnimationController'

export type RobotTargetId =
  | 'services'
  | 'purpose'
  | 'description'
  | 'map'
  | 'calendar'
  | 'checklist'
  | 'contact'
  | 'review'
  | 'draft'
  | 'composer'

export type MeasuredTarget = {
  id: RobotTargetId
  rect: DOMRect
  visible: boolean
}

export type TargetDirectionResult = {
  direction: AIMascotPointDirection
  gaze: RobotGazeVector
  visible: boolean
}

function isRectInViewport(rect: DOMRect): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false
  if (typeof window === 'undefined') return false
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  )
}

/**
 * Computes relative gaze & pointing direction from a robot element toward a registered UI target.
 * Never returns a gesture toward an offscreen target.
 */
export function computeTargetDirection(
  robotRect: DOMRect | null,
  targetRect: DOMRect | null,
): TargetDirectionResult {
  if (!robotRect || !targetRect || !isRectInViewport(targetRect)) {
    return { direction: 'down', gaze: { x: 0, y: 0 }, visible: false }
  }
  const robotCx = robotRect.left + robotRect.width / 2
  const robotCy = robotRect.top + robotRect.height / 2
  const targetCx = targetRect.left + targetRect.width / 2
  const targetCy = targetRect.top + targetRect.height / 2

  const dx = targetCx - robotCx
  const dy = targetCy - robotCy
  const norm = Math.hypot(dx, dy) || 1
  const gaze: RobotGazeVector = {
    x: Math.max(-1, Math.min(1, dx / Math.max(220, norm))),
    y: Math.max(-1, Math.min(1, dy / Math.max(220, norm))),
  }

  let direction: AIMascotPointDirection = 'down'
  if (Math.abs(dx) > Math.abs(dy) * 0.95) {
    direction = dx < 0 ? 'left' : 'right'
  }
  return { direction, gaze, visible: true }
}

/**
 * Registry of live UI target elements so the robot can look at or gesture toward
 * real services, calendars, maps, description boxes, and the Draft summary without hardcoded coords.
 */
export function useRobotTargetRegistry() {
  const targetsRef = useRef<Map<RobotTargetId, HTMLElement>>(new Map())

  const registerTarget = useCallback((id: RobotTargetId, node: HTMLElement | null) => {
    if (node) {
      targetsRef.current.set(id, node)
    } else {
      targetsRef.current.delete(id)
    }
  }, [])

  const measureTarget = useCallback((id: RobotTargetId): MeasuredTarget | null => {
    const el = targetsRef.current.get(id)
    if (!el || !el.isConnected) return null
    const rect = el.getBoundingClientRect()
    return { id, rect, visible: isRectInViewport(rect) }
  }, [])

  const getTargetDirection = useCallback(
    (robotNode: HTMLElement | null, targetId: RobotTargetId | null): TargetDirectionResult => {
      if (!robotNode || !targetId) {
        return { direction: 'down', gaze: { x: 0, y: 0 }, visible: false }
      }
      const target = measureTarget(targetId)
      if (!target || !target.visible) {
        return { direction: 'down', gaze: { x: 0, y: 0 }, visible: false }
      }
      return computeTargetDirection(robotNode.getBoundingClientRect(), target.rect)
    },
    [measureTarget],
  )

  return { registerTarget, measureTarget, getTargetDirection }
}
