import { MessageOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { CardComponent, TableComponent } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { EmptyState } from '../../../manager/components/common/EmptyState'
import type { SupportTicketDto } from '../../api/supportApi'
import { MissionLink, OrderLink } from './RelatedLinks'
import { staffSupportMessages } from './StaffSupportDashboard.messages'
import {
  TicketCategoryTag,
  TicketPriorityTag,
  TicketStatusTag,
} from './TicketTags'

type Props = {
  rows: SupportTicketDto[]
  total: number
  loading: boolean
  canManage: boolean
  selectedId: string | null
  onSelect: (ticket: SupportTicketDto) => void
}

export function SupportTicketTable({
  rows,
  total,
  loading,
  canManage,
  selectedId,
  onSelect,
}: Props) {
  const { t } = useI18n(staffSupportMessages)
  const columns: ColumnsType<SupportTicketDto> = [
    {
      title: t.table.ticket,
      key: 'ticket',
      render: (_, ticket) => (
        <span className="mgr-cell-stack">
          <span className="mgr-code">{ticket.ticketCode}</span>
          <span className="mgr-cell-sub sd-subject">{ticket.subject}</span>
          <span className="sd-cell-tags">
            <TicketPriorityTag priority={ticket.priority} />
            <TicketStatusTag status={ticket.status} />
          </span>
        </span>
      ),
    },
    {
      title: t.table.customer,
      key: 'customer',
      responsive: ['md'],
      render: (_, ticket) => (
        <span className="sd-customer">
          {ticket.customerName || t.table.unknownCustomer}
        </span>
      ),
    },
    {
      title: t.table.category,
      key: 'category',
      responsive: ['xl'],
      render: (_, ticket) => <TicketCategoryTag category={ticket.category} />,
    },
    {
      title: t.table.context,
      key: 'context',
      responsive: ['lg'],
      render: (_, ticket) => (
        <span className="sd-context">
          {canManage && ticket.orderId ? (
            <OrderLink
              orderId={ticket.orderId}
              label={t.table.viewOrder}
              title={t.table.viewOrderTitle}
            />
          ) : null}
          {canManage && ticket.missionId ? (
            <MissionLink
              missionId={ticket.missionId}
              label={t.table.viewMission}
              title={t.table.viewMissionTitle}
            />
          ) : null}
          {!ticket.orderId && !ticket.missionId ? (
            <span className="mgr-cell-sub">{t.table.general}</span>
          ) : null}
        </span>
      ),
    },
    {
      title: t.table.priority,
      key: 'priority',
      responsive: ['sm'],
      render: (_, ticket) => <TicketPriorityTag priority={ticket.priority} />,
    },
    {
      title: t.table.status,
      key: 'status',
      responsive: ['sm'],
      render: (_, ticket) => <TicketStatusTag status={ticket.status} />,
    },
    {
      title: t.table.assignee,
      key: 'assignee',
      responsive: ['xl'],
      render: (_, ticket) =>
        ticket.assignedStaffName ? (
          <span className="sd-assignee">{ticket.assignedStaffName}</span>
        ) : (
          <span className="mgr-cell-sub sd-assignee">{t.table.unassigned}</span>
        ),
    },
    {
      title: t.table.action,
      key: 'action',
      align: 'right',
      render: (_, ticket) => (
        <Button
          size="small"
          aria-label={t.table.reply}
          icon={<MessageOutlined />}
          onClick={() => onSelect(ticket)}
        >
          <span className="sd-btn-label">{t.table.reply}</span>
        </Button>
      ),
    },
  ]
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<SupportTicketDto>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        rowClassName={(ticket) => (selectedId === ticket.id ? 'is-selected' : '')}
        locale={{
          emptyText: loading ? (
            <span />
          ) : (
            <EmptyState title={t.table.empty} description={t.table.emptyHint} />
          ),
        }}
      />
      {!loading && rows.length > 0 ? (
        <div className="mgr-table-foot">{t.table.count(rows.length, total)}</div>
      ) : null}
    </CardComponent>
  )
}
