import { CloseOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Drawer, Input } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { mgrPopupContainer } from '../../../manager/components/common/mgrPopupContainer'
import type { StaffAgent, SupportTicketDto } from '../../api/supportApi'
import { staffSupportMessages } from './StaffSupportDashboard.messages'
import { TicketContextCards, TicketControls } from './TicketContextCards'
import { TicketConversation } from './TicketConversation'
import { TicketStatusTag } from './TicketTags'
import type { useTicketActions } from './useTicketActions'

type Props = {
  ticket: SupportTicketDto
  canManage: boolean
  staffAgents: StaffAgent[]
  staffLoading: boolean
  actions: ReturnType<typeof useTicketActions>
  onClose: () => void
}

/** Ticket detail: context + controls + conversation, with the reply form in the footer. */
export function TicketDetailDrawer({
  ticket,
  canManage,
  staffAgents,
  staffLoading,
  actions,
  onClose,
}: Props) {
  const { t } = useI18n(staffSupportMessages)
  const { replyText, replyAttachment, actionLoading } = actions
  return (
    <Drawer
      open
      getContainer={mgrPopupContainer}
      width="min(720px, 100vw)"
      onClose={onClose}
      closeIcon={<CloseOutlined aria-label={t.detail.close} />}
      className="mgr-ticket-drawer sd-drawer"
      title={
        <span className="sd-drawer-title">
          <span className="mgr-code">{ticket.ticketCode}</span>
          <TicketStatusTag status={ticket.status} />
        </span>
      }
      footer={
        <div className="sd-reply">
          <Input.TextArea
            rows={3}
            value={replyText}
            onChange={(e) => actions.setReplyText(e.target.value)}
            placeholder={t.detail.replyPlaceholder}
            aria-label={t.detail.replyAria}
          />
          <div className="sd-reply-row">
            <Input
              value={replyAttachment}
              onChange={(e) => actions.setReplyAttachment(e.target.value)}
              placeholder={t.detail.attachmentPlaceholder}
              aria-label={t.detail.attachmentAria}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={actions.sendReply}
              disabled={actionLoading || !replyText.trim()}
            >
              {actionLoading ? t.detail.sending : t.detail.send}
            </Button>
          </div>
        </div>
      }
    >
      <div className="sd-detail">
        <h2 className="sd-detail-subject">{ticket.subject}</h2>

        <section className="sd-detail-section">
          <h3 className="sd-detail-heading">{t.detail.conversation}</h3>
          <TicketConversation ticket={ticket} />
        </section>

        <section className="sd-detail-section">
          <h3 className="sd-detail-heading">{t.detail.context}</h3>
          <TicketContextCards ticket={ticket} canManage={canManage} />
          <TicketControls
            ticket={ticket}
            canManage={canManage}
            staffAgents={staffAgents}
            staffLoading={staffLoading}
            onAssign={actions.assignStaff}
            onStatus={actions.updateStatus}
          />
        </section>
      </div>
    </Drawer>
  )
}
