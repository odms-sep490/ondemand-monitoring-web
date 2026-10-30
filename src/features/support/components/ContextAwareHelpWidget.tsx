import { Button, Collapse } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../shared/components/antd'
import { OrderIcon } from '../../manager/components/common/OrderIcon'
import { useI18n } from '../../../shared/i18n'
import { getFaqArticles, type ArticleId } from '../data/helpArticles'
import type { DeliveryStatus } from '../../delivery/types'
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
  deliveryStatus?: DeliveryStatus
}

const MISSION_QUESTIONS: ArticleId[] = ['msn-3', 'msn-2', 'msn-1']

/** Ids that are full uuids are too long to show; the widget then says "this order". */
const isLongId = (id: string) =>
  Boolean(id) && id.includes('-') && id.length > 20

export function ContextAwareHelpWidget({
  type,
  id,
  status = 'PENDING',
  orderId,
  statusLabel,
  deliveryStatus,
}: ContextAwareHelpWidgetProps) {
  const { t, lang } = useI18n(contextAwareHelpWidgetMessages)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

  const isOrder = type === 'ORDER'
  const articles = getFaqArticles(lang)
  const suggestedIds = isOrder
    ? getOrderFaqIds(status, deliveryStatus)
    : MISSION_QUESTIONS
  const suggestedQuestions = suggestedIds.flatMap((articleId) => {
    const article = articles.find((candidate) => candidate.id === articleId)
    return article
      ? [{ id: articleId, question: article.question, answer: article.answer }]
      : []
  })

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

      {suggestedQuestions.length ? (
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
      ) : (
        <p className="hw-empty" role="status">
          {t.noSuggestedQuestions}
        </p>
      )}

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
          initialOrderId={isOrder ? (orderId ?? id) : orderId}
          initialMissionId={type === 'MISSION' ? id : undefined}
          initialCategory={isOrder ? 'ORDERS' : 'MISSIONS'}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </CardComponent>
  )
}

function getOrderFaqIds(
  status: string,
  deliveryStatus?: DeliveryStatus,
): ArticleId[] {
  if (deliveryStatus) {
    switch (deliveryStatus) {
      case 'CUSTOMER_REVIEW':
      case 'REVISION_REQUESTED':
        return ['res-1', 'res-2']
      case 'FINAL_PAYMENT_PENDING':
        // No payment-specific FAQ exists in the current help center.
        return []
      case 'PAYMENT_CONFIRMED':
      case 'READY_FOR_DELIVERY':
      case 'DELIVERED':
        return ['res-1', 'res-3']
      case 'PROCESSING':
      case 'READY_FOR_MANAGER_REVIEW':
        return ['res-2', 'res-1']
    }
  }

  switch (status) {
    case 'DRAFT':
    case 'AI_ANALYZED':
    case 'SUBMITTED':
    case 'PENDING':
      return ['ord-1', 'ord-3', 'ord-4']
    case 'REJECTED':
      return ['ord-2']
    case 'NEEDS_INFO':
      return []
    case 'CANCELLED':
      return []
    case 'APPROVED':
    case 'SCHEDULED':
      return ['ord-3', 'ord-4', 'msn-1']
    case 'IN_PROGRESS':
      return []
    case 'COMPLETED':
      return ['res-1', 'res-2', 'res-3']
    default:
      return []
  }
}
