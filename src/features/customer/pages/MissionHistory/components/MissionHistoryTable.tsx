import type { ColumnsType } from 'antd/es/table'

import { TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { MissionStatusBadge } from '../../../components/common/MissionStatusBadge'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { MissionRow } from '../../../lib/missionHistory/types'
import { customerHref } from '../../../routes'
import { missionHistoryTableMessages } from './MissionHistoryTable.messages'

const DASH = '—'

export function MissionHistoryTable({ rows }: { rows: MissionRow[] }) {
  const { t, locale } = useI18n(missionHistoryTableMessages)
  const c = t.columns
  const hrefOf = (row: MissionRow) =>
    customerHref({ screen: 'missionHistoryDetail', missionId: row.id })

  const columns: ColumnsType<MissionRow> = [
    {
      title: c.mission,
      key: 'mission',
      render: (_, row) => (
        <a className="cus-order-title mgr-code" href={hrefOf(row)}>
          {row.code}
        </a>
      ),
    },
    {
      title: c.order,
      key: 'order',
      className: 'cus-hide-md',
      render: (_, row) => (
        <span className="mgr-cell-stack">
          <span>{row.orderTitle}</span>
          {row.address && <span className="mgr-cell-sub">{row.address}</span>}
        </span>
      ),
    },
    {
      title: c.status,
      key: 'status',
      render: (_, row) => <MissionStatusBadge status={row.status} />,
    },
    {
      title: c.finished,
      key: 'finished',
      className: 'cus-hide-lg',
      render: (_, row) => (
        <span className="mgr-nowrap">
          {row.completedAt ? fmtDateTime(row.completedAt, locale) : DASH}
        </span>
      ),
    },
    {
      title: c.results,
      key: 'results',
      align: 'right',
      render: (_, row) => (
        <a className="mgr-card-link" href={hrefOf(row)}>
          {t.view}
        </a>
      ),
    },
  ]

  return (
    <TableComponent<MissionRow>
      rowKey="id"
      columns={columns}
      dataSource={rows}
      pagination={false}
    />
  )
}
