import { CheckOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import type { ReactNode } from 'react'

import { CardComponent } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import type { StaffAgent, SupportTicketDto } from '../../api/supportApi'
import { MissionLink, OrderLink } from './RelatedLinks'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

const SELECTABLE_STATUSES = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'RESOLVED',
  'CLOSED',
] as const

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sd-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Customer, related order/mission and mission snapshot for the open ticket. */
export function TicketContextCards({
  ticket,
  canManage,
}: {
  ticket: SupportTicketDto
  canManage: boolean
}) {
  const { t } = useI18n(staffSupportMessages)
  const none = <span className="sd-none">{t.detail.none}</span>
  return (
    <>
      <CardComponent size="small" title={t.detail.customerInfo}>
        <dl className="sd-facts">
          <Fact label={t.table.customer}>
            <b>{ticket.customerName || t.table.unknownCustomer}</b>
          </Fact>
          <Fact label={t.detail.role}>{t.detail.customerRole}</Fact>
        </dl>
      </CardComponent>

      <CardComponent size="small" title={t.detail.related}>
        <dl className="sd-facts">
          <Fact label={t.detail.relatedOrder}>
            {canManage && ticket.orderId ? (
              <OrderLink
                orderId={ticket.orderId}
                label={t.detail.openOrder}
                title={t.detail.openOrderTitle}
              />
            ) : (
              none
            )}
          </Fact>
          <Fact label={t.detail.relatedMission}>
            {canManage && ticket.missionId ? (
              <MissionLink
                missionId={ticket.missionId}
                label={t.detail.openMission}
                title={t.detail.openMissionTitle}
              />
            ) : (
              none
            )}
          </Fact>
          <Fact label={t.detail.missionStatus}>
            <b className="sd-warn">{t.detail.missionStatusValue}</b>
          </Fact>
          <Fact label={t.detail.assignedDrone}>
            <b className="mgr-code sd-ok">DRONE-ALPHA-01</b>
          </Fact>
        </dl>
      </CardComponent>
    </>
  )
}

type ControlsProps = {
  ticket: SupportTicketDto
  canManage: boolean
  staffAgents: StaffAgent[]
  staffLoading: boolean
  onAssign: (staffId: string, staffName: string) => void
  onStatus: (status: string) => void
}

/** Assignment, status select and quick-resolve for the open ticket. */
export function TicketControls({
  ticket,
  canManage,
  staffAgents,
  staffLoading,
  onAssign,
  onStatus,
}: ControlsProps) {
  const { t } = useI18n(staffSupportMessages)
  const statusLabels = t.status as Record<string, string>
  const statusOptions: { value: string; label: string; disabled?: boolean }[] =
    SELECTABLE_STATUSES.map((value) => ({ value, label: statusLabels[value] }))
  if (!SELECTABLE_STATUSES.some((s) => s === ticket.status)) {
    statusOptions.push({
      value: ticket.status,
      label: statusLabels[ticket.status] ?? ticket.status,
      disabled: true,
    })
  }
  return (
    <CardComponent size="small" title={t.detail.controls}>
      <div className="sd-controls">
        {canManage ? (
          <label className="sd-field">
            <span>{t.detail.assignStaff}</span>
            <Select
              value={ticket.assignedStaffId || ''}
              loading={staffLoading}
              onChange={(agentId: string) => {
                const agent = staffAgents.find((a) => a.id === agentId)
                if (agentId && agent) onAssign(agent.id, agent.fullName)
              }}
              options={[
                { value: '', label: t.detail.unassignedOption },
                ...staffAgents.map((a) => ({ value: a.id, label: a.fullName })),
              ]}
            />
          </label>
        ) : null}

        <label className="sd-field">
          <span>{t.detail.status}</span>
          <Select
            value={ticket.status}
            onChange={onStatus}
            options={statusOptions}
          />
        </label>

        <Button
          block
          icon={<CheckOutlined />}
          className="sd-resolve"
          onClick={() => onStatus('RESOLVED')}
        >
          {t.detail.resolve}
        </Button>
      </div>
    </CardComponent>
  )
}
