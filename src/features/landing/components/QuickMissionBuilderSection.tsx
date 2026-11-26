import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'

export type BuilderOption = {
  id: string
  label: string
  detail: string
}

type Props = {
  eyebrow: string
  heading: string
  subtitle: string
  serviceStepLabel: string
  scaleStepLabel: string
  deliverableStepLabel: string
  services: readonly BuilderOption[]
  scales: readonly BuilderOption[]
  deliverables: readonly BuilderOption[]
  briefHeaderLabel: string
  briefServiceLabel: string
  briefScaleLabel: string
  briefDeliverablesLabel: string
  briefGatesLabel: string
  briefGates: readonly string[]
  briefNote: string
  ctaLabel: string
  ctaHref: string
}

/**
 * Interactive 3-step Mission Brief Configurator allowing visitors to assemble a
 * realistic monitoring scope right on the landing page before entering Create Request.
 */
export function QuickMissionBuilderSection({
  eyebrow,
  heading,
  subtitle,
  serviceStepLabel,
  scaleStepLabel,
  deliverableStepLabel,
  services,
  scales,
  deliverables,
  briefHeaderLabel,
  briefServiceLabel,
  briefScaleLabel,
  briefDeliverablesLabel,
  briefGatesLabel,
  briefGates,
  briefNote,
  ctaLabel,
  ctaHref,
}: Props) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [scaleId, setScaleId] = useState(scales[1]?.id ?? scales[0]?.id ?? '')
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>(() =>
    deliverables.slice(0, 2).map((d) => d.id),
  )

  const activeService = services.find((s) => s.id === serviceId) ?? services[0]
  const activeScale = scales.find((s) => s.id === scaleId) ?? scales[0]
  const activeDeliverables = deliverables.filter((d) =>
    selectedDeliverables.includes(d.id),
  )

  const toggleDeliverable = (id: string) => {
    setSelectedDeliverables((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev
      }
      return [...prev, id]
    })
  }

  return (
    <section
      id="mission-builder"
      className="lp3-builder"
      aria-labelledby="lp3-builder-heading"
    >
      <div className="lpx-container">
        <div className="lp3-builder-head">
          <div>
            <div className="lpx-section-eyebrow lpx-section-eyebrow--dark">
              {eyebrow}
            </div>
            <h2
              id="lp3-builder-heading"
              className="lpx-section-title lpx-section-title--light"
            >
              {heading}
            </h2>
          </div>
          <p className="lp3-builder-sub">{subtitle}</p>
        </div>

        <div className="lp3-builder-grid">
          <div className="lp3-builder-controls">
            <div className="lp3-builder-group">
              <div className="lp3-builder-group-label">{serviceStepLabel}</div>
              <div className="lp3-builder-chips is-two-col">
                {services.map((item) => {
                  const selected = item.id === activeService?.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`lp3-choice-card${selected ? ' is-active' : ''}`}
                      aria-pressed={selected}
                      onClick={() => setServiceId(item.id)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="lp3-builder-group">
              <div className="lp3-builder-group-label">{scaleStepLabel}</div>
              <div className="lp3-builder-chips is-three-col">
                {scales.map((item) => {
                  const selected = item.id === activeScale?.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`lp3-choice-pill${selected ? ' is-active' : ''}`}
                      aria-pressed={selected}
                      onClick={() => setScaleId(item.id)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="lp3-builder-group">
              <div className="lp3-builder-group-label">
                {deliverableStepLabel}
              </div>
              <div className="lp3-builder-chips is-two-col">
                {deliverables.map((item) => {
                  const selected = selectedDeliverables.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`lp3-choice-check${selected ? ' is-active' : ''}`}
                      aria-pressed={selected}
                      onClick={() => toggleDeliverable(item.id)}
                    >
                      <span className="lp3-choice-box" aria-hidden="true">
                        {selected ? <Icon name="check" /> : null}
                      </span>
                      <span className="lp3-choice-check-copy">
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="lp3-brief-card" aria-live="polite">
            <div className="lp3-brief-top">
              <span className="lp3-brief-dot" aria-hidden="true" />
              <span className="lp3-brief-kicker">{briefHeaderLabel}</span>
            </div>

            <dl className="lp3-brief-facts">
              <div>
                <dt>{briefServiceLabel}</dt>
                <dd>{activeService?.label}</dd>
              </div>
              <div>
                <dt>{briefScaleLabel}</dt>
                <dd>
                  {activeScale?.label} · {activeScale?.detail}
                </dd>
              </div>
              <div>
                <dt>{briefDeliverablesLabel}</dt>
                <dd>
                  <ul className="lp3-brief-tags">
                    {activeDeliverables.map((d) => (
                      <li key={d.id}>{d.label}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            <div className="lp3-brief-gates">
              <div className="lp3-brief-gates-title">{briefGatesLabel}</div>
              <ol>
                {briefGates.map((gate) => (
                  <li key={gate}>
                    <span className="lp3-brief-gate-dot" aria-hidden="true" />
                    <span>{gate}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="lp3-brief-note">{briefNote}</p>

            <a className="lpx-cta-mint lp3-brief-cta" href={ctaHref}>
              <span>{ctaLabel}</span>
              <Icon name="arrow-up-right" className="lpx-cta-icon" />
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}
