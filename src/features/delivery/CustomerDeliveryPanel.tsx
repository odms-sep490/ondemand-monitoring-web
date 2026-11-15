import { VideoThumbnail } from '../../shared/components/media/VideoThumbnail'
import {
  Alert,
  Button,
  Empty,
  Skeleton,
  Space,
  Tag,
  Typography,
  notification,
} from 'antd'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../../shared/api/httpClient'
import {
  requestOriginalMediaDownload,
  startOriginalMediaDownload,
} from '../../shared/api/originalMediaDownload'
import { useI18n } from '../../shared/i18n'
import { deliveryApi } from './api'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'
import { CustomerResultReview } from './CustomerResultReview'
import { ImagePreview } from '../../shared/components/media/ImagePreview'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { Delivery, DeliveryPanelLoadState } from './types'
import { financeApi } from '../finance/api'
import { getActionableHandedOverMilestones } from '../finance/missionMilestoneUtils'
import type { MissionPaymentAllocation } from '../finance/types'
import { DeliveryMissionPaymentCard } from './DeliveryMissionPaymentCard'
import './delivery.css'
import { MissionDeliveryTabs } from './MissionDeliveryTabs'

type CustomerDeliveryPanelProps = {
  orderId: string
  initialDelivery?: Delivery | null
  onOpenPayment?: () => void
  initialMissionId?: string
  onStateChange?: (
    delivery: Delivery | null,
    state: DeliveryPanelLoadState,
  ) => void
  onOpenFinance?: () => void
  onPaymentCompleted?: () => void
}

export function CustomerDeliveryPanel(props: CustomerDeliveryPanelProps) {
  return (
    <MissionDeliveryTabs
      orderId={props.orderId}
      initialMissionId={props.initialMissionId}
    >
      {(missionId) => (
        <ScopedCustomerDeliveryPanel
          {...props}
          missionId={missionId}
          initialDelivery={missionId ? null : props.initialDelivery}
        />
      )}
    </MissionDeliveryTabs>
  )
}

function ScopedCustomerDeliveryPanel({
  orderId,
  initialDelivery = null,
  onStateChange,
  onOpenFinance,
  onPaymentCompleted,
  onOpenPayment,
  missionId,
}: {
  orderId: string
  missionId?: string
  initialDelivery?: Delivery | null
  onOpenPayment?: () => void
  onStateChange?: (
    delivery: Delivery | null,
    state: DeliveryPanelLoadState,
  ) => void
  onOpenFinance?: () => void
  onPaymentCompleted?: () => void
}) {
  const { t } = useI18n(customerDeliveryPanelMessages)
  const [notificationApi, notificationHolder] = notification.useNotification()
  const [delivery, setDelivery] = useState<Delivery | null>(initialDelivery)
  const [loadState, setLoadState] = useState<DeliveryPanelLoadState>(
    initialDelivery ? 'ready' : 'loading',
  )
  const [error, setError] = useState<unknown>(null)
  const [submittedTicket, setSubmittedTicket] = useState<{
    orderId: string
    id: string
    code: string
  } | null>(null)
  const [downloadingMediaId, setDownloadingMediaId] = useState<string | null>(
    null,
  )
  const [missionPayments, setMissionPayments] =
    useState<MissionPaymentAllocation | null>(null)
  const [missionPaymentsLoading, setMissionPaymentsLoading] = useState(false)
  const [payingMilestoneId, setPayingMilestoneId] = useState<string | null>(
    null,
  )
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const currentTicket =
    submittedTicket?.orderId === orderId ? submittedTicket : null

  function handleRevisionSubmitted(ticket: { id: string; code: string }) {
    setSubmittedTicket({ ...ticket, orderId })
    setDelivery((current) =>
      current ? { ...current, deliveryStatus: 'REVISION_REQUESTED' } : current,
    )
    notificationApi.success({
      key: `result-revision-${orderId}`,
      placement: 'topRight',
      duration: 5,
      message: t.revisionSentTitle,
      description: (
        <a href={`#help/tickets/${encodeURIComponent(ticket.id)}`}>
          {t.viewSubmittedTicket(ticket.code)}
        </a>
      ),
    })
  }

  async function downloadOriginal(mediaId: string) {
    setDownloadingMediaId(mediaId)
    try {
      const response = await requestOriginalMediaDownload(mediaId)
      startOriginalMediaDownload(response.downloadUrl)
    } catch {
      notificationApi.error({
        placement: 'topRight',
        message: t.downloadFailed,
      })
    } finally {
      setDownloadingMediaId(null)
    }
  }

  useEffect(() => {
    if (delivery?.deliveryStatus !== 'REVISION_REQUESTED' || currentTicket)
      return
    let cancelled = false
    // Restore the persistent ticket shortcut without replaying the success toast.
    void deliveryApi
      .getResultReview(orderId, undefined, missionId)
      .then((review) => {
        if (!cancelled && review.existingRequest) {
          setSubmittedTicket({
            orderId,
            id: review.existingRequest.ticketId,
            code: review.existingRequest.ticketCode,
          })
        }
      })
      .catch(() => {
        /* Legacy deliveries may not have a structured review round. */
      })
    return () => {
      cancelled = true
    }
  }, [orderId, missionId, delivery?.deliveryStatus, currentTicket])

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoadState('loading')
        setError(null)
      }
      try {
        const summary = await deliveryApi.get(orderId, undefined, missionId)
        let detailed = summary
        try {
          if (summary.deliveryStatus === 'DELIVERED') {
            detailed = await deliveryApi.originals(
              orderId,
              undefined,
              missionId,
            )
          } else if (summary.previewReleasedAt) {
            detailed = await deliveryApi.previews(orderId, undefined, missionId)
          }
        } catch (cause) {
          // Keep the real summary status visible if the optional asset endpoint
          // has no files for this delivery state yet.
          if (!isNotReady(cause)) throw cause
        }
        setDelivery(detailed)
        setLoadState('ready')
        setError(null)
      } catch (cause) {
        if (isNotReady(cause)) {
          setDelivery(null)
          setLoadState('unavailable')
          setError(null)
          return
        }
        setLoadState('error')
        setError(cause)
      }
    },
    [orderId, missionId],
  )

  const isDeliveredStatus = delivery?.deliveryStatus === 'DELIVERED'
  const deliveryAssetCount = delivery?.assets.length ?? 0
  const deliveryDownloadableCount =
    delivery?.assets.filter((asset) => asset.downloadable).length ?? 0
  const needsMissionPayment = Boolean(
    delivery &&
      (delivery.deliveryStatus === 'AWAITING_MISSION_PAYMENT' ||
        (isDeliveredStatus &&
          (deliveryAssetCount === 0 ||
            deliveryDownloadableCount < deliveryAssetCount))),
  )

  const loadMissionPayments = useCallback(
    async (signal?: AbortSignal) => {
      if (!needsMissionPayment) {
        setMissionPayments(null)
        setMissionPaymentsLoading(false)
        return
      }
      setMissionPaymentsLoading(true)
      try {
        const allocation = await financeApi.getCustomerMissionPaymentAllocations(
          orderId,
          signal,
        )
        if (!signal?.aborted) setMissionPayments(allocation)
      } catch {
        if (!signal?.aborted) setMissionPayments(null)
      } finally {
        if (!signal?.aborted) setMissionPaymentsLoading(false)
      }
    },
    [orderId, needsMissionPayment],
  )

  useEffect(() => {
    if (!needsMissionPayment) {
      setMissionPayments(null)
      setMissionPaymentsLoading(false)
      return
    }
    const controller = new AbortController()
    void loadMissionPayments(controller.signal)
    return () => controller.abort()
  }, [loadMissionPayments, needsMissionPayment])

  async function handlePayMission(milestoneId: string) {
    setPayingMilestoneId(milestoneId)
    setPaymentError(null)
    try {
      const payment = await financeApi.createMissionPayment(milestoneId)
      if (!payment.paymentUrl) {
        throw new Error(t.missionPaymentMissingUrl)
      }
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setPaymentError(
        cause instanceof Error ? cause.message : t.missionPaymentError,
      )
      setPayingMilestoneId(null)
    }
  }

  async function handleTestPayMission(milestoneId: string) {
    setPayingMilestoneId(milestoneId)
    setPaymentError(null)
    try {
      await financeApi.completeTestMissionPayment(milestoneId)
      await Promise.all([load(false), loadMissionPayments()])
      onPaymentCompleted?.()
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.code === 'INVALID_REQUEST' &&
        cause.message.toLowerCase().includes('test payment is disabled')
      ) {
        setPaymentError(t.missionTestPaymentDisabled)
      } else {
        setPaymentError(
          cause instanceof Error ? cause.message : t.missionPaymentError,
        )
      }
    } finally {
      setPayingMilestoneId(null)
    }
  }

  useEffect(() => {
    void load()
    const refreshVisibleState = () => {
      if (document.visibilityState !== 'visible') return
      void load()
      if (needsMissionPayment) void loadMissionPayments()
    }
    const interval = window.setInterval(() => {
      void load()
      if (needsMissionPayment) void loadMissionPayments()
    }, 15_000)
    document.addEventListener('visibilitychange', refreshVisibleState)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshVisibleState)
    }
  }, [load, loadMissionPayments, needsMissionPayment])

  useEffect(() => {
    if (!onStateChange) return
    if (!missionId) {
      onStateChange(delivery, loadState)
      return
    }
    const controller = new AbortController()
    void deliveryApi.get(orderId, controller.signal).then(
      (summary) => {
        if (!controller.signal.aborted) onStateChange(summary, 'ready')
      },
      () => {
        if (!controller.signal.aborted) onStateChange(null, 'error')
      },
    )
    return () => controller.abort()
  }, [delivery, loadState, onStateChange, orderId, missionId])

  if (!delivery) {
    return (
      <section
        id="customer-delivery-panel"
        className="ui-card delivery-shell delivery-customer delivery-empty-state"
        aria-labelledby="delivery-title"
        aria-busy={loadState === 'loading'}
        tabIndex={-1}
      >
        {notificationHolder}
        <header className="delivery-hero">
          <div className="delivery-hero__copy">
            <span className="delivery-eyebrow">{t.eyebrow}</span>
            <h2 id="delivery-title">{t.title}</h2>
            <p>{t.subtitle}</p>
          </div>
        </header>
        {loadState === 'loading' ? (
          <div className="delivery-empty-state__body" role="status">
            <Skeleton active paragraph={{ rows: 2 }} />
            <span className="odm-visually-hidden">{t.loading}</span>
          </div>
        ) : loadState === 'unavailable' ? (
          <div className="delivery-empty-state__body">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t.noDelivery}
            />
          </div>
        ) : (
          <div className="delivery-empty-state__body">
            <Alert
              type="error"
              showIcon
              message={message(error, t)}
              action={
                <Button type="link" onClick={() => void load(true)}>
                  {t.retry}
                </Button>
              }
            />
          </div>
        )}
      </section>
    )
  }

  const canReview = delivery.deliveryStatus === 'CUSTOMER_REVIEW'
  const downloadableCount = delivery.assets.filter(
    (asset) => asset.downloadable,
  ).length
  const hasAssets = delivery.assets.length > 0
  const isDelivered = delivery.deliveryStatus === 'DELIVERED'
  const allOriginalsAvailable =
    isDelivered && hasAssets && downloadableCount === delivery.assets.length
  const hasSomeOriginalsAvailable = isDelivered && downloadableCount > 0
  const acceptedAwaitingPayment = isDelivered && !hasSomeOriginalsAvailable
  const partiallyDownloadable =
    isDelivered && hasSomeOriginalsAvailable && !allOriginalsAvailable
  const actionableMilestone = needsMissionPayment
    ? (getActionableHandedOverMilestones(missionPayments, missionId)[0] ?? null)
    : null
  return (
    <section
      id="customer-delivery-panel"
      className="ui-card delivery-shell delivery-customer"
      aria-labelledby="delivery-title"
      aria-busy={loadState === 'loading'}
      tabIndex={-1}
    >
      {notificationHolder}
      <header className="delivery-hero">
        <div className="delivery-hero__copy">
          <span className="delivery-eyebrow">{t.eyebrow}</span>
          <h2 id="delivery-title">{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <span role="status" aria-live="polite">
          <DeliveryStatusPill
            status={delivery.deliveryStatus}
            label={
              acceptedAwaitingPayment
                ? t.acceptedAwaitingPayment
                : partiallyDownloadable
                  ? t.originalsPartial(
                      downloadableCount,
                      delivery.assets.length,
                    )
                  : undefined
            }
            tone={
              acceptedAwaitingPayment || partiallyDownloadable
                ? 'warning'
                : undefined
            }
          />
        </span>
      </header>
      <DeliveryProgress
        status={delivery.deliveryStatus}
        originalsAvailable={allOriginalsAvailable}
      />
      <div className="delivery-content">
        {needsMissionPayment ? (
          <div className="delivery-status-first">
            <DeliveryMissionPaymentCard
              milestone={actionableMilestone}
              loading={missionPaymentsLoading}
              isAwaitingConfirmation={
                delivery.deliveryStatus === 'AWAITING_MISSION_PAYMENT'
              }
              partiallyDownloadable={partiallyDownloadable}
              downloadableCount={downloadableCount}
              totalAssets={delivery.assets.length}
              paying={payingMilestoneId !== null}
              error={paymentError}
              onPay={(id) => void handlePayMission(id)}
              onTestPay={(id) => void handleTestPayMission(id)}
              onOpenFinance={onOpenFinance ?? onOpenPayment}
            />
          </div>
        ) : delivery.deliveryStatus === 'FINAL_PAYMENT_PENDING' ||
          delivery.deliveryStatus === 'READY_FOR_DELIVERY' ||
          delivery.deliveryStatus === 'PAYMENT_CONFIRMED' ? (
          <div className="delivery-status-first">
            <StatusBanner
              tone="success"
              title={t.resultsAcceptedTitle}
              text={t.resultsAcceptedText}
            />
          </div>
        ) : null}
        {delivery.assets.length > 0 ? (
          <section
            className="delivery-section"
            aria-labelledby="customer-assets-title"
          >
            <div className="delivery-section__head">
              <div>
                <h3 id="customer-assets-title">
                  {allOriginalsAvailable
                    ? t.originals
                    : partiallyDownloadable
                      ? t.deliveredAssets
                      : t.previews}
                </h3>
                <p>
                  {allOriginalsAvailable
                    ? t.filesReady(delivery.assets.length)
                    : partiallyDownloadable
                      ? t.originalsPartial(
                          downloadableCount,
                          delivery.assets.length,
                        )
                      : canReview
                        ? t.filesCheck(delivery.assets.length)
                        : t.previewCount(delivery.assets.length)}
                </p>
              </div>
              <span
                className={`delivery-access-badge${hasSomeOriginalsAvailable ? ' is-original' : ''}`}
              >
                {allOriginalsAvailable
                  ? t.badgeOriginal
                  : partiallyDownloadable
                    ? t.originalsPartial(
                        downloadableCount,
                        delivery.assets.length,
                      )
                    : t.badgePreview}
              </span>
            </div>
            <div className="delivery-grid">
              {delivery.assets.map((asset) => (
                <article key={asset.id} className="delivery-asset">
                  {asset.previewUrl ? (
                    asset.type.toUpperCase().includes('VIDEO') ? (
                      <VideoThumbnail
                        poster={asset.thumbnailUrl}
                        src={asset.previewUrl}
                        mediaId={asset.id}
                        fileName={asset.fileName}
                        fileSize={asset.size}
                        original={asset.previewStatus !== 'READY'}
                      />
                    ) : (
                      <ImagePreview
                        src={asset.thumbnailUrl ?? asset.previewUrl}
                        mediaId={asset.id}
                        fileSize={asset.size}
                        original={asset.previewStatus !== 'READY'}
                        previewSrc={asset.previewUrl}
                        fileName={asset.fileName}
                      />
                    )
                  ) : (
                    <span className="delivery-preview-pending">
                      {asset.previewStatus === 'FAILED'
                        ? t.previewFailed
                        : asset.previewStatus === 'UNSUPPORTED'
                          ? t.previewUnsupported
                          : t.previewPending}
                    </span>
                  )}
                  <div className="delivery-asset__meta">
                    <strong title={asset.fileName}>{asset.fileName}</strong>
                    <small>
                      {asset.type.toUpperCase().includes('VIDEO')
                        ? t.video
                        : t.image}{' '}
                      · {formatBytes(asset.size, t.unknownSize)}
                    </small>
                  </div>
                  {asset.downloadable ? (
                    <Button
                      className="delivery-download"
                      loading={downloadingMediaId === asset.id}
                      disabled={
                        downloadingMediaId !== null &&
                        downloadingMediaId !== asset.id
                      }
                      onClick={() => void downloadOriginal(asset.id)}
                    >
                      {t.download}
                    </Button>
                  ) : (
                    <span className="delivery-preview-note">
                      {t.previewNote}
                    </span>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {delivery.assets.length === 0 ? (
          <div className="delivery-empty-state__body" role="status">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t.noAssets}
            />
          </div>
        ) : null}

        {delivery.deliveryNotes ? (
          <div className="delivery-manager-note">
            <span>{t.managerNote}</span>
            <p>{delivery.deliveryNotes}</p>
          </div>
        ) : null}

        {canReview ? (
          <CustomerResultReview
            orderId={orderId}
            missionId={missionId}
            onComplete={() => void load()}
            onSubmitted={handleRevisionSubmitted}
          />
        ) : null}

        {delivery.deliveryStatus === 'PROCESSING' ? (
          <StatusBanner title={t.processingTitle} text={t.processingText} />
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_MANAGER_REVIEW' ? (
          <StatusBanner
            title={t.managerReviewTitle}
            text={t.managerReviewText}
          />
        ) : null}
        {delivery.deliveryStatus === 'REVISION_REQUESTED' ? (
          <div className="delivery-revision-status" role="status">
            <Space size={[8, 4]} wrap>
              <Tag color="processing">{t.revisionPending}</Tag>
              <Typography.Text type="secondary">
                {t.revisionPendingText}
              </Typography.Text>
            </Space>
            {currentTicket && (
              <Button
                type="link"
                href={`#help/tickets/${encodeURIComponent(currentTicket.id)}`}
              >
                {t.viewSubmittedTicket(currentTicket.code)}
              </Button>
            )}
          </div>
        ) : null}
        {isDelivered && allOriginalsAvailable ? (
          <StatusBanner
            tone="success"
            title={t.deliveredTitle}
            text={t.deliveredText(delivery.assets.length)}
          />
        ) : null}
        {error ? (
          <Alert
            type="error"
            showIcon
            message={message(error, t)}
            action={
              <Button type="link" onClick={() => void load(true)}>
                {t.retry}
              </Button>
            }
          />
        ) : null}
      </div>
    </section>
  )
}

function isNotReady(cause: unknown) {
  return cause instanceof ApiError && [404, 409].includes(cause.status ?? 0)
}

function StatusBanner({
  title,
  text,
  tone = 'info',
  action,
}: {
  title: string
  text: string
  tone?: 'info' | 'warning' | 'success'
  action?: ReactNode
}) {
  return <Alert type={tone} showIcon message={title} description={text} action={action} />
}

function formatBytes(bytes: number, unknown: string) {
  if (!Number.isFinite(bytes) || bytes <= 0) return unknown
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function message(
  cause: unknown,
  t: { networkError: string; genericError: string },
) {
  if (typeof cause === 'string') return cause
  if (cause instanceof ApiError && cause.code === 'NETWORK_ERROR')
    return t.networkError
  return cause instanceof Error ? cause.message : t.genericError
}
