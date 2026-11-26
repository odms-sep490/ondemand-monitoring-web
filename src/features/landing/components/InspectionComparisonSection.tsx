import { useRef, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'

export type ComparisonRow = {
  aspect: string
  manual: string
  odm: string
}

type Props = {
  eyebrow: string
  heading: string
  subtitle: string
  manualHeading: string
  odmHeading: string
  rows: readonly ComparisonRow[]
  sliderLeftLabel: string
  sliderRightLabel: string
  sliderHint: string
  sliderAriaLabel: string
  overlayZones: readonly { code: string; label: string; x: number; y: number }[]
  imageAlt: string
}

/**
 * Problem -> Solution editorial band pairing a clear Manual vs. OnDemand Monitor
 * comparison with an interactive draggable aerial before/after inspection curtain.
 */
export function InspectionComparisonSection({
  eyebrow,
  heading,
  subtitle,
  manualHeading,
  odmHeading,
  rows,
  sliderLeftLabel,
  sliderRightLabel,
  sliderHint,
  sliderAriaLabel,
  overlayZones,
  imageAlt,
}: Props) {
  const [position, setPosition] = useState(54)
  const stageRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const updateFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.round(Math.min(88, Math.max(12, pct))))
  }

  return (
    <section
      id="comparison"
      className="lp3-compare"
      aria-labelledby="lp3-compare-heading"
    >
      <div className="lpx-container">
        <div className="lp3-compare-head">
          <div>
            <div className="lpx-section-eyebrow lpx-section-eyebrow--light">
              {eyebrow}
            </div>
            <h2
              id="lp3-compare-heading"
              className="lpx-section-title lpx-section-title--dark"
            >
              {heading}
            </h2>
          </div>
          <p className="lp3-compare-sub">{subtitle}</p>
        </div>

        <div className="lp3-compare-grid">
          <div className="lp3-compare-table" role="region" aria-label={heading}>
            <div className="lp3-compare-table-head">
              <span />
              <span className="lp3-compare-col-manual">{manualHeading}</span>
              <span className="lp3-compare-col-odm">{odmHeading}</span>
            </div>
            {rows.map((row) => (
              <div key={row.aspect} className="lp3-compare-row">
                <strong className="lp3-compare-aspect">{row.aspect}</strong>
                <span className="lp3-compare-cell is-manual">{row.manual}</span>
                <span className="lp3-compare-cell is-odm">
                  <Icon name="check" className="lp3-compare-check" />
                  <span>{row.odm}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="lp3-curtain-wrap">
            <div
              ref={stageRef}
              className="lp3-curtain-stage"
              onPointerDown={(e) => {
                draggingRef.current = true
                e.currentTarget.setPointerCapture(e.pointerId)
                updateFromClientX(e.clientX)
              }}
              onPointerMove={(e) => {
                if (draggingRef.current) updateFromClientX(e.clientX)
              }}
              onPointerUp={() => {
                draggingRef.current = false
              }}
              onPointerCancel={() => {
                draggingRef.current = false
              }}
            >
              {/* Base layer: raw unannotated aerial view */}
              <img
                className="lp3-curtain-img is-raw"
                src="/images/landing/construction-1280.webp"
                alt={imageAlt}
                width={1280}
                height={800}
                loading="lazy"
                draggable={false}
              />

              {/* Clipped top layer: structured OnDemand Monitor inspection view */}
              <div
                className="lp3-curtain-overlay"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                aria-hidden="true"
              >
                <img
                  className="lp3-curtain-img is-annotated"
                  src="/images/landing/construction-1280.webp"
                  alt=""
                  width={1280}
                  height={800}
                  loading="lazy"
                  draggable={false}
                />
                <div className="lp3-curtain-grid-lines" />
                {overlayZones.map((zone) => (
                  <div
                    key={zone.code}
                    className="lp3-curtain-tag"
                    style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                  >
                    <span className="lp3-curtain-tag-dot" />
                    <b>{zone.code}</b>
                    <span>{zone.label}</span>
                  </div>
                ))}
              </div>

              <span className="lp3-curtain-badge is-left">{sliderRightLabel}</span>
              <span className="lp3-curtain-badge is-right">{sliderLeftLabel}</span>

              <div
                className="lp3-curtain-divider"
                style={{ left: `${position}%` }}
                aria-hidden="true"
              >
                <span className="lp3-curtain-knob">⇄</span>
              </div>

              <input
                type="range"
                className="lp3-curtain-range"
                min={12}
                max={88}
                value={position}
                aria-label={sliderAriaLabel}
                onChange={(e) => setPosition(Number(e.target.value))}
              />
            </div>
            <p className="lp3-curtain-hint">{sliderHint}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
