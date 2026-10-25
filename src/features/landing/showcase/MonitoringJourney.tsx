import { useEffect, useRef, useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { journeyStages, type JourneyStageId } from './journey'
import { journeyMessages } from './messages'
import { useJourneyPlayback } from './useJourneyPlayback'
import { InspectionMedia } from '../components/InspectionMedia'

export function MonitoringJourney() {
  const { t } = useI18n(journeyMessages)
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const playback = useJourneyPlayback(reduced)
  const stageCopy = t.stages[playback.stage]
  const select = (id: JourneyStageId) => playback.select(id)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const target = ref.current
    if (!target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="lp-journey"
      ref={ref}
      aria-labelledby="lp-journey-title"
      data-media-motion={playback.isPlaying}
    >
      <InViewBridge value={visible} onChange={playback.setInView} />
      <div className="lp-journey-heading">
        <span className="lp-demo-label">
          <i />
          {t.illustrative}
        </span>
        <h2 id="lp-journey-title">{t.title}</h2>
      </div>
      <div className="lp-journey-shell">
        <div className="lp-journey-topbar">
          <span className="lp-journey-brand">
            <i /> OnDemand Monitor
          </span>
          <span className="lp-request-code">REQ-2026-0142</span>
          <span className="lp-journey-status">{stageCopy}</span>
        </div>
        <div className="lp-journey-layout">
          <div className="lp-journey-media" data-stage={playback.stage}>
            <InspectionMedia
              eager
              variant={
                playback.stage === 'inspection'
                  ? 'inspection'
                  : playback.stage === 'report'
                    ? 'report'
                    : playback.stage === 'request'
                      ? 'request'
                      : 'area'
              }
            />
          </div>
          <div className="lp-journey-scene" aria-live="off">
            <div
              className="lp-scene-request"
              data-active={playback.stage === 'request'}
              aria-hidden={playback.stage !== 'request'}
            >
              <div className="lp-scene-title">
                <span className="lp-scene-icon">
                  <Icon name="clipboard" />
                </span>
                <div>
                  <small>{t.requestTitle}</small>
                  <h3>{t.requestTitle}</h3>
                </div>
              </div>
              <div className="lp-scene-fields">
                <div>
                  <small>{t.location}</small>
                  <strong>{t.locationValue}</strong>
                </div>
                <div>
                  <small>{t.objective}</small>
                  <strong>{t.objectiveValue}</strong>
                </div>
                <div>
                  <small>{t.window}</small>
                  <strong>{t.windowValue}</strong>
                </div>
                <div className="lp-scene-note">
                  <small>{t.summary}</small>
                  <strong>{t.objectiveValue}</strong>
                </div>
              </div>
            </div>
            <div
              className="lp-scene-checklist"
              data-active={playback.stage === 'scope'}
              aria-hidden={playback.stage !== 'scope'}
            >
              <span className="lp-scene-icon">
                <Icon name="shield" />
              </span>
              <div>
                <small>{t.illustrative}</small>
                <h3>{t.scopeTitle}</h3>
                <ul>
                  {t.checklist.map((line, i) => (
                    <li key={i}>
                      <Icon name="check" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div
              className="lp-scene-progress"
              data-active={playback.stage === 'inspection'}
              aria-hidden={playback.stage !== 'inspection'}
            >
              <div>
                <small>{t.illustrative}</small>
                <h3>{t.progressTitle}</h3>
                <ol>
                  {journeyStages.map((id, i) => (
                    <li className={i < 3 ? 'is-complete' : ''} key={id}>
                      <span>{i < 2 ? <Icon name="check" /> : i + 1}</span>
                      <b>{t.stages[id]}</b>
                    </li>
                  ))}
                </ol>
              </div>
              <aside>
                <Icon name="activity" />
                <strong>{t.update}</strong>
                <p>{t.updateCopy}</p>
              </aside>
            </div>
            <div
              className="lp-scene-report"
              data-active={playback.stage === 'report'}
              aria-hidden={playback.stage !== 'report'}
            >
              <div className="lp-report-content">
                <span className="lp-report-ready">
                  <Icon name="check" /> {t.illustrative}
                </span>
                <h3>{t.reportTitle}</h3>
                <p>{t.reportCopy}</p>
                <div className="lp-finding">
                  <Icon name="camera" />
                  <span>
                    <strong>{t.finding}</strong>
                    <small>{t.findingCopy}</small>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-journey-controls">
          <div
            className="lp-stage-selectors"
            aria-label={t.title}
            onFocusCapture={(event) => {
              if (event.target.matches(':focus-visible')) playback.hold()
            }}
            onBlurCapture={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                playback.release()
            }}
          >
            {journeyStages.map((id) => (
              <button
                type="button"
                key={id}
                aria-pressed={playback.stage === id}
                onClick={() => select(id)}
              >
                {t.stages[id]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function InViewBridge({
  value,
  onChange,
}: {
  value: boolean
  onChange: (value: boolean) => void
}) {
  useEffect(() => onChange(value), [onChange, value])
  return null
}
