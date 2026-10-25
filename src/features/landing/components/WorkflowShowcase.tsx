import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { landingMessages } from '../content'
import { mediaSource } from '../media'
import { workflowIcons } from '../presentation'
import { journeyStages } from '../showcase/journey'
import { useJourneyPlayback } from '../showcase/useJourneyPlayback'
import { productMessages } from './productMessages'
import { useViewportActivity } from './useViewportActivity'
import { ScrollReveal } from './ScrollReveal'

export function WorkflowShowcase() {
  const { t } = useI18n(landingMessages)
  const { t: copy } = useI18n(productMessages)
  const ref = useRef<HTMLDivElement>(null)
  const active = useViewportActivity(ref)
  const playback = useJourneyPlayback(Boolean(useReducedMotion()))
  const { setInView } = playback
  useEffect(() => setInView(active), [active, setInView])

  return (
    <div
      className="lp-workflow-grid"
      ref={ref}
      data-media-motion={playback.isPlaying}
    >
      {t.workflowSteps.map((step, index) => (
        <ScrollReveal key={step.no} delay={index * 0.07}>
          <article
            className="lp-workflow-card"
            aria-current={
              playback.stage === journeyStages[index] ? 'step' : undefined
            }
          >
            <button
              className="lp-workflow-select"
              type="button"
              aria-pressed={playback.stage === journeyStages[index]}
              onClick={() => playback.select(journeyStages[index])}
              onFocus={(event) => {
                if (event.target.matches(':focus-visible')) playback.hold()
              }}
              onBlur={playback.release}
            >
              <span className="lp-workflow-card-top">
                <span>{step.no}</span>
                <span className="lp-step-icon">
                  <Icon name={workflowIcons[index]} />
                </span>
              </span>
              <span
                className={`lp-workflow-art lp-workflow-art--${index}`}
                aria-hidden="true"
              >
                {index === 0 && (
                  <span className="lp-mini-form">
                    <span className="lp-mini-browser">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="lp-mini-field">
                      <Icon name="map-pin" />
                      <span>
                        <small>{copy.visual.area}</small>
                        <b>{copy.visual.site}</b>
                      </span>
                    </span>
                    <span className="lp-mini-field">
                      <Icon name="clipboard" />
                      <b>{copy.visual.objective}</b>
                    </span>
                    <span className="lp-mini-submit">
                      <Icon name="arrow-right" />
                    </span>
                  </span>
                )}
                {index === 1 && (
                  <span className="lp-mini-map">
                    <img
                      {...mediaSource('construction')}
                      sizes="280px"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <svg viewBox="0 0 280 170" preserveAspectRatio="none">
                      <path d="M45 40 215 25 240 125 65 145Z" />
                      <circle cx="45" cy="40" r="4" />
                      <circle cx="215" cy="25" r="4" />
                      <circle cx="240" cy="125" r="4" />
                      <circle cx="65" cy="145" r="4" />
                    </svg>
                    <span className="lp-mini-confirm">
                      <Icon name="check" />
                      {copy.visual.scopeConfirmed}
                    </span>
                  </span>
                )}
                {index === 2 && (
                  <span className="lp-mini-timeline">
                    {[
                      copy.visual.scopeConfirmed,
                      copy.visual.inspection,
                      copy.visual.reportPending,
                    ].map((label, i) => (
                      <span key={i}>
                        <i>
                          <Icon
                            name={
                              i === 0
                                ? 'check'
                                : i === 1
                                  ? 'camera'
                                  : 'file-text'
                            }
                          />
                        </i>
                        <b>{label}</b>
                      </span>
                    ))}
                  </span>
                )}
                {index === 3 && (
                  <span className="lp-mini-report">
                    <span>
                      <Icon name="file-text" />
                      <b>{copy.visual.reportTitle}</b>
                    </span>
                    <span className="lp-mini-report-photo">
                      <img
                        {...mediaSource('construction')}
                        sizes="220px"
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <i />
                    </span>
                    <span className="lp-mini-report-caption">
                      <Icon name="check" />
                      {copy.visual.images} · {copy.visual.notes}
                    </span>
                  </span>
                )}
              </span>
              <span className="lp-workflow-title">{step.title}</span>
            </button>
            <p>{step.detail}</p>
          </article>
        </ScrollReveal>
      ))}
    </div>
  )
}
