import { copy } from './cockpitCopy'
import { Ico } from './CockpitIcon'
import { AttitudeIndicator } from './AttitudeIndicator'
import { fmt } from './cockpitHelpers'
import { CompassRose } from './CompassRose'
import { Stat } from './CockpitStat'
import type { CockpitTelemetry } from './cockpitTypes'
import type { Dispatch, SetStateAction } from 'react'

export function CockpitTelemetryPanel({
  c,
  tm,
  paramsOpen,
  setParamsOpen,
  batteryTone,
  battery,
  hasGps,
}: {
  c: (typeof copy)['vi' | 'en']
  tm: CockpitTelemetry
  paramsOpen: boolean
  setParamsOpen: Dispatch<SetStateAction<boolean>>
  batteryTone: 'ok' | 'low' | 'mid'
  battery: number | null
  hasGps: boolean
}) {
  return (
    <section className="fc-panel">
      <header className="fc-panel__head">
        <span className="fc-panel__title is-bar">{c.params}</span>
        <span className="fc-panel__tools">
          <span className={`fc-badge ${tm.inAir ? 'is-ok' : 'is-mid'}`}>
            <i className="fc-dot" />
            {tm.inAir ? c.flying : c.ground}
          </span>
          <button
            type="button"
            className={`fc-collapse${paramsOpen ? '' : ' is-closed'}`}
            aria-expanded={paramsOpen}
            aria-label={paramsOpen ? c.collapse : c.expandPanel}
            title={paramsOpen ? c.collapse : c.expandPanel}
            onClick={() => setParamsOpen((open) => !open)}
          >
            <Ico name="chevron" size={18} />
          </button>
        </span>
      </header>
      {paramsOpen ? (
        <>
          <div className="fc-instruments">
            <AttitudeIndicator
              roll={tm.rollDeg ?? null}
              pitch={tm.pitchDeg ?? null}
              label={`${c.roll} ${fmt(tm.rollDeg, 0)}° · ${c.pitch} ${fmt(tm.pitchDeg, 0)}°`}
            />
            <CompassRose heading={tm.headingDeg} label={c.heading} />
          </div>
          <div className="fc-stats">
            <Stat
              icon="altitude"
              label={c.altitude}
              value={fmt(tm.altitudeM)}
              unit="m"
              tone="accent"
            />
            <Stat
              icon="speed"
              label={c.speed}
              value={fmt(tm.speedMps)}
              unit="m/s"
              tone="accent"
            />
            <Stat
              icon="vertical"
              label={c.vertical}
              value={fmt(tm.verticalMps)}
              unit="m/s"
            />
            <Stat
              icon="compass"
              label={c.heading}
              value={
                tm.headingDeg === null ? '--' : `${Math.round(tm.headingDeg)}°`
              }
            />
            <div className={`fc-stat fc-stat--battery is-${batteryTone}`}>
              <span className="fc-stat__icon">
                <Ico name="battery" size={22} />
              </span>
              <div>
                <span className="fc-stat__label">{c.battery}</span>
                <strong>
                  {battery === null ? '--' : `${battery.toFixed(0)}%`}
                </strong>
              </div>
            </div>
            <div className="fc-stat fc-stat--gps">
              <span className="fc-stat__icon">
                <Ico name="pin" size={22} />
              </span>
              <div>
                <span className="fc-stat__label">{c.gps}</span>
                <strong className="fc-mono">
                  {hasGps ? (
                    <>
                      <span>{tm.latitude!.toFixed(6)} N</span>
                      <span>{tm.longitude!.toFixed(6)} E</span>
                    </>
                  ) : (
                    '--'
                  )}
                </strong>
              </div>
            </div>
          </div>
          <dl className="fc-secondary">
            <div>
              <dt>{c.toBase}</dt>
              <dd>{fmt(tm.baseDistanceKm, 2)} km</dd>
            </div>
            <div>
              <dt>{c.toTarget}</dt>
              <dd>{fmt(tm.targetDistanceKm, 2)} km</dd>
            </div>
            <div>
              <dt>{c.mode}</dt>
              <dd>{tm.flightMode ?? '--'}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </section>
  )
}
