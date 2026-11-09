import { Alert, Button, Input } from 'antd'
import type { FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { customerTicketDetailMessages } from '../CustomerTicketDetailPage.messages'

type Props = {
  content: string
  attachment: string
  sending: boolean
  error: string | null
  onContent: (value: string) => void
  onAttachment: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function ReplyForm({
  content,
  attachment,
  sending,
  error,
  onContent,
  onAttachment,
  onSubmit,
}: Props) {
  const { t } = useI18n(customerTicketDetailMessages)
  return (
    <form className="td-reply" onSubmit={onSubmit}>
      <Input.TextArea
        rows={3}
        aria-label={t.replyLabel}
        value={content}
        onChange={(e) => onContent(e.target.value)}
        placeholder={t.replyPlaceholder}
      />
      <div className="td-reply-row">
        <Input
          aria-label={t.attachmentLabel}
          value={attachment}
          onChange={(e) => onAttachment(e.target.value)}
          placeholder={t.attachmentPlaceholder}
        />
        <Button
          htmlType="submit"
          type="primary"
          disabled={sending || !content.trim()}
        >
          {sending ? t.sending : t.send}
        </Button>
      </div>
      {error !== null && (
        <Alert type="error" showIcon message={error || t.sendFailed} />
      )}
    </form>
  )
}
