import { useEffect, useState } from 'react'

export type AudioReactiveSnapshot = {
  /** Normalized amplitude in [0, 1]. */
  level: number
  /** Mouth openness in [0, 1] driven by real audio RMS when available. */
  mouthOpen: number
  /** True when live AnalyserNode samples are driving the animation. */
  isRealAudio: boolean
}

/**
 * Samples live Web Audio AnalyserNode RMS amplitude to drive mouth openness,
 * cyan aura glow, and sound-wave height. Falls back to a gentle rhythmic speaking
 * pulse only when playback is active without an AnalyserNode.
 * Never claims phoneme-accurate lip synchronization.
 */
export function useAudioReactiveLevel(
  analyser: AnalyserNode | null | undefined,
  active: boolean,
  enabled: boolean,
): AudioReactiveSnapshot {
  const [snapshot, setSnapshot] = useState<AudioReactiveSnapshot>({
    level: 0,
    mouthOpen: 0,
    isRealAudio: false,
  })

  useEffect(() => {
    if (!active || !enabled) {
      setSnapshot({ level: 0, mouthOpen: 0, isRealAudio: false })
      return
    }

    let rafId = 0
    let running = true
    let smoothed = 0
    let lastEmit = 0
    const samples = analyser ? new Uint8Array(analyser.fftSize) : null

    const tick = (now: number) => {
      if (!running) return

      let raw = 0
      let isReal = false
      if (analyser && samples) {
        analyser.getByteTimeDomainData(samples)
        let squared = 0
        for (let i = 0; i < samples.length; i += 1) {
          const amp = (samples[i] - 128) / 128
          squared += amp * amp
        }
        const rms = Math.sqrt(squared / samples.length)
        raw = Math.min(1, Math.max(0, (rms - 0.01) * 4.4))
        isReal = true
      } else {
        // Gentle playback-state cadence when AudioContext/AnalyserNode is unavailable.
        raw = 0.35 + 0.35 * Math.abs(Math.sin(now * 0.0085)) * Math.abs(Math.cos(now * 0.0042))
      }

      smoothed = smoothed * 0.68 + raw * 0.32

      // Throttle React state updates to ~24fps to stay well inside the performance budget.
      if (now - lastEmit >= 42) {
        lastEmit = now
        setSnapshot({
          level: Number(smoothed.toFixed(2)),
          mouthOpen: Number(Math.min(1, smoothed * 1.15).toFixed(2)),
          isRealAudio: isReal,
        })
      }
      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => {
      running = false
      window.cancelAnimationFrame(rafId)
    }
  }, [analyser, active, enabled])

  return snapshot
}
