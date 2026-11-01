import { ControlOutlined } from '@ant-design/icons'
import { Descriptions, Tag } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminHref } from '../../../routes'
import type { OrderExpirationSettings } from '../../../types/operatingConfig'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'
import type { DeviceSummary, CatalogSummary } from '../dashboardData'
import type { PolicySummary } from '../dashboardStats'
import { QueryBody } from './QueryBody'

type Props = {
  policies: UseApiQueryState<PolicySummary>
  expiration: UseApiQueryState<OrderExpirationSettings>
  catalog: UseApiQueryState<CatalogSummary>
  devices: UseApiQueryState<DeviceSummary>
}

/** Active pricing policy, order-expiration windows, time slots and model count. */
export function SystemConfigCard({
  policies,
  expiration,
  catalog,
  devices,
}: Props) {
  const { t } = useI18n(adminDashboardPageMessages)
  const c = t.config
  return (
    <CardComponent
      title={c.title}
      icon={<ControlOutlined aria-hidden="true" aria-label={undefined} />}
      tone="violet"
      extra={
        <a
          className="mgr-card-link"
          href={adminHref({ screen: 'operatingConfig' })}
        >
          {c.manage}
        </a>
      }
    >
      <div className="adm-dash-config">
        <QueryBody query={policies} rows={2}>
          {(p) => (
            <Descriptions column={1} size="small" className="adm-descriptions">
              <Descriptions.Item label={c.policy}>
                {p.active ? (
                  <>
                    <strong>{p.active.name}</strong>{' '}
                    <Tag bordered={false} color="success">
                      {c.version(p.active.version)}
                    </Tag>
                  </>
                ) : (
                  c.none
                )}
              </Descriptions.Item>
              <Descriptions.Item label={c.drafts}>{p.drafts}</Descriptions.Item>
            </Descriptions>
          )}
        </QueryBody>
        <QueryBody query={expiration} rows={2}>
          {(e) => (
            <Descriptions column={1} size="small" className="adm-descriptions">
              <Descriptions.Item label={c.quote}>
                {c.hours(e.quotationAcceptanceTimeoutHours)}
              </Descriptions.Item>
              <Descriptions.Item label={c.deposit}>
                {c.hours(e.depositPaymentTimeoutHours)}
              </Descriptions.Item>
            </Descriptions>
          )}
        </QueryBody>
        <Descriptions column={1} size="small" className="adm-descriptions">
          <Descriptions.Item label={c.catalog}>
            {catalog.data?.timeSlots ?? '–'}
          </Descriptions.Item>
          <Descriptions.Item label={c.models}>
            {devices.data?.models ?? '–'}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </CardComponent>
  )
}
