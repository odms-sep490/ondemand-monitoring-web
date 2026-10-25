import { copy } from './cockpitCopy'
import { Ico } from './CockpitIcon'
import type { CockpitLayout } from './cockpitTypes'
import type { Dispatch, SetStateAction } from 'react'

export function CockpitHeader({
  c,
  missionLabel,
  roleLabel,
  online,
  liveLabel,
  clock,
  batteryTone,
  battery,
  gpsText,
  onStartFlight,
  canStartFlight,
  language,
  busy,
  startingFlight,
  layout,
  setLayout,
  onReview,
  toggleFullscreen,
}: {
  c: (typeof copy)['vi' | 'en']
  missionLabel: string
  roleLabel: string
  online: boolean
  liveLabel: string
  clock: string
  batteryTone: 'ok' | 'low' | 'mid'
  battery: number | null
  gpsText: string
  onStartFlight: (() => void) | undefined
  canStartFlight: boolean
  language: 'vi' | 'en'
  busy: boolean
  startingFlight: boolean
  layout: CockpitLayout
  setLayout: Dispatch<SetStateAction<CockpitLayout>>
  onReview: () => void
  toggleFullscreen: () => void
}) {
  return (
    <header className="fc-header">
      <div className="fc-brand">
        <span className="fc-brand__logo">
          <Ico name="drone" size={26} />
        </span>
        <div>
          <strong>{c.brand}</strong>
          <small>{c.brandSub}</small>
        </div>
      </div>

      <div className="fc-header__group">
        <div className="fc-mission">
          <strong>{missionLabel}</strong>
          <small>{roleLabel}</small>
        </div>
        <span className={`fc-live ${online ? 'is-on' : 'is-off'}`}>
          {liveLabel}
        </span>
        <div className="fc-clock">
          <strong>{clock}</strong>
          <small>{c.flightTime}</small>
        </div>
      </div>

      <div className="fc-header__group">
        <div className={`fc-chip ${online ? 'is-ok' : 'is-bad'}`}>
          <Ico name="link" size={20} />
          <div>
            <strong>{c.link}</strong>
            <small>{online ? c.linkOk : c.linkOff}</small>
          </div>
        </div>
        <div
          className={`fc-chip is-${batteryTone === 'ok' ? 'ok' : batteryTone === 'mid' ? 'warn' : 'bad'}`}
        >
          <Ico name="battery" size={20} />
          <div>
            <strong>
              {battery === null ? '--' : `${Math.round(battery)}%`}
            </strong>
            <small>{c.battery}</small>
          </div>
        </div>
        <div className="fc-chip is-info fc-chip--gps">
          <Ico name="pin" size={20} />
          <div>
            <strong className="fc-mono">{gpsText}</strong>
            <small>GPS</small>
          </div>
        </div>
      </div>

      <div className="fc-header__actions">
        {onStartFlight && canStartFlight ? (
          <button
            type="button"
            className="fc-start-flight fc-start-flight--header"
            aria-label={
              language === 'en' ? 'Start flight' : 'Bắt đầu chuyến bay'
            }
            disabled={busy || startingFlight}
            onClick={onStartFlight}
          >
            <Ico name="takeoff" size={19} />
            <span>
              <strong>
                {startingFlight
                  ? language === 'en'
                    ? 'Starting...'
                    : 'Đang bắt đầu...'
                  : language === 'en'
                    ? 'Start flight'
                    : 'Bắt đầu chuyến bay'}
              </strong>
              <small>
                {language === 'en' ? 'Set In flight' : 'Đổi sang Đang bay'}
              </small>
            </span>
          </button>
        ) : null}
        <div className="fc-seg" role="group" aria-label={c.layout}>
          {(
            [
              ['split', c.layoutSplit],
              ['camera', c.layoutCamera],
              ['map', c.layoutMap],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={layout === key ? 'is-active' : ''}
              aria-pressed={layout === key}
              onClick={() => setLayout(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="fc-ghost"
          onClick={onReview}
          disabled={busy}
        >
          <Ico name="review" /> {c.review}
        </button>
        <button
          type="button"
          className="fc-icon-btn"
          onClick={toggleFullscreen}
          aria-label={c.fullscreen}
          title={c.fullscreen}
        >
          <Ico name="expand" />
        </button>
      </div>
    </header>
  )
}
