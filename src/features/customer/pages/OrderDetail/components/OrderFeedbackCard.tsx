import { CheckCircleFilled, StarFilled } from '@ant-design/icons'
import { Alert, Button, Card, Input, Rate, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import {
  orderFeedbackApi,
  type OrderFeedback,
  type OrderFeedbackState,
} from '../../../api/orderFeedbackApi'
import { orderFeedbackCardMessages } from './OrderFeedbackCard.messages'
import './OrderFeedbackCard.css'

type Props = {
  orderId: string
  /** Changes whenever delivery state changes so eligibility is re-checked after acceptance. */
  refreshKey?: string
}

type CriterionKey = 'qualityRating' | 'punctualityRating' | 'communicationRating'

const SCORE_HINTS_VI = ['', 'Chưa hài lòng', 'Cần cải thiện', 'Bình thường', 'Hài lòng', 'Rất hài lòng']
const SCORE_HINTS_EN = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

/** Customer satisfaction rating, shown once the delivered result has been accepted. */
export function OrderFeedbackCard({ orderId, refreshKey }: Props) {
  const { t, lang } = useI18n(orderFeedbackCardMessages)
  const [state, setState] = useState<OrderFeedbackState | null>(null)
  const [rating, setRating] = useState(0)
  const [criteria, setCriteria] = useState<Record<CriterionKey, number>>({
    qualityRating: 0,
    punctualityRating: 0,
    communicationRating: 0,
  })
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    orderFeedbackApi
      .get(orderId, controller.signal)
      .then(setState)
      .catch(() => {
        if (!controller.signal.aborted) setState(null)
      })
    return () => controller.abort()
  }, [orderId, refreshKey])

  if (!state || (!state.eligible && !state.feedback)) return null

  const criterionLabels: [CriterionKey, string][] = [
    ['qualityRating', t.quality],
    ['punctualityRating', t.punctuality],
    ['communicationRating', t.communication],
  ]

  if (state.feedback) {
    return (
      <SubmittedFeedback
        feedback={state.feedback}
        labels={criterionLabels}
        t={t}
      />
    )
  }

  const scoreHints = lang === 'vi' ? SCORE_HINTS_VI : SCORE_HINTS_EN

  const submit = async () => {
    if (rating < 1) {
      setError(t.ratingRequired)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const next = await orderFeedbackApi.submit(orderId, {
        rating,
        qualityRating: criteria.qualityRating || null,
        punctualityRating: criteria.punctualityRating || null,
        communicationRating: criteria.communicationRating || null,
        comment: comment.trim() || null,
      })
      setState(next)
      void message.success(t.submitted)
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.message
          ? caught.message
          : t.submitFailed,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card
      className="od-feedback-card"
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <StarFilled style={{ color: '#f59e0b' }} />
          {t.title}
        </span>
      }
      size="small"
    >
      <Typography.Text className="od-feedback-head-note">
        {t.intro}
      </Typography.Text>

      <div className="od-feedback-grid">
        <div className="od-feedback-ratings">
          <div className="od-feedback-overall">
            <div className="od-feedback-overall-top">
              <span className="od-feedback-overall-label">{t.overall}</span>
              {rating > 0 && (
                <span className="od-feedback-score-pill">
                  {rating}/5 · {scoreHints[rating]}
                </span>
              )}
            </div>
            <Rate
              value={rating}
              onChange={setRating}
              aria-label={t.overall}
              style={{ fontSize: 28, color: '#f59e0b' }}
            />
          </div>

          <div className="od-feedback-criteria-list">
            {criterionLabels.map(([key, label]) => (
              <div key={key} className="od-feedback-criterion">
                <Typography.Text strong style={{ fontSize: 13 }}>
                  {label}
                </Typography.Text>
                <Rate
                  value={criteria[key]}
                  onChange={(value) =>
                    setCriteria((current) => ({ ...current, [key]: value }))
                  }
                  aria-label={label}
                  style={{ fontSize: 17, color: '#f59e0b' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="od-feedback-comment-col">
          <div>
            <span className="od-feedback-comment-label">{t.comment}</span>
            <Input.TextArea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t.commentPlaceholder}
              maxLength={2000}
              showCount
              autoSize={{ minRows: 5, maxRows: 7 }}
              aria-label={t.comment}
            />
          </div>

          <div>
            {error ? (
              <Alert
                type="error"
                showIcon
                message={error}
                style={{ marginBottom: 10 }}
              />
            ) : null}
            <div className="od-feedback-footer">
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={submit}
              >
                {t.submit}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function SubmittedFeedback({
  feedback,
  labels,
  t,
}: {
  feedback: OrderFeedback
  labels: [CriterionKey, string][]
  t: (typeof orderFeedbackCardMessages)['vi']
}) {
  return (
    <Card
      className="od-feedback-card"
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <StarFilled style={{ color: '#f59e0b' }} />
          {t.title}
        </span>
      }
      size="small"
    >
      <div className="od-feedback-submitted-banner">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#065f46',
            fontWeight: 600,
          }}
        >
          <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
          {t.thanks}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Rate
            disabled
            value={feedback.rating}
            aria-label={t.overall}
            style={{ fontSize: 18, color: '#f59e0b' }}
          />
          <Tag color="gold" style={{ margin: 0, fontWeight: 700 }}>
            {feedback.rating}/5
          </Tag>
        </span>
      </div>

      <div className="od-feedback-criteria-list">
        {labels.map(([key, label]) =>
          feedback[key] ? (
            <div key={key} className="od-feedback-criterion">
              <Typography.Text strong style={{ fontSize: 13 }}>
                {label}
              </Typography.Text>
              <Rate
                disabled
                value={feedback[key] ?? 0}
                aria-label={label}
                style={{ fontSize: 16, color: '#f59e0b' }}
              />
            </div>
          ) : null,
        )}
      </div>

      {feedback.comment ? (
        <div className="od-feedback-quote">“{feedback.comment}”</div>
      ) : null}
    </Card>
  )
}
