import { copy } from './cockpitCopy'
import { Ico } from './CockpitIcon'
import type { ReactNode } from 'react'

export function CockpitCameraPanel({
  c,
  batteryTone,
  battery,
  camera,
  statusMessage,
}: {
  c: (typeof copy)['vi' | 'en']
  batteryTone: 'ok' | 'low' | 'mid'
  battery: number | null
  camera: ReactNode
  statusMessage: string
}) {
  return (
    <section className="fc-panel fc-camera">
      <header className="fc-panel__head">
        <span className="fc-panel__title">
          <i className="fc-dot is-live" />
          {c.camera}
        </span>
        <span className="fc-panel__tools">
          <span className={`fc-badge is-${batteryTone}`}>
            <Ico name="battery" size={14} />{' '}
            {battery === null ? '--' : `${Math.round(battery)}%`}
          </span>
        </span>
      </header>
      <div className="fc-camera__body">
        {camera}
        {statusMessage ? (
          <div className="fc-command-feedback" role="status">
            {statusMessage}
          </div>
        ) : null}
      </div>
    </section>
  )
}
