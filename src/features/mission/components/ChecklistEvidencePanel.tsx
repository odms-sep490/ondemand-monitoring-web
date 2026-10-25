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
import './ChecklistEvidencePanel.css'

export const evidenceReason: Record<EvidenceBlockingReason, string> = {
  EVIDENCE_SOURCE_NOT_ELIGIBLE:
    'Nguồn media không hợp lệ. Bằng chứng hỗ trợ camera drone và ảnh vệ tinh của hệ thống.',
  EVIDENCE_TYPE_NOT_ELIGIBLE:
    'Loại media không phù hợp yêu cầu. Hãy chọn ảnh/video đúng loại.',
  MEDIA_REJECTED: 'Media đã bị từ chối.',
  MEDIA_NOT_VALIDATED: 'Media chưa xác thực thành công.',
  MEDIA_APPROVAL_REQUIRED: 'Cần duyệt media trước khi duyệt kết quả.',
  INSUFFICIENT_EVIDENCE: 'Chưa đủ bằng chứng hợp lệ.',
  EXECUTION_NOT_COMPLETED:
    'Checklist item must be marked completed before mission acceptance.',
  EXECUTION_NOT_TERMINAL: 'Mục checklist chưa kết thúc.',
  UNABLE_REASON_REQUIRED: 'Cần lý do không thể xác minh.',
  CHECKLIST_INTEGRITY_INVALID: 'Checklist không khớp snapshot đơn hàng.',
}
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
  switch (type ?? 'IMAGE_OR_VIDEO') {
    case 'IMAGE':
      return 'Chỉ ảnh'
    case 'VIDEO':
      return 'Chỉ video'
    case 'IMAGE_AND_VIDEO':
      return 'Ảnh và video'
    default:
      return 'Ảnh hoặc video (cũ)'
  }
}
const sourceLabel: Record<string, string> = {
  DRONE_CAMERA: 'Camera drone',
  SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
  MANUAL_UPLOAD: 'Upload thủ công',
}
const mediaStatusLabel: Record<string, string> = {
  PENDING_MANAGER_APPROVAL: 'Chờ manager duyệt',
  AVAILABLE: 'Đã duyệt',
  VALIDATING: 'Đang xác thực',
  UPLOADING: 'Đang upload',
  UPLOAD_PENDING: 'Chờ upload',
  RETRY_REQUIRED: 'Cần upload lại',
  MANUAL_UPLOAD_REQUIRED: 'Chờ upload thủ công',
  REJECTED: 'Bị từ chối',
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
          ? 'Media không phù hợp. Chọn đúng loại ảnh/video và nguồn bằng chứng được hỗ trợ.'
          : 'Không thể cập nhật bằng chứng. Vui lòng làm mới checklist và thử lại.',
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
    ? `Quy trình ngoại lệ: Miễn nộp bằng chứng do không thể xác minh (Lý do: "${item.unableToVerifyReason}").`
    : 'Quy trình ngoại lệ: Không thể xác minh được miễn đính kèm bằng chứng (bắt buộc phải có lý do giải trình).'
  const compactBody = (
    <>
      <div className="ce-head">
        <span>Bằng chứng · {evidenceTypeLabel(item.requiredEvidenceType)}</span>
        <span className="ce-count">
          {isPerTypeEvidence(item)
            ? evidenceCountLabel(item)
            : `${have} / ${configuredRequired}`}
        </span>
      </div>
      {unableToVerify ? (
        <p className="ce-unable-note">{unableExplanation}</p>
      ) : remaining > 0 ? (
        <p className="ce-remaining">Còn thiếu {remaining} bằng chứng hợp lệ</p>
      ) : null}
      {item.blockingReasons?.map((reason) => (
        <p key={reason} className="ce-blocker">
          {evidenceReason[reason]}
        </p>
      ))}
      {links.length > 0 && (
        <ul className="ce-list">
          {links.map((link) => {
            const status =
              !link.eligibleForOperationalReadiness && link.ineligibilityReason
                ? evidenceReason[link.ineligibilityReason]
                : (mediaStatusLabel[link.mediaStatus ?? ''] ??
                  link.mediaStatus ??
                  'Legacy')
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
                    {link.mediaType === 'VIDEO' ? 'Video' : 'Ảnh'} •{' '}
                    {sourceLabel[link.sourceType ?? ''] ??
                      link.sourceType ??
                      'Unknown/Legacy'}
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
                      Xem
                    </a>
                  )}
                  {hasMenu && (
                    <details className="ce-more">
                      <summary aria-label="Thêm thao tác">⋮</summary>
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
                            Gỡ bằng chứng
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
        have >= configuredRequired && (
          <p className="ce-ok">✓ Đã đủ bằng chứng</p>
        )}
      {canAttach && (
        <button
          type="button"
          className="ce-add"
          title="Chọn media của mission làm bằng chứng"
          disabled={busy}
          onClick={() => void load(0)}
        >
          + Thêm media
        </button>
      )}
    </>
  )
  return (
    <section
      className={`checklist-evidence${compact ? ' is-compact' : ''}`}
      aria-label={`Bằng chứng: ${item.content}`}
    >
      {compact ? (
        compactBody
      ) : (
        <>
          <strong>
            Bằng chứng hợp lệ: {have} / {configuredRequired} ·{' '}
            {evidenceTypeLabel(item.requiredEvidenceType)}
          </strong>
          {unableToVerify && (
            <p className="ce-unable-note">{unableExplanation}</p>
          )}
          {!unableToVerify && remaining > 0 && (
            <p className="ce-remaining">
              Còn thiếu {remaining} bằng chứng hợp lệ
            </p>
          )}
          {!unableToVerify &&
            configuredRequired > 0 &&
            have >= configuredRequired && (
              <p className="ce-ok">✓ Đã đủ bằng chứng hợp lệ</p>
            )}
          {item.blockingReasons?.map((reason) => (
            <p key={reason} className="ce-blocker">
              {evidenceReason[reason]}
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
                      {sourceLabel[link.sourceType ?? ''] ??
                        'Nguồn chưa xác định'}
                    </span>
                    <span className="checklist-candidate-status">
                      {mediaStatusLabel[link.mediaStatus ?? ''] ??
                        'Chưa rõ trạng thái'}
                    </span>
                  </div>
                  <small>
                    {new Date(link.capturedAt).toLocaleString('vi-VN')}
                  </small>
                  <p
                    className={`checklist-evidence-note${link.eligibleForOperationalReadiness ? ' is-ok' : ''}`}
                  >
                    {link.eligibleForOperationalReadiness
                      ? 'Đủ điều kiện vận hành'
                      : link.ineligibilityReason
                        ? evidenceReason[link.ineligibilityReason]
                        : 'Chưa hợp lệ'}
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
                        Gỡ bằng chứng
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
              Thêm bằng chứng từ media Mission
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
            aria-label="Chọn media làm bằng chứng"
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
                  <strong>Chọn media làm bằng chứng</strong>
                  <span>
                    {item.content} · Trang {page + 1}
                  </span>
                </div>
                <button
                  type="button"
                  className="checklist-picker-close"
                  aria-label="Đóng"
                  disabled={busy}
                  onClick={closePicker}
                >
                  ×
                </button>
              </header>
              <input
                type="search"
                className="checklist-picker-search"
                aria-label="Tìm media"
                placeholder="Tìm theo tên file..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="checklist-picker-body">
                {mediaLoading && <p role="status">Đang tải media...</p>}
                {mediaError != null && (
                  <div role="alert">
                    <p>Không thể tải media của Mission.</p>
                    <button
                      className="odm-btn"
                      type="button"
                      onClick={() => void load(page)}
                    >
                      Thử lại
                    </button>
                  </div>
                )}
                {!mediaLoading && mediaError == null && shown.length === 0 && (
                  <p className="checklist-candidates-empty">
                    {needle ? (
                      'Không tìm thấy media phù hợp.'
                    ) : (
                      <>
                        Mission này chưa có media nào được upload lên hệ thống.
                        Ảnh/video đang nằm trên thiết bị chỉ hiện ở màn hình
                        nghiệm thu: hãy{' '}
                        <a href={operatorHref({ screen: 'upload', missionId })}>
                          mở media nghiệm thu
                        </a>{' '}
                        để upload (hoặc gắn trực tiếp từ đó), rồi quay lại.
                      </>
                    )}
                  </p>
                )}
                {!mediaLoading &&
                  mediaError == null &&
                  allAttached &&
                  shown.length > 0 && (
                    <p className="checklist-candidates-empty">
                      {hasNext || page > 0
                        ? 'Media phù hợp ở trang này đã được gắn vào checklist này.'
                        : 'Tất cả media phù hợp đã được gắn vào checklist này.'}
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
                              aria-label={`Xem video ${media.fileName}`}
                            />
                          ) : (
                            <img
                              src={media.previewUrl}
                              alt={`Xem trước ${media.fileName}`}
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
                              'Nguồn chưa xác định'}
                          </span>
                          <span className="checklist-candidate-status">
                            {mediaStatusLabel[media.status ?? ''] ??
                              'Chưa rõ trạng thái'}
                          </span>
                        </span>
                        <small>
                          {media.mediaType === 'VIDEO' ? 'Video' : 'Ảnh'}
                        </small>
                        <small className="checklist-candidate-time">
                          {new Date(media.capturedAt).toLocaleString('vi-VN')}
                        </small>
                        {!matchesEvidenceType(
                          item.requiredEvidenceType,
                          media.mediaType,
                        ) && (
                          <small>
                            Loại media không phù hợp yêu cầu (
                            {evidenceTypeLabel(item.requiredEvidenceType)}).
                          </small>
                        )}
                        {(!media.attachable ||
                          !media.eligibleForOperationalReadiness) && (
                          <small>
                            {media.ineligibilityReason
                              ? evidenceReason[media.ineligibilityReason]
                              : 'Không thể gắn'}
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
                        {attached(media) ? 'Đã gắn' : 'Gắn media'}
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
                      Trang trước
                    </button>
                    <button
                      type="button"
                      className="odm-btn"
                      disabled={busy || mediaLoading || !hasNext}
                      onClick={() => void load(page + 1)}
                    >
                      Trang sau
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="odm-btn"
                  disabled={busy}
                  onClick={closePicker}
                >
                  Đóng chọn media
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
