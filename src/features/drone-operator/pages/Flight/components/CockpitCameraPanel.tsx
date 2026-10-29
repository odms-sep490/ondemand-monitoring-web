import { Button } from 'antd'

import { copy } from './cockpitCopy'
import { Ico } from './CockpitIcon'
import type { Dispatch, SetStateAction, ReactNode } from 'react'
import type { CockpitLayout } from './cockpitTypes'

export function CockpitCameraPanel({
  c,
  batteryTone,
  battery,
  setLayout,
  layout,
  camera,
}: {
  c: (typeof copy)['vi' | 'en']
  batteryTone: 'ok' | 'low' | 'mid'
  battery: number | null
  setLayout: Dispatch<SetStateAction<CockpitLayout>>
  layout: CockpitLayout
  camera: ReactNode
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
          <Button
            size="small"
            onClick={() => setLayout(layout === 'camera' ? 'split' : 'camera')}
            aria-label={layout === 'camera' ? c.shrink : c.enlarge}
            title={layout === 'camera' ? c.shrink : c.enlarge}
            icon={<Ico name="expand" size={15} />}
          />
        </span>
      </header>
      <div className="fc-camera__body">{camera}</div>
    </section>
  )
}
