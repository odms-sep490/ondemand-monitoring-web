import { Button, Tag } from 'antd'
import { useI18n } from '../../../../../shared/i18n'
import type { FAQArticle } from '../../../data/helpArticles'
import { helpCenterHomeMessages } from '../HelpCenterHomePage.messages'

type Props = {
  article: FAQArticle
  feedback: 'YES' | 'NO' | undefined
  onFeedback: (helpful: boolean) => void
  onCreateTicket: () => void
}

export function FaqItem({
  article,
  feedback,
  onFeedback,
  onCreateTicket,
}: Props) {
  const { t } = useI18n(helpCenterHomeMessages)
  return (
    <div className="hc-faq-body">
      <p>{article.answer}</p>
      <div className="hc-feedback">
        <span>{t.helpful}</span>
        {!feedback ? (
          <div className="hc-feedback-actions">
            <Button onClick={() => onFeedback(true)}>{t.yes}</Button>
            <Button onClick={() => onFeedback(false)}>{t.no}</Button>
          </div>
        ) : feedback === 'YES' ? (
          <span className="hc-thanks">✓ {t.thanks}</span>
        ) : (
          <div className="hc-feedback-actions">
            <span className="hc-more">{t.needMore}</span>
            <Button type="primary" onClick={onCreateTicket}>
              {t.createTicketShort}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function FaqQuestion({ article }: { article: FAQArticle }) {
  return (
    <span className="hc-faq-q">
      <span>{article.question}</span>
      <Tag className="hc-faq-chip">{article.categoryLabel}</Tag>
    </span>
  )
}
