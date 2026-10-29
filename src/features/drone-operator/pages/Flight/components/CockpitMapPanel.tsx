import { Button } from 'antd'

import { copy } from './cockpitCopy'
import { Ico } from './CockpitIcon'
import type { Dispatch, SetStateAction, ReactNode } from 'react'
import type { CockpitLayout } from './cockpitTypes'

export function CockpitMapPanel({
  c,
  statusMessage,
  setLayout,
  layout,
  map,
  missionLabel,
}: {
  c: (typeof copy)['vi' | 'en']
  statusMessage: string
  setLayout: Dispatch<SetStateAction<CockpitLayout>>
  layout: CockpitLayout
  map: ReactNode
  missionLabel: string
}) {
  return (
    <section className="fc-panel fc-map">
      <header className="fc-panel__head">
        <span className="fc-panel__title">
          <Ico name="pin" size={15} />
          {c.map}
        </span>
        <span className="fc-panel__tools">
          {statusMessage ? (
            <span className="fc-status-msg" title={statusMessage}>
              {statusMessage}
            </span>
          ) : null}
          <Button
            size="small"
            onClick={() => setLayout(layout === 'map' ? 'split' : 'map')}
            aria-label={layout === 'map' ? c.shrink : c.enlarge}
            title={layout === 'map' ? c.shrink : c.enlarge}
            icon={<Ico name="expand" size={15} />}
          />
        </span>
      </header>
      <div className="fc-map__body">
        {map}
        <div className="fc-legend">
          <strong>{missionLabel}</strong>
          <span>
            <i className="fc-legend__line is-route" />
            {c.route}
          </span>
          <span>
            <i className="fc-legend__line is-zone" />
            {c.zone}
          </span>
          <span>
            <i className="fc-legend__dot is-drone" />
            {c.drone}
          </span>
          <span>
            <i className="fc-legend__dot is-target" />
            {c.target}
          </span>
        </div>
      </div>
    </section>
  )
}
