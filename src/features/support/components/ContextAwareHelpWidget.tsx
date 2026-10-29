import { Button, Collapse } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../shared/components/antd'
import { OrderIcon } from '../../manager/components/common/OrderIcon'
import { useI18n } from '../../../shared/i18n'
import { getFaqArticles, type ArticleId } from '../data/helpArticles'
import { contextAwareHelpWidgetMessages } from './ContextAwareHelpWidget.messages'
import './ContextAwareHelpWidget.css'
import { CreateTicketModal } from './CreateTicketModal'

type ContextAwareHelpWidgetProps = {
  type: 'ORDER' | 'MISSION'
  id: string
  status?: string
  scheduledTime?: string
  description?: string
  orderId?: string
  /** Localized status text shown in the hint; `status` stays the logic value. */
  statusLabel?: string
}

const ORDER_QUESTIONS: ArticleId[] = ['ord-1', 'ord-3', 'ord-4']
const MISSION_QUESTIONS: ArticleId[] = ['msn-3', 'msn-2', 'msn-1']

/** Ids that are full uuids are too long to show; the widget then says "this order". */
const isLongId = (id: string) =>
  Boolean(id) && id.includes('-') && id.length > 20

export function ContextAwareHelpWidget({
  type,
  id,
  status = 'PENDING_APPROVAL',
  orderId,
  statusLabel,
}: ContextAwareHelpWidgetProps) {
  const { t, lang } = useI18n(contextAwareHelpWidgetMessages)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

  const isOrder = type === 'ORDER'
  const articles = getFaqArticles(lang)
  const suggestedQuestions = (
    isOrder ? ORDER_QUESTIONS : MISSION_QUESTIONS
  ).map((articleId) => ({
    id: articleId,
    question: t.questions[articleId as keyof typeof t.questions],
    answer: articles.find((a) => a.id === articleId)?.answer ?? '',
  }))

  const showBanner = type === 'MISSION' && status === 'FAILED_PREFLIGHT'
  const long = isLongId(id)
  const refText = long
    ? isOrder
      ? t.currentOrder
      : t.currentMission
    : isOrder
      ? t.orderRef(id)
      : t.missionRef(id)
  const displayLabel = long ? (isOrder ? t.thisOrder : t.thisMission) : `#${id}`
  const subjectLabel = long ? (isOrder ? t.thisOrder : t.thisMission) : `#${id}`

  return (
    <CardComponent
      className="hw-card"
      title={t.heading(isOrder)}
      icon={<OrderIcon name="help" size={16} />}
      tone="violet"
    >
      <span className="hw-ref">{refText}</span>

      {showBanner && <div className="hw-banner">{t.preflightFailedBanner}</div>}

      <div className="hw-hint">{t.suggestedFor(statusLabel ?? status)}</div>

      <Collapse
        className="hw-list"
        size="small"
        activeKey={expandedFaqId ? [expandedFaqId] : []}
        onChange={(key) => {
          const keys = Array.isArray(key) ? key : [key]
          const next = keys.find((k) => String(k) !== expandedFaqId)
          setExpandedFaqId(next ? String(next) : null)
        }}
        items={suggestedQuestions.map((item) => ({
          key: item.id,
          label: item.question,
          children: <div className="hw-answer">{item.answer}</div>,
        }))}
      />

      <div className="hw-foot">
        <span className="hw-foot-text">
          {t.needHelpFor} <b>{displayLabel}</b>? {t.autoAttach}
        </span>
        <Button type="primary" onClick={() => setShowCreateModal(true)}>
          {t.createTicketFor(displayLabel)}
        </Button>
      </div>

      {showCreateModal && (
        <CreateTicketModal
          initialOrderId={isOrder ? id : orderId}
          initialMissionId={type === 'MISSION' ? id : undefined}
          initialCategory={isOrder ? 'ORDERS' : 'MISSIONS'}
          initialSubject={t.subject(isOrder, subjectLabel)}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => undefined}
        />
      )}
    </CardComponent>
  )
}
