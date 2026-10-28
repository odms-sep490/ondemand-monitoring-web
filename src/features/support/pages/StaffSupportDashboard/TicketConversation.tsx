import { PaperClipOutlined } from '@ant-design/icons'

import { useI18n } from '../../../../shared/i18n'
import type { SupportTicketDto } from '../../api/supportApi'
import { ticketLabelsMessages } from '../../lib/ticketLabels.messages'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

/** Message history of a ticket; staff/manager messages align right. */
export function TicketConversation({ ticket }: { ticket: SupportTicketDto }) {
  const { t, locale } = useI18n(staffSupportMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)
  const messages = ticket.messages ?? []
  return (
    <div className="sd-thread mgr-scroll-list mgr-scroll-list--tall">
      {messages.length === 0 ? (
        <div className="sd-thread-empty">
          {ticket.description || t.detail.noMessages}
        </div>
      ) : null}

      {messages.map((msg) => {
        const isStaff = msg.senderRole === 'STAFF' || msg.senderRole === 'MANAGER'
        return (
          <div key={msg.id} className={`sd-msg${isStaff ? ' is-staff' : ''}`}>
            <div className="sd-msg-meta">
              <b>
                {msg.senderName} ({labels.senderRole[msg.senderRole] ?? msg.senderRole})
              </b>
              <span>
                {new Date(msg.createdAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="sd-msg-bubble">
              {msg.content}
              {msg.attachmentUrl ? (
                <div className="sd-msg-attach">
                  <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                    <PaperClipOutlined /> {t.detail.attachment}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
