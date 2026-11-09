import { ToolOutlined } from '@ant-design/icons'

import { CardComponent } from '../../../../../shared/components/antd'
import { StatusTag } from '../../../components/common/StatusTag'

/** Compact service summary under the page header: service name, description and result formats. */
export function OrderServiceCard({
  serviceName,
  serviceDescription,
  deliverables,
  deliverablesLabel,
  eyebrow,
}: {
  serviceName: string
  serviceDescription?: string | null
  deliverables: string[]
  deliverablesLabel: string
  eyebrow: string
}) {
  const name = serviceName.trim()
  if (!name) return null
  const description = serviceDescription?.trim()
  return (
    <CardComponent className="mgr-or-service" aria-label={name}>
      <div className="mgr-or-service-row">
        <span className="mgr-tile mgr-tone-blue" aria-hidden="true">
          <ToolOutlined />
        </span>
        <div className="mgr-or-service-text">
          <span className="mgr-or-service-eyebrow">{eyebrow}</span>
          <h2 className="mgr-or-service-name">{name}</h2>
          {description ? <p className="mgr-or-service-desc">{description}</p> : null}
        </div>
        {deliverables.length > 0 ? (
          <StatusTag tone="info">{`${deliverablesLabel}: ${deliverables.join(', ')}`}</StatusTag>
        ) : null}
      </div>
    </CardComponent>
  )
}
