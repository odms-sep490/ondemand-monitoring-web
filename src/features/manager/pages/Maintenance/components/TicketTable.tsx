import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { CardComponent, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { formatAge } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketSeverityTag, TicketStatusTag } from './TicketTags'

type Props = {
  rows: MaintenanceTicket[]
  total: number
  selectedId: string | null
  onSelect: (ticket: MaintenanceTicket) => void
  onAssign: (ticket: MaintenanceTicket) => void
}

export function TicketTable({ rows, total, selectedId, onSelect, onAssign }: Props) {
  const { t } = useI18n(maintenancePageMessages)
  const columns: ColumnsType<MaintenanceTicket> = [
    {
      title: t.page.columns.ticket,
      key: 'ticket',
      render: (_, ticket) => (
        <span className="mgr-cell-stack">
          <span className="mgr-code">{ticket.code}</span>
          <span className="mgr-cell-sub mgr-ticket-title">{formatTicketTitle(ticket.title)}</span>
        </span>
      ),
    },
    {
      title: t.page.columns.drone,
      dataIndex: 'droneCode',
      key: 'drone',
      responsive: ['md'],
      render: (code: string) => <span className="mgr-code">{code}</span>,
    },
    {
      title: t.page.columns.priority,
      key: 'priority',
      render: (_, ticket) => <TicketSeverityTag severity={ticket.priority} />,
    },
    {
      title: t.page.columns.status,
      key: 'status',
      responsive: ['sm'],
      render: (_, ticket) => <TicketStatusTag status={ticket.status} />,
    },
    {
      title: t.page.columns.operator,
      key: 'operator',
      responsive: ['lg'],
      render: (_, ticket) =>
        ticket.assignedTo ? (
          <span className="mgr-op-cell">{ticket.assignedTo}</span>
        ) : (
          <span className="mgr-cell-sub mgr-op-cell">{t.card.unassigned}</span>
        ),
    },
    {
      title: t.page.columns.opened,
      key: 'opened',
      responsive: ['lg'],
      render: (_, ticket) => (
        <span className="mgr-cell-sub mgr-nowrap">{formatAge(ticket.openedAt, t.age)}</span>
      ),
    },
    {
      title: t.page.columns.actions,
      key: 'actions',
      align: 'right',
      responsive: ['sm'],
      render: (_, ticket) =>
        ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS' ? (
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              onAssign(ticket)
            }}
          >
            {ticket.assignedTo ? t.card.changeOperator : t.card.assignOperator}
          </Button>
        ) : null,
    },
  ]
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<MaintenanceTicket>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        rowClassName={(ticket) => `mgr-row-click${selectedId === ticket.id ? ' is-selected' : ''}`}
        onRow={(ticket) => ({ onClick: () => onSelect(ticket) })}
      />
      <div className="mgr-table-foot">{t.page.resultCount(rows.length, total)}</div>
    </CardComponent>
  )
}
