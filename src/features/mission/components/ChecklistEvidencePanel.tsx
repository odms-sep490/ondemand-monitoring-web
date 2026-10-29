import { useEffect, useRef, useState } from 'react'
import {
  evidenceCountLabel,
  evidenceShortfall,
  isPerTypeEvidence,
} from '../lib/evidenceProgress'
import { ApiError } from '../../../shared/api/httpClient'
import { createPortal } from 'react-dom'
import { operatorHref } from '../../drone-operator/routes'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import type {
  EvidenceBlockingReason,
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../types/checklistExecution'
import { useI18n } from '../../../shared/i18n'
import { evidencePanelMessages } from './ChecklistEvidencePanel.messages'
import './ChecklistEvidencePanel.css'

/** Vietnamese labels, kept for callers outside React; components read the current language. */
export const evidenceReason: Record<EvidenceBlockingReason, string> =
  evidencePanelMessages.vi.reasons
function matchesEvidenceType(
  required: MissionChecklistExecution['requiredEvidenceType'],
  mediaType: string,
) {
  switch (required ?? 'IMAGE_OR_VIDEO') {
    case 'IMAGE':
      return mediaType === 'IMAGE'
    case 'VIDEO':
      return mediaType === 'VIDEO'
    default:
      return mediaType === 'IMAGE' || mediaType === 'VIDEO'
  }
}

type PanelMessages = (typeof evidencePanelMessages)['vi']

const evidenceTypeLabel = (
  t: PanelMessages,
  type?: MissionChecklistExecution['requiredEvidenceType'],
) => {
  switch (type ?? 'IMAGE_OR_VIDEO') {
    case 'IMAGE':
      return t.evidenceType.IMAGE
    case 'VIDEO':
      return t.evidenceType.VIDEO
    case 'IMAGE_AND_VIDEO':
      return t.evidenceType.IMAGE_AND_VIDEO
    default:
      return t.evidenceType.LEGACY
  }
}

export function ChecklistEvidencePanel(
  props: Parameters<typeof MissionEvidencePanel>[0],
) {
  return (
    <MissionEvidencePanel
      key={`${props.missionId}:${props.item.id}`}
      {...props}
    />
  )
}

function MissionEvidencePanel({
  missionId,
  item,
  canAttach,
  canDetach,
  refresh,
  loadCandidates,
  attachCandidate,
  compact = false,
}: {
  missionId: string
  item: MissionChecklistExecution
  canAttach: boolean
  canDetach: boolean
  refresh: () => void
  loadCandidates?: (page: number) => Promise<EvidenceCandidate[]>
  attachCandidate?: (
    media: EvidenceCandidate,
    item: MissionChecklistExecution,
  ) => Promise<unknown>
  /** Flat list layout for narrow side panels: no nested cards, one status per row. */
  compact?: boolean
}) {
  const { t, locale } = useI18n(evidencePanelMessages)
  const [candidates, setCandidates] = useState<EvidenceCandidate[] | null>(null)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<unknown>(null)
  const request = useRef<{ number: number; abort?: AbortController }>({
    number: 0,
  })
  useEffect(
    () => () => {
      request.current.number++
      request.current.abort?.abort()
    },
    [],
  )
  function closePicker() {
    request.current.number++
    request.current.abort?.abort()
    setPickerOpen(false)
    setMediaLoading(false)
    setCandidates(null)
  }
  async function act(operation: () => Promise<unknown>) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await operation()
      refresh()
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'EVIDENCE_NOT_ELIGIBLE'
          ? t.notEligibleMedia
          : t.updateFailed,
      )
      refresh()
    } finally {
      setBusy(false)
    }
  }
  async function load(nextPage: number) {
    request.current.abort?.abort()
    const abort = new AbortController()
    const number = ++request.current.number
    request.current.abort = abort
    setPickerOpen(true)
    setMediaLoading(true)
    setMediaError(null)
    setCandidates(null)
    setPage(nextPage)
    try {
      const result = await (loadCandidates
        ? loadCandidates(nextPage)
        : checklistEvidenceApi.candidates(missionId, nextPage, abort.signal))
      if (abort.signal.aborted || request.current.number !== number) return
      if (!Array.isArray(result))
        throw new Error('Invalid evidence candidate response')
      setCandidates(result)
      setPage(nextPage)
    } catch (cause) {
      if (!abort.signal.aborted && request.current.number === number)
        setMediaError(cause)
    } finally {
      if (!abort.signal.aborted && request.current.number === number)
        setMediaLoading(false)
    }
  }
  const needle = query.trim().toLowerCase()
  // Backend attachment eligibility is authoritative, not final-approval readiness.
  const everyCandidate = candidates ?? []
  const eligible = everyCandidate.filter((media) => media.attachable)
  // Media that cannot be attached stay visible, greyed out with the reason, so an empty-looking list is never a mystery.
  const shown = [...everyCandidate]
    .filter((media) => !needle || media.fileName.toLowerCase().includes(needle))
    .sort((a, b) => Number(b.attachable) - Number(a.attachable))
  const attached = (media: EvidenceCandidate) =>
    media.alreadyAttachedExecutionIds.includes(item.id) ||
    Boolean(item.evidence?.some((link) => link.mediaId === media.mediaId))
  const allAttached = eligible.length > 0 && eligible.every(attached)
  const hasNext = (candidates?.length ?? 0) >= 50
  const unableToVerify = item.executionStatus === 'UNABLE_TO_VERIFY'
  const configuredRequired = item.minimumEvidenceCount ?? 0
  const have = item.eligibleEvidenceCount ?? 0
  const remaining = evidenceShortfall(item)
  const links = item.evidence ?? []
  const unableExplanation = item.unableToVerifyReason
    ? t.unableWithReason(item.unableToVerifyReason)
    : t.unableNoReason
  const compactBody = (
    <>
      <div className="ce-head">
        <span>
          {t.evidenceHead(evidenceTypeLabel(t, item.requiredEvidenceType))}
        </span>
        <span className="ce-count">
          {isPerTypeEvidence(item)
            ? evidenceCountLabel(item)
            : `${have} / ${configuredRequired}`}
        </span>
      </div>
      {unableToVerify ? (
        <p className="ce-unable-note">{unableExplanation}</p>
      ) : remaining > 0 ? (
        <p className="ce-remaining">{t.missing(remaining)}</p>
      ) : null}
      {item.blockingReasons?.map((reason) => (
        <p key={reason} className="ce-blocker">
          {t.reasons[reason]}
        </p>
      ))}
      {links.length > 0 && (
        <ul className="ce-list">
          {links.map((link) => {
            const status =
              !link.eligibleForOperationalReadiness && link.ineligibilityReason
                ? t.reasons[link.ineligibilityReason]
                : (t.mediaStatuses[
                    (link.mediaStatus ?? '') as keyof typeof t.mediaStatuses
                  ] ??
                  link.mediaStatus ??
                  t.legacy)
            const hasMenu = canDetach
            return (
              <li key={link.evidenceId} className="ce-row">
                <div className="ce-thumb">
                  {link.previewUrl &&
                    (link.mediaType === 'VIDEO' ? (
                      <video src={link.previewUrl} preload="metadata" />
                    ) : (
                      <img
                        src={link.previewUrl}
                        alt={link.fileName}
                        loading="lazy"
                      />
                    ))}
                </div>
                <div className="ce-info">
                  <span className="ce-name" title={link.fileName}>
                    {link.fileName}
                  </span>
                  <span className="ce-meta">
                    {link.mediaType === 'VIDEO' ? t.typeVideo : t.typeImage} •{' '}
                    {t.sources[
                      (link.sourceType ?? '') as keyof typeof t.sources
                    ] ??
                      link.sourceType ??
                      t.unknownLegacy}
                  </span>
                  <span
                    className={`ce-status${link.eligibleForOperationalReadiness ? '' : ' is-warn'}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="ce-actions">
                  {link.previewUrl && (
                    <a
                      className="ce-view"
                      href={link.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.view}
                    </a>
                  )}
                  {hasMenu && (
                    <details className="ce-more">
                      <summary aria-label={t.moreActions}>⋮</summary>
                      <div className="ce-menu">
                        {canDetach && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void act(() =>
                                checklistEvidenceApi.detach(
                                  missionId,
                                  item.id,
                                  link.evidenceId,
                                  item.version,
                                ),
                              )
                            }
                          >
                            {t.detach}
                          </button>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {!unableToVerify &&
        configuredRequired > 0 &&
        have >= configuredRequired && <p className="ce-ok">✓ {t.enough}</p>}
      {canAttach && (
        <button
          type="button"
          className="ce-add"
          title={t.pickTitle}
          disabled={busy}
          onClick={() => void load(0)}
        >
          {t.addMedia}
        </button>
      )}
    </>
  )
  return (
    <section
      className={`checklist-evidence${compact ? ' is-compact' : ''}`}
      aria-label={t.sectionAria(item.content)}
    >
      {compact ? (
        compactBody
      ) : (
        <>
          <strong>
            {t.validCount(
              have,
              configuredRequired,
              evidenceTypeLabel(t, item.requiredEvidenceType),
            )}
          </strong>
          {unableToVerify && (
            <p className="ce-unable-note">{unableExplanation}</p>
          )}
          {!unableToVerify && remaining > 0 && (
            <p className="ce-remaining">{t.missing(remaining)}</p>
          )}
          {!unableToVerify &&
            configuredRequired > 0 &&
            have >= configuredRequired && (
              <p className="ce-ok">✓ {t.enoughValid}</p>
            )}
          {item.blockingReasons?.map((reason) => (
            <p key={reason} className="ce-blocker">
              {t.reasons[reason]}
            </p>
          ))}
          <div className="checklist-evidence-grid">
            {item.evidence?.map((link) => (
              <article key={link.evidenceId}>
                <div className="checklist-evidence-thumb">
                  {link.previewUrl &&
                    (link.mediaType === 'VIDEO' ? (
                      <video
                        src={link.previewUrl}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <a
                        href={link.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={link.previewUrl}
                          alt={link.fileName}
                          loading="lazy"
                        />
                      </a>
                    ))}
                </div>
                <div className="checklist-evidence-main">
                  <div
                    className="checklist-evidence-name"
                    title={link.fileName}
                  >
                    {link.fileName}
                  </div>
                  <div className="checklist-candidate-meta">
                    <span>
                      {t.sources[
                        (link.sourceType ?? '') as keyof typeof t.sources
                      ] ?? t.unknownSource}
                    </span>
                    <span className="checklist-candidate-status">
                      {t.mediaStatuses[
                        (link.mediaStatus ?? '') as keyof typeof t.mediaStatuses
                      ] ?? t.unknownStatus}
                    </span>
                  </div>
                  <small>
                    {new Date(link.capturedAt).toLocaleString(locale)}
                  </small>
                  <p
                    className={`checklist-evidence-note${link.eligibleForOperationalReadiness ? ' is-ok' : ''}`}
                  >
                    {link.eligibleForOperationalReadiness
                      ? t.operational
                      : link.ineligibilityReason
                        ? t.reasons[link.ineligibilityReason]
                        : t.invalid}
                  </p>
                  <div className="checklist-evidence-actions">
                    {canDetach && (
                      <button
                        type="button"
                        className="odm-btn"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            checklistEvidenceApi.detach(
                              missionId,
                              item.id,
                              link.evidenceId,
                              item.version,
                            ),
                          )
                        }
                      >
                        {t.detach}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {canAttach && (
            <button
              type="button"
              className="odm-btn checklist-evidence-add"
              disabled={busy || mediaLoading}
              onClick={() => {
                setQuery('')
                void load(0)
              }}
            >
              {t.addFromMission}
            </button>
          )}
        </>
      )}
      {canAttach &&
        pickerOpen &&
        createPortal(
          <div
            className="checklist-picker"
            role="dialog"
            aria-modal="true"
            aria-label={t.dialogAria}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !busy) closePicker()
            }}
          >
            <div
              className="checklist-picker-backdrop"
              onClick={() => {
                if (!busy) closePicker()
              }}
            />
            <div className="checklist-picker-panel">
              <header className="checklist-picker-head">
                <div>
                  <strong>{t.dialogTitle}</strong>
                  <span>{t.pageOf(item.content, page + 1)}</span>
                </div>
                <button
                  type="button"
                  className="checklist-picker-close"
                  aria-label={t.close}
                  disabled={busy}
                  onClick={closePicker}
                >
                  ×
                </button>
              </header>
              <input
                type="search"
                className="checklist-picker-search"
                aria-label={t.searchAria}
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="checklist-picker-body">
                {mediaLoading && <p role="status">{t.loadingMedia}</p>}
                {mediaError != null && (
                  <div role="alert">
                    <p>{t.loadMediaFailed}</p>
                    <button
                      className="odm-btn"
                      type="button"
                      onClick={() => void load(page)}
                    >
                      {t.retry}
                    </button>
                  </div>
                )}
                {!mediaLoading && mediaError == null && shown.length === 0 && (
                  <p className="checklist-candidates-empty">
                    {needle ? (
                      t.noMatch
                    ) : (
                      <>
                        {t.emptyBefore}
                        <a href={operatorHref({ screen: 'upload', missionId })}>
                          {t.emptyLink}
                        </a>
                        {t.emptyAfter}
                      </>
                    )}
                  </p>
                )}
                {!mediaLoading &&
                  mediaError == null &&
                  allAttached &&
                  shown.length > 0 && (
                    <p className="checklist-candidates-empty">
                      {hasNext || page > 0 ? t.allAttachedPage : t.allAttached}
                    </p>
                  )}
                <ul className="checklist-candidate-list">
                  {shown.map((media) => (
                    <li key={media.mediaId} className="checklist-candidate">
                      <div className="checklist-candidate-thumb">
                        {media.previewUrl ? (
                          media.mediaType === 'VIDEO' ? (
                            <video
                              src={media.previewUrl}
                              controls
                              preload="metadata"
                              aria-label={t.viewVideo(media.fileName)}
                            />
                          ) : (
                            <img
                              src={media.previewUrl}
                              alt={t.preview(media.fileName)}
                              loading="lazy"
                            />
                          )
                        ) : (
                          <span aria-hidden="true">
                            {media.mediaType === 'VIDEO' ? '▶' : '▣'}
                          </span>
                        )}
                      </div>
                      <div className="checklist-candidate-info">
                        <span
                          className="checklist-candidate-name"
                          title={media.fileName}
                        >
                          {media.fileName}
                        </span>
                        <span className="checklist-candidate-meta">
                          <span>
                            {t.sources[
                              (media.sourceType ?? '') as keyof typeof t.sources
                            ] ?? t.unknownSource}
                          </span>
                          <span className="checklist-candidate-status">
                            {t.mediaStatuses[
                              (media.status ??
                                '') as keyof typeof t.mediaStatuses
                            ] ?? t.unknownStatus}
                          </span>
                        </span>
                        <small>
                          {media.mediaType === 'VIDEO'
                            ? t.typeVideo
                            : t.typeImage}
                        </small>
                        <small className="checklist-candidate-time">
                          {new Date(media.capturedAt).toLocaleString(locale)}
                        </small>
                        {!matchesEvidenceType(
                          item.requiredEvidenceType,
                          media.mediaType,
                        ) && (
                          <small>
                            {t.wrongType(
                              evidenceTypeLabel(t, item.requiredEvidenceType),
                            )}
                          </small>
                        )}
                        {(!media.attachable ||
                          !media.eligibleForOperationalReadiness) && (
                          <small>
                            {media.ineligibilityReason
                              ? t.reasons[media.ineligibilityReason]
                              : t.cannotAttach}
                          </small>
                        )}
                      </div>
                      <button
                        type="button"
                        className="odm-btn odm-btn-p"
                        disabled={
                          busy ||
                          !media.attachable ||
                          attached(media) ||
                          !matchesEvidenceType(
                            item.requiredEvidenceType,
                            media.mediaType,
                          )
                        }
                        onClick={() =>
                          void act(async () => {
                            if (attachCandidate) {
                              await attachCandidate(media, item)
                            } else {
                              await checklistEvidenceApi.attach(
                                missionId,
                                item.id,
                                media.mediaId,
                                item.version,
                              )
                            }
                            closePicker()
                          })
                        }
                      >
                        {attached(media) ? t.attached : t.attach}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <footer className="checklist-candidate-pager">
                {(hasNext || page > 0) && (
                  <>
                    <button
                      type="button"
                      className="odm-btn"
                      disabled={busy || mediaLoading || page === 0}
                      onClick={() => void load(page - 1)}
                    >
                      {t.prev}
                    </button>
                    <button
                      type="button"
                      className="odm-btn"
                      disabled={busy || mediaLoading || !hasNext}
                      onClick={() => void load(page + 1)}
                    >
                      {t.next}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="odm-btn"
                  disabled={busy}
                  onClick={closePicker}
                >
                  {t.closePicker}
                </button>
              </footer>
              {error && <p role="alert">{error}</p>}
            </div>
          </div>,
          document.body,
        )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
