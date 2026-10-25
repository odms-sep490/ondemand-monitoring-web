import { useCallback, useEffect, useRef, useState } from 'react'

import {
  journeyDuration,
  nextJourneyStage,
  type JourneyStageId,
} from './journey'

export function useJourneyPlayback(reducedMotion: boolean) {
  const [selection, setSelection] = useState(0)
  const [stage, setStage] = useState<JourneyStageId>('request')
  const intent = reducedMotion ? 'paused' : 'playing'
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(
    () => document.visibilityState === 'visible',
  )
  const [interactionHeld, setInteractionHeld] = useState(false)
  const remaining = useRef(journeyDuration.request)
  const startedAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  const clear = useCallback(() => {
    if (timer.current !== undefined) {
      remaining.current = Math.max(
        0,
        remaining.current - (Date.now() - startedAt.current),
      )
      window.clearTimeout(timer.current)
    }
    timer.current = undefined
  }, [])

  const select = useCallback(
    (next: JourneyStageId) => {
      clear()
      setStage(next)
      setSelection((value) => value + 1)
      remaining.current = journeyDuration[next]
    },
    [clear],
  )

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (
      intent !== 'playing' ||
      !inView ||
      !visible ||
      interactionHeld ||
      reducedMotion
    ) {
      clear()
      return
    }
    startedAt.current = Date.now()
    timer.current = window.setTimeout(() => {
      timer.current = undefined
      const next = nextJourneyStage(stage)
      remaining.current = journeyDuration[next]
      setStage(next)
    }, remaining.current)
    return clear
  }, [
    clear,
    inView,
    intent,
    interactionHeld,
    reducedMotion,
    stage,
    visible,
    selection,
  ])

  useEffect(() => {
    clear()
    if (reducedMotion)
      setStage((current) => (current === 'request' ? 'report' : current))
  }, [clear, reducedMotion])

  return {
    stage,
    intent,
    isPlaying:
      intent === 'playing' &&
      inView &&
      visible &&
      !interactionHeld &&
      !reducedMotion,
    inView,
    setInView,
    select,
    hold: () => setInteractionHeld(true),
    release: () => setInteractionHeld(false),
  }
}
