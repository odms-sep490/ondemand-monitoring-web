import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useI18n, defineMessages } from '../../../shared/i18n'
import { supportApi } from '../api/supportApi'
import { ChecklistGuidance } from '../../../shared/components/ChecklistGuidance'
import { DeliveryImagePreview } from '../../delivery/DeliveryImagePreview'
import './TicketResultReviewCard.css'
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
    itemCount: (count: number) => `${count} hạng mục`,
    fileCount: (count: number) => `${count} tệp bằng chứng`,
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
    scopeResponseTitle: 'Phản hồi về phạm vi yêu cầu',
    scopeWaiting: 'Quản lý cho biết hạng mục này nằm ngoài phạm vi đơn hàng. Vui lòng xem lý do bên dưới.',
    scopeAcknowledged: 'Bạn đã xác nhận đã nhận phản hồi này.',
    acknowledge: 'Tôi đã nhận phản hồi',
    acknowledgeFailed: 'Không xác nhận được phản hồi. Vui lòng thử lại.',
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
    itemCount: (count: number) => `${count} checklist items`,
    fileCount: (count: number) => `${count} evidence files`,
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
    scopeResponseTitle: 'Scope decision',
    scopeWaiting: 'The manager marked this checklist item as outside the order scope. Please review the explanation below.',
    scopeAcknowledged: 'You confirmed that you received this response.',
    acknowledge: 'I received this response',
    acknowledgeFailed: 'Could not acknowledge the response. Please retry.',
  },
})

export function TicketResultReviewCard({ ticketId }: { ticketId: string }) {
  const { t } = useI18n(messages)
  const [data, setData] = useState<TicketResultReviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
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
  const orderId = data.orderId
  async function acknowledge(caseItemId: string) {
    setAcknowledgingId(caseItemId)
    try {
      await supportApi.acknowledgeOutOfScope(orderId, caseItemId)
      await load()
    } catch {
      setFailed(true)
    } finally {
      setAcknowledgingId(null)
    }
  }
  return (
    <Card
      className="sp-result-review"
      title={
        <Space wrap>
          <span>{t.title}</span>
          <Tag color="blue">{t.round(data.roundNumber)}</Tag>
        </Space>
      }
      extra={<Tag>{t.itemCount(feedbackItems.length)}</Tag>}
    >
      {data.generalNote && (
        <div className="sp-result-review__general">
          <Typography.Text strong>{t.general}</Typography.Text>
          <Typography.Paragraph>{data.generalNote}</Typography.Paragraph>
        </div>
      )}
      {!hasFeedback ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t.noFeedback}
        />
      ) : feedbackItems.length > 0 ? (
        <Collapse
          defaultActiveKey={[feedbackItems[0].roundItemId]}
          expandIconPosition="end"
          items={feedbackItems.map((item) => {
            const selectedEvidence = item.evidence.filter((e) =>
              item.roundEvidenceIds.includes(e.roundEvidenceId),
            )
            return {
              key: item.roundItemId,
              label: (
                <Space wrap>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Tag>{t.fileCount(selectedEvidence.length)}</Tag>
                </Space>
              ),
              children: (
                <Space
                  direction="vertical"
                  size={16}
                  className="sp-result-review__body"
                >
                  <Descriptions
                    size="small"
                    layout="vertical"
                    column={{ xs: 1, sm: 2 }}
                    items={[
                      {
                        key: 'reason',
                        label: t.reason,
                        children: (
                          <Tag color="gold">
                            {t.reasons[item.reasonCode] ?? t.reasons.OTHER}
                          </Tag>
                        ),
                      },
                      {
                        key: 'note',
                        label: t.note,
                        children: (
                          <Typography.Paragraph className="sp-result-review__note">
                            {item.note}
                          </Typography.Paragraph>
                        ),
                      },
                    ]}
                  />
                  <ChecklistGuidance guidance={item} />
                  {selectedEvidence.length > 0 && (
                    <div>
                      <Typography.Text strong>{t.evidence}</Typography.Text>
                      <div className="sp-result-review__media">
                        {selectedEvidence.map((e) => (
                          <div
                            className="sp-result-review__asset"
                            key={e.roundEvidenceId}
                          >
                            {e.url ? (
                              e.type.toUpperCase().includes('VIDEO') ? (
                                <video
                                  controls
                                  preload="metadata"
                                  src={e.url}
                                  aria-label={e.fileName}
                                />
                              ) : (
                                <DeliveryImagePreview
                                  src={e.url}
                                  fileName={e.fileName}
                                />
                              )
                            ) : (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={t.unavailable}
                              />
                            )}
                            {e.url ? (
                              <Typography.Link
                                href={e.url}
                                target="_blank"
                                rel="noreferrer"
                                ellipsis
                                title={e.fileName}
                              >
                                {e.fileName}
                              </Typography.Link>
                            ) : (
                              <Typography.Text
                                ellipsis={{ tooltip: e.fileName }}
                              >
                                {e.fileName}
                              </Typography.Text>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Space>
              ),
            }
          })}
        />
      ) : null}
      {(data.outOfScopeItems ?? []).length > 0 && (
        <section className="sp-result-review__scope" aria-label={t.scopeResponseTitle}>
          <Typography.Title level={5}>{t.scopeResponseTitle}</Typography.Title>
          {(data.outOfScopeItems ?? []).map((item) => (
            <Alert
              key={item.caseItemId}
              type={item.status === 'OUT_OF_SCOPE_ACKNOWLEDGED' ? 'success' : 'warning'}
              showIcon
              message={item.title}
              description={
                <Space direction="vertical" size={8}>
                  <span>{item.explanation}</span>
                  {item.canAcknowledge ? (
                    <>
                      <span>{t.scopeWaiting}</span>
                      <Button
                        type="primary"
                        loading={acknowledgingId === item.caseItemId}
                        disabled={acknowledgingId !== null}
                        onClick={() => void acknowledge(item.caseItemId)}
                      >
                        {t.acknowledge}
                      </Button>
                    </>
                  ) : item.status === 'OUT_OF_SCOPE_ACKNOWLEDGED' ? (
                    <span>{t.scopeAcknowledged}</span>
                  ) : null}
                </Space>
              }
            />
          ))}
        </section>
      )}
    </Card>
  )
}
