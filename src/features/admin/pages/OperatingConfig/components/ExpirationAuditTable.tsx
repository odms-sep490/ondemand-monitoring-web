import { HistoryOutlined } from '@ant-design/icons'
import { Avatar, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderExpirationSettingAudit } from '../../../types/operatingConfig'
import { actorDisplayName, actorInitials } from './expirationActor'
import { orderExpirationSettingsMessages } from './OrderExpirationSettings.messages'

export function ExpirationAuditTable({
  query,
}: {
  query: UseApiQueryState<OrderExpirationSettingAudit[]>
}) {
  const { t, locale } = useI18n(orderExpirationSettingsMessages)
  const rows = query.data

  const columns: ColumnsType<OrderExpirationSettingAudit> = [
    {
      title: t.field,
      key: 'field',
      render: (_, a) =>
        a.settingName === 'quotationAcceptanceTimeoutHours'
          ? t.quotation
          : t.deposit,
    },
    {
      title: t.previous,
      key: 'previous',
      className: 'mgr-nowrap',
      render: (_, a) => (
        <Tag bordered={false} className="adm-old-value">
          {a.previousValue} {t.hoursShort}
        </Tag>
      ),
    },
    {
      title: t.next,
      key: 'next',
      className: 'mgr-nowrap',
      render: (_, a) => (
        <Tag bordered={false} color="success">
          {a.newValue} {t.hoursShort}
        </Tag>
      ),
    },
    {
      title: t.actor,
      key: 'actor',
      render: (_, a) => {
        const name = actorDisplayName(a.actor, locale, {
          unknown: t.unknownActor,
          legacy: t.legacyActor,
        })
        return (
          <span className="mgr-cust" title={a.actor}>
            <Avatar size={28} className="mgr-cust-avatar">
              {actorInitials(name, locale)}
            </Avatar>
            <span className="adm-wrap">{name}</span>
          </span>
        )
      },
    },
    {
      title: t.changedAt,
      key: 'changedAt',
      className: 'mgr-nowrap',
      render: (_, a) => new Date(a.changedAt).toLocaleString(locale),
    },
  ]

  return (
    <CardComponent
      title={t.auditTitle}
      icon={<HistoryOutlined aria-hidden="true" aria-label={undefined} />}
      tone="violet"
      extra={
        rows ? (
          <Tag bordered={false}>{t.changeCount(rows.length)}</Tag>
        ) : undefined
      }
      styles={{ body: { padding: rows?.length ? 0 : undefined } }}
    >
      {query.error && !rows ? (
        <ErrorState error={query.error} onRetry={query.reload} />
      ) : !rows?.length ? (
        <EmptyState
          title={query.loading ? '…' : t.noAudit}
          description={t.auditDescription}
        />
      ) : (
        <TableComponent<OrderExpirationSettingAudit>
          rowKey="id"
          className="adm-wide-table"
          columns={columns}
          dataSource={rows}
        />
      )}
    </CardComponent>
  )
}
