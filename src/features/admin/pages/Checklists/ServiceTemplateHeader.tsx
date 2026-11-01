import { Select, Tag } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { displayLocalized, useI18n } from '../../../../shared/i18n'
import type { ServiceResponse } from '../../api/catalogApi'
import { adminHref } from '../../routes'
import { checklistMessages } from './checklists.messages'

/** Service switcher and the one-line summary (checklist count, last update, active state) of the open service. */
export function ServiceTemplateHeader({
  serviceId,
  services,
  count,
}: {
  serviceId: string
  services: ServiceResponse[]
  /** Number of default checklists, or null while it is unknown. */
  count: number | null
}) {
  const { t, locale } = useI18n(checklistMessages)
  const service = services.find((row) => row.id === serviceId)
  const serviceActive = service?.isActive === true
  return (
    <CardComponent>
      <div className="checklist-service-select">
        <label htmlFor="checklist-service">{t.serviceLabel}</label>
        <Select
          id="checklist-service"
          value={serviceId}
          onChange={(value) => {
            window.location.hash = adminHref({
              screen: 'serviceChecklists',
              serviceId: value,
            })
          }}
          options={[
            ...(service ? [] : [{ value: serviceId, label: serviceId }]),
            ...services.map((row) => ({
              value: row.id,
              label: displayLocalized(row.name) + (row.isActive ? '' : ' (' + t.inactive + ')'),
            })),
          ]}
        />
      </div>
      <div className="checklist-summary">
        <div>
          <h2>{service ? displayLocalized(service.name) : serviceId}</h2>
          <p className="checklist-metadata">
            {count ?? '—'} {t.checklistCount}
            {service?.updatedAt
              ? ' · ' +
                t.updated +
                ': ' +
                new Date(service.updatedAt).toLocaleString(locale)
              : ''}
          </p>
        </div>
        <Tag bordered={false} color={serviceActive ? 'success' : 'default'}>
          {serviceActive ? t.active : t.inactive}
        </Tag>
      </div>
    </CardComponent>
  )
}
