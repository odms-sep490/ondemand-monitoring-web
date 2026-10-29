import { RocketOutlined } from '@ant-design/icons'
import { Skeleton } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  StatusTag,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import type { CustomerMissionHistory } from '../../../api/customerMissionHistoryApi'
import { fmtDateTime, getMissionStatusMeta } from '../../../lib/orderStatus'
import { customerHref } from '../../../routes'
import { recentMissionsMessages } from './RecentMissionsCard.messages'

type Props = {
  missions: CustomerMissionHistory[] | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
}

/** Latest entries of `GET /api/customer/mission-history`; fails independently of the orders. */
export function RecentMissionsCard({ missions, loading, error, onRetry }: Props) {
  const { t, locale } = useI18n(recentMissionsMessages)
  const { lang } = useLanguage()

  if (error !== undefined && !missions && !loading) {
    return <ErrorState title={t.errorTitle} error={error} onRetry={onRetry} />
  }

  const columns: ColumnsType<CustomerMissionHistory> = [
    {
      title: t.columns.mission,
      dataIndex: 'orderTitle',
      render: (title: string, mission) => (
        <span className="mgr-cell-stack">
          <a
            className="cus-order-title"
            href={customerHref({ screen: 'missionHistoryDetail', missionId: mission.id })}
          >
            {title}
          </a>
          <span className="mgr-cell-sub">{mission.missionCode}</span>
        </span>
      ),
    },
    {
      title: t.columns.time,
      key: 'time',
      responsive: ['md'],
      render: (_, mission) => {
        const at = mission.completedAt ?? mission.startedAt ?? mission.scheduledStartAt
        return <span className="mgr-muted mgr-nowrap">{at ? fmtDateTime(at, locale) : '—'}</span>
      },
    },
    {
      title: t.columns.status,
      dataIndex: 'status',
      render: (_, mission) => {
        const meta = getMissionStatusMeta(mission.status, lang)
        return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
      },
    },
  ]

  return (
    <CardComponent
      title={t.title}
      icon={<RocketOutlined />}
      tone="green"
      extra={
        <a className="mgr-card-link" href={customerHref({ screen: 'missionHistory' })}>
          {t.viewAll}
        </a>
      }
      styles={{ body: { padding: loading && !missions ? undefined : 0 } }}
    >
      {loading && !missions ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : !missions || missions.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <TableComponent<CustomerMissionHistory>
          rowKey="id"
          columns={columns}
          dataSource={missions}
        />
      )}
    </CardComponent>
  )
}
