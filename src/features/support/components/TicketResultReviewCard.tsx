import { useEffect, useState } from 'react'
import { Alert, Button, Empty, Skeleton } from 'antd'
import { useI18n, defineMessages } from '../../../shared/i18n'
import { supportApi } from '../api/supportApi'
import type { TicketResultReviewResponse } from '../api/supportApi'

const messages = defineMessages({
  vi: {
    title: 'Kết quả đã đánh giá',
    round: (n: number) => `Đợt ${n}`,
    reason: 'Lý do khách yêu cầu',
    note: 'Ghi chú của khách hàng',
    general: 'Ghi chú chung của khách hàng',
    noFeedback: 'Phiếu này chưa có nội dung đánh giá kết quả.',
    evidence: 'Bằng chứng được chọn',
    unavailable: 'Tệp không còn khả dụng',
    reasons: {
      MISSING_EVIDENCE: 'Thiếu bằng chứng',
      POOR_QUALITY: 'Chất lượng kém',
      WRONG_LOCATION: 'Sai vị trí',
      REQUIREMENT_NOT_MET: 'Chưa đáp ứng yêu cầu',
      OTHER: 'Khác',
    },
    loading: 'Đang tải kết quả đánh giá…',
    retry: 'Thử lại',
    error: 'Không tải được kết quả đánh giá.',
    noOrder: 'Phiếu này không liên kết với kết quả đơn hàng.',
  },
  en: {
    title: 'Reviewed results',
    round: (n: number) => `Round ${n}`,
    reason: 'Customer reason',
    note: 'Customer note',
    general: 'Customer general note',
    noFeedback: 'This ticket has no result review feedback.',
    evidence: 'Selected evidence',
    unavailable: 'File is no longer available',
    reasons: {
      MISSING_EVIDENCE: 'Missing evidence',
      POOR_QUALITY: 'Poor quality',
      WRONG_LOCATION: 'Wrong location',
      REQUIREMENT_NOT_MET: 'Requirement not met',
      OTHER: 'Other',
    },
    loading: 'Loading result review…',
    retry: 'Retry',
    error: 'Could not load the result review.',
    noOrder: 'This ticket is not linked to an order result.',
  },
})

export function TicketResultReviewCard({ ticketId }: { ticketId: string }) {
  const { t } = useI18n(messages)
  const [data, setData] = useState<TicketResultReviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  async function load() {
    setLoading(true)
    setFailed(false)
    try {
      setData(await supportApi.getResultReview(ticketId))
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [ticketId])
  if (loading)
    return (
      <section
        className="sp-card"
        role="status"
        aria-busy="true"
        aria-label={t.loading}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </section>
    )
  if (failed)
    return (
      <Alert
        type="error"
        showIcon
        message={t.error}
        action={
          <Button type="link" onClick={() => void load()}>
            {t.retry}
          </Button>
        }
      />
    )
  if (!data) return null
  const feedbackItems = data.items.filter(
    (item) => item.reasonCode || item.note || item.roundEvidenceIds.length > 0,
  )
  const hasFeedback = Boolean(data.generalNote) || feedbackItems.length > 0
  return (
    <section className="sp-card">
      <h2>
        {t.title} · {t.round(data.roundNumber)}
      </h2>
      {data.generalNote ? (
        <p>
          <b>{t.general}:</b> {data.generalNote}
        </p>
      ) : null}
      {!hasFeedback ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t.noFeedback}
        />
      ) : (
        <>
          {feedbackItems.map((item) => (
            <article key={item.roundItemId}>
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
              {item.reasonCode && (
                <p>
                  <b>{t.reason}:</b> {t.reasons[item.reasonCode]}
                </p>
              )}
              {item.note && (
                <p>
                  <b>{t.note}:</b> {item.note}
                </p>
              )}
              {item.roundEvidenceIds.length > 0 && (
                <div>
                  <b>{t.evidence}:</b>
                  <ul>
                    {item.evidence
                      .filter((e) => item.roundEvidenceIds.includes(e.roundEvidenceId))
                      .map((e) => (
                        <li key={e.roundEvidenceId}>
                          {e.url ? (
                            <a href={e.url} target="_blank" rel="noreferrer">
                              {e.fileName}
                            </a>
                          ) : (
                            <span>{e.fileName} · {t.unavailable}</span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </>
      )}
    </section>
  )
}
