import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { Mission } from '../../../types/omss'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../../media/api/operatorMediaApi'
import { inFlightControlMessages } from './InFlightControl.messages'
import './MissionCapturedMediaPanel.css'

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatCapturedAt(value: string, locale: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date)
}

export function MissionCapturedMediaPanel({ mission }: { mission: Mission }) {
  const { t, locale } = useI18n(inFlightControlMessages)
  const missionId = mission.backendId ?? mission.id
  const missionAliases = useMemo(
    () =>
      mission.id !== missionId ? [mission.id] : [],
    [mission.id, missionId],
  )
  const [items, setItems] = useState<LocalMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [requestedMediaType, setRequestedMediaType] = useState<
    'IMAGE' | 'VIDEO' | null
  >(null)
  const requestGeneration = useRef(0)

  useEffect(() => {
    const generation = ++requestGeneration.current
    let requestPending = false

    const refresh = async () => {
      if (requestPending) return
      requestPending = true
      setRefreshing(true)

      try {
        const media = await operatorMediaApi.list(missionId, missionAliases)
        if (requestGeneration.current !== generation) return
        setItems(
          media
            .slice()
            .sort(
              (a, b) =>
                new Date(b.capturedAt).getTime() -
                new Date(a.capturedAt).getTime(),
            ),
        )
        setError(null)
      } catch (cause) {
        if (requestGeneration.current !== generation) return
        setError(
          cause instanceof Error ? cause.message : t.mediaPanel.loadFailed,
        )
      } finally {
        requestPending = false
        if (requestGeneration.current === generation) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    setLoading(true)
    setError(null)
    void refresh()
    const timer = window.setInterval(() => void refresh(), 5000)

    return () => {
      requestGeneration.current += 1
      window.clearInterval(timer)
    }
  }, [missionAliases, missionId, reloadKey, t.mediaPanel.loadFailed])

  const imageCount = items.filter((item) => item.mediaType === 'IMAGE').length
  const videoCount = items.filter((item) => item.mediaType === 'VIDEO').length
  const activeMediaType =
    requestedMediaType ??
    (imageCount > 0 || videoCount === 0 ? 'IMAGE' : 'VIDEO')
  const visibleItems = items.filter(
    (item) => item.mediaType === activeMediaType,
  )
  const emptyFilterMessage =
    activeMediaType === 'IMAGE'
      ? t.mediaPanel.emptyImages
      : t.mediaPanel.emptyVideos

  return (
    <aside
      className="mission-control-side mission-captured-media-side"
      aria-label={t.mediaPanel.title}
      style={{
        gridColumn: 3,
        gridRow: '1 / 3',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingRight: 4,
        scrollbarGutter: 'stable',
      }}
    >
      <header className="captured-media__header">
        <div>
          <p className="captured-media__eyebrow">{t.mediaPanel.eyebrow}</p>
          <h2>{t.mediaPanel.title}</h2>
          <p className="captured-media__count">
            {t.mediaPanel.count(imageCount, videoCount)}
          </p>
        </div>
        <button
          type="button"
          className={`captured-media__refresh${refreshing ? ' is-refreshing' : ''}`}
          aria-label={t.mediaPanel.refresh}
          title={t.mediaPanel.refresh}
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={refreshing}
        >
          <span aria-hidden="true">↻</span>
        </button>
      </header>

      <div
        className="captured-media__filters"
        role="group"
        aria-label={t.mediaPanel.filterGroup}
      >
        <button
          type="button"
          className={`captured-media__filter${activeMediaType === 'IMAGE' ? ' is-active' : ''}`}
          aria-label={t.mediaPanel.showImages(imageCount)}
          aria-pressed={activeMediaType === 'IMAGE'}
          onClick={() => setRequestedMediaType('IMAGE')}
        >
          <span>{t.mediaPanel.image}</span>
          <span className="captured-media__filter-count" aria-hidden="true">
            {imageCount}
          </span>
        </button>
        <button
          type="button"
          className={`captured-media__filter${activeMediaType === 'VIDEO' ? ' is-active' : ''}`}
          aria-label={t.mediaPanel.showVideos(videoCount)}
          aria-pressed={activeMediaType === 'VIDEO'}
          onClick={() => setRequestedMediaType('VIDEO')}
        >
          <span>{t.mediaPanel.video}</span>
          <span className="captured-media__filter-count" aria-hidden="true">
            {videoCount}
          </span>
        </button>
      </div>

      {loading && items.length === 0 ? (
        <p className="captured-media__message" role="status">
          {t.mediaPanel.loading}
        </p>
      ) : error && items.length === 0 ? (
        <div className="captured-media__empty" role="alert">
          <strong>{t.mediaPanel.loadFailed}</strong>
          <span>{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="captured-media__empty">
          <span className="captured-media__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4v-11Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <strong>{t.mediaPanel.empty}</strong>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="captured-media__empty">
          <strong>{emptyFilterMessage}</strong>
        </div>
      ) : (
        <div className="captured-media__grid">
          {visibleItems.map((item) => (
            <CapturedMediaCard
              key={item.localMediaId}
              item={item}
              locale={locale}
              imageLabel={t.mediaPanel.image}
              videoLabel={t.mediaPanel.video}
              previewFailedLabel={t.mediaPanel.previewFailed}
            />
          ))}
        </div>
      )}

      {error && items.length > 0 && (
        <p className="captured-media__stale-note" role="status">
          {error}
        </p>
      )}
    </aside>
  )
}

function CapturedMediaCard({
  item,
  locale,
  imageLabel,
  videoLabel,
  previewFailedLabel,
}: {
  item: LocalMedia
  locale: string
  imageLabel: string
  videoLabel: string
  previewFailedLabel: string
}) {
  const [previewFailed, setPreviewFailed] = useState(false)
  const isImage = item.mediaType === 'IMAGE'
  const previewUrl = operatorMediaApi.previewUrl(item.localMediaId)

  return (
    <article className="captured-media__card">
      <div className="captured-media__preview">
        {previewFailed ? (
          <div className="captured-media__preview-failed">
            {previewFailedLabel}
          </div>
        ) : isImage ? (
          <img
            src={previewUrl}
            alt={`${imageLabel}: ${item.fileName}`}
            loading="lazy"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <video
            src={previewUrl}
            controls
            playsInline
            preload="metadata"
            aria-label={`${videoLabel}: ${item.fileName}`}
            onError={() => setPreviewFailed(true)}
          />
        )}
      </div>
      <div className="captured-media__details">
        <span className="captured-media__type">
          {isImage ? imageLabel : videoLabel}
        </span>
        <strong className="captured-media__filename" title={item.fileName}>
          {item.fileName}
        </strong>
        <span className="captured-media__meta">
          {formatCapturedAt(item.capturedAt, locale)} · {formatFileSize(item.fileSize)}
        </span>
      </div>
    </article>
  )
}
