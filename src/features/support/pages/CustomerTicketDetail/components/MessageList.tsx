import { useI18n } from '../../../../../shared/i18n'
import type { SupportMessageDto } from '../../../api/supportApi'
import { ticketLabelsMessages } from '../../../lib/ticketLabels.messages'
import { customerTicketDetailMessages } from '../CustomerTicketDetailPage.messages'

type Props = {
  messages: SupportMessageDto[] | undefined
  description: string | undefined
}

export function MessageList({ messages, description }: Props) {
  const { t, locale } = useI18n(customerTicketDetailMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)

  if (!messages || messages.length === 0) {
    return <div className="td-empty">{description || t.noMessages}</div>
  }

  return (
    <ul className="td-messages">
      {messages.map((msg) => {
        const role = labels.senderRole[msg.senderRole] ?? msg.senderRole
        return (
          <li
            key={msg.id}
            className={`td-msg${msg.senderRole === 'CUSTOMER' ? ' is-mine' : ''}`}
          >
            <div className="td-msg-meta">
              <span className="td-msg-author">
                {msg.senderName} ({role})
              </span>
              <span>
                {new Date(msg.createdAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="td-bubble">
              {msg.content}
              {msg.attachmentUrl && (
                <div className="td-attachment">
                  <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                    {t.viewAttachment}
                  </a>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
