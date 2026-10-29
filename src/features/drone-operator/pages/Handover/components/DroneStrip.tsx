import { LinkOutlined } from '@ant-design/icons'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { handoverPageMessages } from '../HandoverPage.messages'

export function DroneStrip({
  missionLabel,
  droneLabel,
}: {
  missionLabel: string
  droneLabel: string
}) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <CardComponent>
      <div className="stf-row" style={{ flexWrap: 'nowrap' }}>
        <span className="mgr-tile mgr-tile-sm mgr-tone-blue" aria-hidden="true">
          <LinkOutlined />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {droneLabel} · {missionLabel}
          </div>
          <div className="stf-muted" style={{ fontSize: 12.5 }}>
            {t.connectedAt}
          </div>
        </div>
        <StatusTag tone="success">{t.connected}</StatusTag>
      </div>
    </CardComponent>
  )
}
