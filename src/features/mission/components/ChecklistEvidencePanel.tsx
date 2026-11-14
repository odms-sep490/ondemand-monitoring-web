import { MediaInspectionAction } from '../../media/components/MediaInspectionAction'
import { evidenceCandidatePage } from '../lib/evidenceCandidatePage'
import { VideoThumbnail } from '../../../shared/components/media/VideoThumbnail'
import { getUploadMediaStatusLabel } from '../../drone-operator/pages/UploadMedia/uploadMediaHelpers'
import { CustomerEvidenceSelection } from './CustomerEvidenceSelection'
import { ChecklistEvidencePicker } from './ChecklistEvidencePicker'
import { getLanguage, useI18n } from '../../../shared/i18n'
import { checklistEvidencePanelMessages } from './ChecklistEvidencePanel.messages'
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
  EvidenceCandidateLoader,
  MissionChecklistExecution,
} from '../types/checklistExecution'
import './ChecklistEvidencePanel.css'

export const getEvidenceReason = (
  reason: EvidenceBlockingReason,
  lang = getLanguage(),
) => checklistEvidencePanelMessages[lang].reasons[reason]
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

const evidenceTypeLabel = (
  type?: MissionChecklistExecution['requiredEvidenceType'],
) => {
  const t = checklistEvidencePanelMessages[getLanguage()]
  switch (type ?? 'IMAGE_OR_VIDEO') {
    case 'IMAGE':
      return t.imageOnly
    case 'VIDEO':
      return t.videoOnly
    case 'IMAGE_AND_VIDEO':
      return t.imageAndVideo
    default:
      return t.imageOrVideo
  }
}

function evidenceFileLabel(fileName: string, mediaType: string) {
  const t = checklistEvidencePanelMessages[getLanguage()]
  const generatedName =
    /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{8,12}(?:\.[\da-z]+)?$/i.test(
      fileName,
    )
  if (!generatedName) return fileName
  return mediaType === 'VIDEO' ? t.evidenceVideo : t.evidenceImage
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
  hideAssessmentRequirement = false,
  canSelectForCustomer = false,
  refresh,
  loadCandidates,
  attachCandidate,
  attachCandidates,
  evidenceDetached,
  compact = false,
}: {
  missionId: string
  item: MissionChecklistExecution
  canAttach: boolean
  canDetach: boolean
  hideAssessmentRequirement?: boolean
  canSelectForCustomer?: boolean
  refresh: () => void
  loadCandidates?: EvidenceCandidateLoader
  attachCandidate?: (
    media: EvidenceCandidate,
    item: MissionChecklistExecution,
  ) => Promise<unknown>
  attachCandidates?: (
    media: EvidenceCandidate[],
    item: MissionChecklistExecution,
  ) => Promise<unknown>
  evidenceDetached?: (executionId: string, mediaId: string) => Promise<void>
  /** Flat list layout for narrow side panels: no nested cards, one status per row. */
  compact?: boolean
}) {
  const { lang, t } = useI18n(checklistEvidencePanelMessages)
  const evidenceReason = t.reasons
  const sourceLabel = t.sources as Record<string, string>
  async function detachEvidence(
    link: NonNullable<MissionChecklistExecution['evidence']>[number],
  ) {
    if (
      !window.confirm(
        lang === 'vi'
          ? t.detachConfirm
          : 'Remove this attachment? S3 cleanup only applies to unused draft files that are not retained in a result.',
      )
    )
      return
    await act(async () => {
      await checklistEvidenceApi.detach(
        missionId,
        item.id,
        link.evidenceId,
        item.version,
      )
      await evidenceDetached?.(item.id, link.mediaId)
    })
  }
  const [candidates, setCandidates] = useState<EvidenceCandidate[] | null>(null)
  const [hasMoreCandidates, setHasMoreCandidates] = useState(false)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<'ineligible' | 'updateFailed' | null>(null)
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
          ? 'ineligible'
          : 'updateFailed',
      )
      refresh()
    } finally {
      setBusy(false)
    }
  }
  async function load(nextPage: number) {
    if (attachCandidates) {
      setPickerOpen(true)
      return
    }
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
        ? loadCandidates(nextPage, abort.signal)
        : checklistEvidenceApi.candidates(missionId, nextPage, abort.signal))
      if (abort.signal.aborted || request.current.number !== number) return
      const loaded = evidenceCandidatePage(result)
      setCandidates(loaded.items)
      setHasMoreCandidates(loaded.hasMore)
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
  const hasNext = hasMoreCandidates
  const unableToVerify = item.executionStatus === 'UNABLE_TO_VERIFY'
  const configuredRequired = item.minimumEvidenceCount ?? 0
  const have = item.eligibleEvidenceCount ?? 0
  const countLabel = isPerTypeEvidence(item)
    ? evidenceCountLabel(item)
    : have || configuredRequired
      ? `${have} / ${configuredRequired}`
      : ''
  const remaining = evidenceShortfall(item)
  const links = item.evidence ?? []
  const unableExplanation = item.unableToVerifyReason
    ? t.unableWithReason(item.unableToVerifyReason)
    : t.unableDefault
  const renderBlockingReasons = () =>
    item.blockingReasons
      ?.filter(
        (reason) =>
          (!hideAssessmentRequirement || reason !== 'ASSESSMENT_REQUIRED') &&
          !(compact && remaining > 0 && reason === 'INSUFFICIENT_EVIDENCE') &&
          !(
            compact && links.some((link) => link.ineligibilityReason === reason)
          ),
      )
      .map((reason) => {
        const assessmentOutOfSync =
          reason === 'ASSESSMENT_REQUIRED' &&
          item.assessmentStatus !== 'NOT_ASSESSED'
        if (assessmentOutOfSync) {
          return (
            <div key={reason} className="ce-blocker is-sync" role="status">
              <span>{t.assessmentOutOfSync} </span>
              <button type="button" onClick={refresh} disabled={busy}>
                {t.reload}{' '}
              </button>
            </div>
          )
        }
        return (
          <p key={reason} className="ce-blocker">
            {evidenceReason[reason]}
          </p>
        )
      })
  const compactBody = (
    <>
      {!canSelectForCustomer && (
        <div className="ce-head">
          <div className="ce-title-row">
            <span className="ce-heading">{t.evidence}</span>
            <span className="ce-type">
              {evidenceTypeLabel(item.requiredEvidenceType)}
            </span>
          </div>
          {countLabel ? <span className="ce-count">{countLabel}</span> : null}
        </div>
      )}
      {unableToVerify ? (
        <p className="ce-unable-note">{unableExplanation}</p>
      ) : remaining > 0 ? (
        <p className="ce-remaining">
          {t.remaining(remaining)}
        </p>
      ) : null}
      {renderBlockingReasons()}
      {!canSelectForCustomer && links.length > 0 && (
        <ul className="ce-list">
          {links.map((link) => {
            const status =
              !link.eligibleForOperationalReadiness && link.ineligibilityReason
                ? evidenceReason[link.ineligibilityReason]
                : getUploadMediaStatusLabel(link.mediaStatus ?? 'Legacy', lang)
            const hasMenu = canDetach
            return (
              <li key={link.evidenceId} className="ce-row">
                <div className="ce-thumb">
                  {(link.localPreviewUrl ?? link.previewUrl) &&
                    (link.mediaType === 'VIDEO' ? (
                      <VideoThumbnail
                        src={(link.localPreviewUrl ?? link.previewUrl)!}
                        poster={link.localPreviewUrl ? link.localThumbnailUrl : link.thumbnailUrl}
                        fileName={link.fileName}
                      />
                    ) : (
                      <img
                        src={link.localPreviewUrl ?? link.thumbnailUrl ?? link.previewUrl ?? undefined}
                        alt={link.fileName}
                        loading="lazy"
                      />
                    ))}
                </div>
                <div className="ce-info">
                  <span className="ce-name" title={link.fileName}>
                    {evidenceFileLabel(link.fileName, link.mediaType)}
                  </span>
                  <span className="ce-meta">
                    {link.mediaType === 'VIDEO' ? t.video : t.image} •{' '}
                    {sourceLabel[link.sourceType ?? ''] ?? t.unknownSource}
                  </span>
                  <span
                    title={status}
                    className={`ce-status${link.eligibleForOperationalReadiness ? '' : ' is-warn'}`}
                  >
                    {link.ineligibilityReason === 'MEDIA_NOT_VALIDATED'
                      ? t.notValidated
                      : link.ineligibilityReason === 'MEDIA_APPROVAL_REQUIRED'
                        ? t.awaitingReview
                        : link.ineligibilityReason === 'MEDIA_REJECTED'
                          ? t.rejected
                          : status}
                  </span>
                </div>
                <div className="ce-actions">
                  <MediaInspectionAction
                    buttonLabel={t.view}
                    className="ce-inspect"
                    missionId={missionId}
                    mediaId={link.mediaId}
                    mediaType={link.mediaType}
                    fileName={link.fileName}
                    localUrl={link.localPreviewUrl}
                    originalReady={Boolean(link.validatedAt && ['AVAILABLE', 'PENDING_MANAGER_APPROVAL', 'REJECTED'].includes(link.mediaStatus ?? ''))}
                  />
                  {hasMenu && (
                    <details className="ce-more">
                      <summary aria-label={t.moreActions}>⋮</summary>
                      <div className="ce-menu">
                        {canDetach && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void detachEvidence(link)}
                          >
                            {t.detach}{' '}
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
      {!canSelectForCustomer &&
        !unableToVerify &&
        configuredRequired > 0 &&
        have >= configuredRequired && <p className="ce-ok">{t.enough}</p>}
      {canAttach && (
        <button
          type="button"
          className="ce-add"
          title={t.pickHint}
          disabled={busy}
          onClick={() => void load(0)}
        >
          <span className="ce-add-icon" aria-hidden="true">
            +
          </span>
          {t.addMedia}{' '}
        </button>
      )}
    </>
  )
  return (
    <section
      className={`checklist-evidence${compact ? ' is-compact' : ''}${canSelectForCustomer ? ' is-customer-selection' : ''}`}
      aria-label={t.evidenceFor(item.content)}
    >
      {canSelectForCustomer && (
        <CustomerEvidenceSelection
          key={`${item.id}:${item.version}`}
          missionId={missionId}
          item={item}
          refresh={refresh}
          mutationBusy={busy}
          onDetach={canDetach ? detachEvidence : undefined}
        />
      )}
      {compact ? (
        compactBody
      ) : (
        <>
          {!canSelectForCustomer &&
            (have !== 0 || configuredRequired !== 0) && (
              <strong>
                {t.validEvidence} {have} / {configuredRequired} ·{' '}
                {evidenceTypeLabel(item.requiredEvidenceType)}
              </strong>
            )}
          {unableToVerify && (
            <p className="ce-unable-note">{unableExplanation}</p>
          )}
          {!unableToVerify && remaining > 0 && (
            <p className="ce-remaining">
              {t.remaining(remaining)}
            </p>
          )}
          {!canSelectForCustomer &&
            !unableToVerify &&
            configuredRequired > 0 &&
            have >= configuredRequired && (
              <p className="ce-ok">{t.enoughValid}</p>
            )}
          {renderBlockingReasons()}
          {!canSelectForCustomer && (
            <div className="checklist-evidence-grid">
              {item.evidence?.map((link) => (
                <article key={link.evidenceId}>
                  <div className="checklist-evidence-thumb">
                    {(link.localPreviewUrl ?? link.previewUrl) &&
                      (link.mediaType === 'VIDEO' ? (
                        <VideoThumbnail
                          src={(link.localPreviewUrl ?? link.previewUrl)!}
                          poster={link.localPreviewUrl ? link.localThumbnailUrl : link.thumbnailUrl}
                          fileName={link.fileName}
                        />
                      ) : (
                        <a
                          href={link.localPreviewUrl ?? link.previewUrl ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={link.localPreviewUrl ?? link.thumbnailUrl ?? link.previewUrl ?? undefined}
                            alt={link.fileName}
                            loading="lazy"
                          />
                        </a>
                      ))}
                  </div>
                  <div className="checklist-evidence-main">
                    <MediaInspectionAction
                    buttonLabel={t.view}
                    className="ce-inspect"
                      missionId={missionId}
                      mediaId={link.mediaId}
                      mediaType={link.mediaType}
                      fileName={link.fileName}
                    localUrl={link.localPreviewUrl}
                    originalReady={Boolean(link.validatedAt && ['AVAILABLE', 'PENDING_MANAGER_APPROVAL', 'REJECTED'].includes(link.mediaStatus ?? ''))}
                    />
                    <div
                      className="checklist-evidence-name"
                      title={link.fileName}
                    >
                      {evidenceFileLabel(link.fileName, link.mediaType)}
                    </div>
                    <div className="checklist-candidate-meta">
                      <span>
                        {sourceLabel[link.sourceType ?? ''] ?? t.unknownSource}
                      </span>
                      <span className="checklist-candidate-status">
                        {getUploadMediaStatusLabel(
                          link.mediaStatus ?? 'Legacy',
                          lang,
                        )}
                      </span>
                    </div>
                    <small>
                      {new Date(link.capturedAt).toLocaleString(
                        lang === 'vi' ? 'vi-VN' : 'en-US',
                      )}
                    </small>
                    <p
                      className={`checklist-evidence-note${link.eligibleForOperationalReadiness ? ' is-ok' : ''}`}
                    >
                      {link.eligibleForOperationalReadiness
                        ? t.operationallyReady
                        : link.ineligibilityReason
                          ? evidenceReason[link.ineligibilityReason]
                          : t.notEligible}
                    </p>
                    <div className="checklist-evidence-actions">
                      {canDetach && (
                        <button
                          type="button"
                          className="odm-btn"
                          disabled={busy}
                          onClick={() => void detachEvidence(link)}
                        >
                          {t.detach}{' '}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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
              {t.addEvidence}{' '}
            </button>
          )}
        </>
      )}
      {canAttach && attachCandidates && (
        <ChecklistEvidencePicker
          missionId={missionId}
          open={pickerOpen}
          requiredType={item.requiredEvidenceType}
          executionId={item.id}
          alreadyAttached={(item.evidence ?? []).map((link) => link.mediaId)}
          loadCandidates={loadCandidates}
          onClose={closePicker}
          onSelect={async (selected) => {
            await attachCandidates(selected, item)
            refresh()
          }}
        />
      )}
      {canAttach &&
        !attachCandidates &&
        pickerOpen &&
        createPortal(
          <div
            className="checklist-picker"
            role="dialog"
            aria-modal="true"
            aria-label={t.pick}
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
                  <strong>{t.pick}</strong>
                  <span>
                    {item.content} · {t.page(page + 1)}
                  </span>
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
                aria-label={t.searchLabel}
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="checklist-picker-body">
                {mediaLoading && <p role="status">{t.loading}</p>}
                {mediaError != null && (
                  <div role="alert">
                    <p>{t.loadFailed}</p>
                    <button
                      className="odm-btn"
                      type="button"
                      onClick={() => void load(page)}
                    >
                      {t.retry}{' '}
                    </button>
                  </div>
                )}
                {!mediaLoading && mediaError == null && shown.length === 0 && (
                  <p className="checklist-candidates-empty">
                    {needle ? (
                      t.noMatches
                    ) : (
                      <>
                        {t.emptyBeforeLink}{' '}
                        <a href={operatorHref({ screen: 'upload', missionId })}>
                          {t.openInspection}{' '}
                        </a>{' '}
                        {t.emptyAfterLink}{' '}
                      </>
                    )}
                  </p>
                )}
                {!mediaLoading &&
                  mediaError == null &&
                  allAttached &&
                  shown.length > 0 && (
                    <p className="checklist-candidates-empty">
                      {hasNext || page > 0 ? t.pageAttached : t.allAttached}
                    </p>
                  )}
                <ul className="checklist-candidate-list">
                  {shown.map((media) => (
                    <li key={media.mediaId} className="checklist-candidate">
                      <div className="checklist-candidate-thumb">
                        {media.previewUrl ? (
                          media.mediaType === 'VIDEO' ? (
                            <VideoThumbnail
                              src={media.previewUrl}
                              poster={media.thumbnailUrl}
                              fileName={media.fileName}
                            />
                          ) : (
                            <img
                              src={media.thumbnailUrl ?? media.previewUrl}
                              alt={t.previewFile(media.fileName)}
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
                            {sourceLabel[media.sourceType ?? ''] ??
                              t.unknownSource}
                          </span>
                          <span className="checklist-candidate-status">
                            {getUploadMediaStatusLabel(
                              media.status ?? 'Legacy',
                              lang,
                            )}
                          </span>
                        </span>
                        <small>
                          {media.mediaType === 'VIDEO' ? t.video : t.image}
                        </small>
                        <small className="checklist-candidate-time">
                          {new Date(media.capturedAt).toLocaleString(
                            lang === 'vi' ? 'vi-VN' : 'en-US',
                          )}
                        </small>
                        {!matchesEvidenceType(
                          item.requiredEvidenceType,
                          media.mediaType,
                        ) && (
                          <small>
                            {t.typeMismatchPrefix}{' '}
                            {evidenceTypeLabel(item.requiredEvidenceType)}).
                          </small>
                        )}
                        {(!media.attachable ||
                          !media.eligibleForOperationalReadiness) && (
                          <small>
                            {media.ineligibilityReason
                              ? evidenceReason[media.ineligibilityReason]
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
                      {t.previous}{' '}
                    </button>
                    <button
                      type="button"
                      className="odm-btn"
                      disabled={busy || mediaLoading || !hasNext}
                      onClick={() => void load(page + 1)}
                    >
                      {t.next}{' '}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="odm-btn"
                  disabled={busy}
                  onClick={closePicker}
                >
                  {t.closePicker}{' '}
                </button>
              </footer>
              {error && <p role="alert">{t[error]}</p>}
            </div>
          </div>,
          document.body,
        )}
      {error && <p role="alert">{t[error]}</p>}
    </section>
  )
}
