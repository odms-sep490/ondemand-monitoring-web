import { useState, type FormEvent } from 'react'
import { Card } from '../../../../customer/components/common/ui'
import { authSession } from '../../../../auth/api/authApi'
import { useI18n } from '../../../../../shared/i18n'
import { supportApi, type SupportTicketDto } from '../../../api/supportApi'
import { isTicketFinished } from '../../../lib/ticketStatus'
import { customerTicketDetailMessages } from '../CustomerTicketDetailPage.messages'
import { MessageList } from './MessageList'
import { ReplyForm } from './ReplyForm'

export function CustomerTicketConversation({
  ticket,
  onReplied,
}: {
  ticket: SupportTicketDto
  onReplied: () => void
}) {
  const { t } = useI18n(customerTicketDetailMessages)
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachment, setReplyAttachment] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  async function sendReply(e: FormEvent) {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSending(true)
    setSendError(null)
    const currentUser = authSession.getUser()

    try {
      await supportApi.addMessage(ticket.id, {
        senderId: currentUser?.id,
        senderName: currentUser?.fullName || currentUser?.email || 'User',
        senderRole: currentUser?.role === 'STAFF' ? 'STAFF' : 'CUSTOMER',
        content: replyContent,
        attachmentUrl: replyAttachment.trim() || undefined,
      })
      setReplyContent('')
      setReplyAttachment('')
      onReplied()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : '')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card title={t.conversation}>
      <MessageList
        messages={ticket.messages}
        description={ticket.description}
      />
      {isTicketFinished(ticket.status) ? (
        <div className="sp-notice is-success">{t.finished}</div>
      ) : (
        <ReplyForm
          content={replyContent}
          attachment={replyAttachment}
          sending={sending}
          error={sendError}
          onContent={setReplyContent}
          onAttachment={setReplyAttachment}
          onSubmit={sendReply}
        />
      )}
    </Card>
  )
}
