import { VideoPreview } from '../../../shared/components/media/VideoPreview'
import { ImagePreview } from '../../../shared/components/media/ImagePreview'
import { MediaInspectionAction } from './MediaInspectionAction'
import { ResilientMedia } from '../../../shared/components/media/MediaRecovery'
import { VideoPoster } from '../../../shared/components/media/VideoThumbnail'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import {
  operatorMissionMediaApi,
  type UploadedMissionMedia,
  type UploadedMissionMediaPage,
} from '../api/operatorMissionMediaApi'

import type {
  MissionMediaReader,
  MissionMediaReviewStatus,
} from '../types/missionMedia'
import { missionUploadedMediaMessages } from './MissionUploadedMedia.messages'
import './MissionUploadedMedia.css'

type MissionMediaMessages = (typeof missionUploadedMediaMessages)['vi']

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const isReference = (item: UploadedMissionMedia) =>
  item.sourceType === 'MAPILLARY_REFERENCE'

const formatCapturedAt = (
  value: string | null,
  locale: 'vi-VN' | 'en-US',
  labels: MissionMediaMessages,
) => {
  if (!value) return labels.missingCaptureTime
  const capturedAt = new Date(value)
  if (Number.isNaN(capturedAt.getTime())) return labels.unknownCaptureTime
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(capturedAt)
}

export function MissionUploadedMedia({
  missionId,
  reader = operatorMissionMediaApi,
  reviewStatus,
  approveMedia,
  missionStatus,
  onChanged,
  refreshKey,
}: {
  missionId: string
  reader?: MissionMediaReader
  reviewStatus?: MissionMediaReviewStatus | null
  approveMedia?: (mediaId: string) => Promise<unknown>
  missionStatus?: string
  onChanged?: () => void
  refreshKey?: unknown
}) {
  return (
    <Gallery
      key={missionId}
      missionId={missionId}
      reader={reader}
      reviewStatus={reviewStatus ?? null}
      approveMedia={approveMedia}
      missionStatus={missionStatus}
      onChanged={onChanged}
      refreshKey={refreshKey}
    />
  )
}

function Gallery({
  missionId,
  reader,
  reviewStatus,
  approveMedia,
  missionStatus,
  onChanged,
  refreshKey,
}: {
  missionId: string
  reader: MissionMediaReader
  reviewStatus: MissionMediaReviewStatus | null
  approveMedia?: (mediaId: string) => Promise<unknown>
  missionStatus?: string
  onChanged?: () => void
  refreshKey?: unknown
}) {
  const { t, locale } = useI18n(missionUploadedMediaMessages)
  const [approving, setApproving] = useState<string | null>(null)
  const [approved, setApproved] = useState<string[]>([])
  async function approve(mediaId: string) {
    if (!approveMedia || approving) return
    setApproving(mediaId)
    setError(null)
    try {
      await approveMedia(mediaId)
      setApproved((ids) => [...ids, mediaId])
    } catch {
      setError('approveError')
    } finally {
      setApproving(null)
      onChanged?.()
    }
  }
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<UploadedMissionMediaPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'approveError' | 'loadError' | 'previewPending' | 'previewError' | null>(null)
  const [selected, setSelected] = useState<UploadedMissionMedia | null>(null)
  const [opening, setOpening] = useState(false)
  const previewRequest = useRef<AbortController | null>(null)
  const beforeFlight = [
    'PLANNING',
    'CREATED',
    'WAITING_DEPOSIT',
    'PENDING_CONFIRMATION',
    'RESOURCE_ASSIGNING',
    'WAITING_OPERATOR_ACCEPTANCE',
    'READY',
    'SCHEDULED',
    'CONNECTED',
    'PREFLIGHT_CHECKING',
    'READY_TO_FLY',
  ].includes(missionStatus ?? '')

  const loadedScope = useRef<string | null>(null)
  useEffect(() => {
    const abort = new AbortController()
    // Only the first load of a Mission/page replaces the list with a placeholder; background refreshes keep it on screen.
    const scope = `${missionId}:${page}`
    if (loadedScope.current !== scope) {
      loadedScope.current = scope
      setLoading(true)
    }
    setError(null)
    void reader
      .list(missionId, page, abort.signal)
      .then((result) => {
        if (!abort.signal.aborted) setData(result)
      })
      .catch(() => {
        if (abort.signal.aborted) return
        setError('loadError')
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [missionId, page, revision, reader, refreshKey, t.loadError])

  useEffect(() => () => previewRequest.current?.abort(), [])

  async function open(item: UploadedMissionMedia) {
    previewRequest.current?.abort()
    const abort = new AbortController()
    previewRequest.current = abort
    setOpening(true)
    setError(null)
    try {
      const fresh = await reader.get(missionId, item.mediaId, abort.signal)
      if (!abort.signal.aborted) {
        if (fresh.previewUrl) setSelected(fresh)
        else setError('previewPending')
      }
    } catch {
      if (!abort.signal.aborted) setError('previewError')
    } finally {
      if (!abort.signal.aborted) setOpening(false)
    }
  }

  function close() {
    previewRequest.current?.abort()
    setOpening(false)
    setSelected(null)
  }

  return (
    <section className="odm-card mission-media" aria-label={t.sectionLabel}>
      <div className="odm-card-body mission-media__body">
        <header className="mission-media__header">
          <div>
            <span className="mission-media__eyebrow">{t.eyebrow}</span>
            <div className="mission-media__title-row">
              <h3>{t.title}</h3>
              {data ? (
                <span
                  className="mission-media__count"
                  aria-label={t.mediaCount(data.totalItems)}
                >
                  {data.totalItems}
                </span>
              ) : null}
              {reviewStatus ? (
                <ReviewStatusBadge status={reviewStatus} labels={t} />
              ) : null}
            </div>
            <p>{t.description}</p>
          </div>
          <button
            type="button"
            className="odm-btn mission-media__refresh"
            disabled={loading}
            onClick={() => {
              setRevision((value) => value + 1)
              onChanged?.()
            }}
          >
            <Icon name="activity" width={16} height={16} aria-hidden="true" />
            {t.refresh}
          </button>
        </header>
        {error ? (
          <div
            className="mission-media__state mission-media__state--error"
            role="alert"
          >
            <span>{error ? t[error] : null}</span>
            <button
              type="button"
              className="odm-btn"
              onClick={() => {
                setRevision((value) => value + 1)
                onChanged?.()
              }}
            >
              {t.retry}
            </button>
          </div>
        ) : null}
        {loading ? (
          <div className="mission-media__state" role="status">
            <span className="mission-media__spinner" aria-hidden="true" />
            {t.loading}
          </div>
        ) : null}
        {opening ? (
          <p className="mission-media__opening" role="status">
            {t.opening}
          </p>
        ) : null}
        {!loading && !error && data?.items.length === 0 ? (
          <div className="mission-media__empty">
            <span className="mission-media__empty-icon">
              <Icon name="camera" width={28} height={28} aria-hidden="true" />
            </span>
            <strong>{t.emptyTitle}</strong>
            <span>{beforeFlight ? t.emptyBeforeFlight : t.empty}</span>
          </div>
        ) : null}
        {!loading && !error && data ? (
          <>
            <div className="mission-media__grid">
              {data.items.map((item) => (
                <article key={item.mediaId} className="mission-media__card">
                  <button
                    type="button"
                    className="mission-media__preview"
                    disabled={opening || !item.previewUrl}
                    aria-label={t.open(item.fileName)}
                    title={t.open(item.fileName)}
                    onClick={() => void open(item)}
                  >
                    {!item.previewUrl ? (
                      <span className="mission-media__video-placeholder">
                        {t.previewPreparing}
                      </span>
                    ) : item.mediaType === 'IMAGE' ? (
                      <img
                        src={item.thumbnailUrl ?? item.previewUrl!}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <VideoPoster poster={item.thumbnailUrl} />
                    )}
                    <span className="mission-media__type">
                      {isReference(item)
                        ? t.mapillary
                        : item.sourceType === 'SATELLITE_SNAPSHOT'
                          ? t.satellite
                          : item.sourceType === 'DRONE_CAMERA'
                            ? t.droneCamera
                            : item.sourceType === 'MANUAL_UPLOAD'
                              ? t.manualUpload
                              : item.mediaType === 'IMAGE'
                                ? t.image
                                : t.video}
                    </span>
                    <span className="mission-media__open-label">
                      {item.previewUrl ? t.openMedia : t.previewPreparing}
                    </span>
                  </button>
                  <div className="mission-media__card-body">
                    <MediaInspectionAction missionId={missionId} mediaId={item.mediaId}
                      mediaType={item.mediaType} fileName={item.fileName} />
                    <h4 title={item.fileName}>{item.fileName}</h4>
                    {approveMedia &&
                    (!item.status ||
                      item.status === 'PENDING_MANAGER_APPROVAL') ? (
                      <button
                        type="button"
                        className="odm-btn"
                        disabled={
                          approving !== null || approved.includes(item.mediaId)
                        }
                        onClick={() => void approve(item.mediaId)}
                      >
                        {approved.includes(item.mediaId)
                          ? t.approveInSession
                          : approving === item.mediaId
                            ? t.approving
                            : t.approveForCustomer}
                      </button>
                    ) : null}
                    {item.status === 'AVAILABLE' ||
                    approved.includes(item.mediaId) ? (
                      <span className="mission-media__review-badge mission-media__review-badge--approved is-compact">
                        {t.approved}
                      </span>
                    ) : null}
                    <div className="mission-media__meta">
                      <span>{formatFileSize(item.fileSize)}</span>
                    </div>
                    {isReference(item) ? (
                      <p className="mission-media__reference">
                        {item.sourceDistanceMeters != null
                          ? t.referenceDistance(
                              Math.round(item.sourceDistanceMeters),
                            )
                          : t.reference}
                        {item.captureLatitude != null &&
                        item.captureLongitude != null
                          ? t.droneLocation(
                              item.captureLatitude.toFixed(5),
                              item.captureLongitude.toFixed(5),
                            )
                          : ''}
                      </p>
                    ) : null}
                    <time
                      dateTime={
                        item.capturedAt &&
                        !Number.isNaN(new Date(item.capturedAt).getTime())
                          ? item.capturedAt
                          : undefined
                      }
                    >
                      <Icon
                        name="clock"
                        width={14}
                        height={14}
                        aria-hidden="true"
                      />
                      {formatCapturedAt(item.capturedAt, locale, t)}
                    </time>
                  </div>
                </article>
              ))}
            </div>
            {data.totalPages > 1 ? (
              <nav className="mission-media__pager" aria-label={t.pagerLabel}>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={data.first}
                  onClick={() => setPage((value) => value - 1)}
                >
                  {t.previousPage}
                </button>
                <span>
                  {t.page(data.totalPages ? data.page + 1 : 0, data.totalPages)}
                </span>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={data.last}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t.nextPage}
                </button>
              </nav>
            ) : null}
          </>
        ) : null}
        {selected?.previewUrl && selected.mediaType === 'IMAGE' && (
          <ImagePreview
            src={selected.thumbnailUrl ?? selected.previewUrl}
            previewSrc={selected.previewUrl}
            fileName={selected.fileName}
            fallbackUrl={null}
            visible
            viewerOnly
            onVisibleChange={(visible) => { if (!visible) close() }}
          />
        )}
        <VideoPreview
          open={Boolean(selected && selected.mediaType === 'VIDEO')}
          onClose={close}
          fileName={selected?.fileName ?? ''}
        >
          {selected?.previewUrl ? (
            <>
              {error ? <p role="alert">{error ? t[error] : null}</p> : null}
                  <ResilientMedia
                    kind="video"
                    expanded
                    src={selected.previewUrl}
                    poster={selected.thumbnailUrl}
                    fileName={selected.fileName}
                    fallbackUrl={null}
                  />
            </>
          ) : null}
        </VideoPreview>
      </div>
    </section>
  )
}

function ReviewStatusBadge({
  status,
  compact = false,
  labels,
}: {
  status: MissionMediaReviewStatus
  compact?: boolean
  labels: MissionMediaMessages
}) {
  const tone =
    status === 'APPROVED'
      ? 'approved'
      : status === 'REJECTED'
        ? 'rejected'
        : 'pending'
  return (
    <span
      className={`mission-media__review-badge mission-media__review-badge--${tone}${compact ? ' is-compact' : ''}`}
    >
      {labels.resultStatus[status]}
    </span>
  )
}
