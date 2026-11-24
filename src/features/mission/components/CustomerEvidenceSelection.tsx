import { useEffect, useId, useState } from 'react'
import { Alert, Button, Checkbox, Empty, Tag } from 'antd'
import { CheckOutlined, SendOutlined } from '@ant-design/icons'
import { useLanguage } from '../../../shared/i18n'
import { ApiError } from '../../../shared/api/httpClient'
import { InspectorEvidencePreview } from './InspectorEvidencePreview'
import { ImageContentAssessment } from './ImageContentAssessment'
import { EvidenceThumbnail } from './EvidenceThumbnail'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { getUploadMediaStatusLabel } from '../../drone-operator/pages/UploadMedia/uploadMediaHelpers'
import { customerSelectionProgress } from '../lib/customerEvidenceSelection'
import {
  deliverySuggestionMessages,
  suggestionReason,
} from './CustomerEvidenceSelection.messages'
import './CustomerEvidenceSelection.css'
import type {
  DeliverySuggestion,
  MissionChecklistEvidence,
  MissionChecklistExecution,
} from '../types/checklistExecution'

export function CustomerEvidenceSelection({
  missionId,
  item,
  refresh,
  mutationBusy = false,
  readOnly = false,
  onDetach,
}: {
  missionId: string
  item: MissionChecklistExecution
  refresh: () => void
  mutationBusy?: boolean
  readOnly?: boolean
  onDetach?: (link: MissionChecklistEvidence) => Promise<void>
}) {
  const selectionId = useId()
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const [ids, setIds] = useState(() =>
    (item.evidence ?? [])
      .filter((link) => link.selectedForCustomer)
      .map((link) => link.evidenceId),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [saved, setSaved] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    context: string
    result: DeliverySuggestion
  } | null>(null)
  const [suggestionBusy, setSuggestionBusy] = useState(false)
  const [suggestionAttempt, setSuggestionAttempt] = useState(0)
  const [suggestionError, setSuggestionError] = useState(false)
  const [preview, setPreview] = useState<MissionChecklistEvidence | null>(null)
  const persistedIds = (item.evidence ?? [])
    .filter((link) => link.selectedForCustomer)
    .map((link) => link.evidenceId)
  const changed =
    ids.length !== persistedIds.length ||
    ids.some((id) => !persistedIds.includes(id))
  useEffect(() => {
    if (saved && !changed) {
      setSaved(false)
    }
  }, [saved, changed])
  const progress = customerSelectionProgress(item, ids)
  async function save() {
    if (
      readOnly ||
      busy ||
      mutationBusy ||
      conflict ||
      saved ||
      !changed ||
      !progress.valid
    )
      return
    if (
      progress.surplus &&
      !window.confirm(
        vi
          ? 'Số media đã chọn vượt mức tối thiểu. Xác nhận gửi cả media dư cho khách hàng? Media không chọn được giữ làm dự phòng.'
          : 'The selection exceeds the minimum. Include the surplus media for the customer? Unselected media stays in reserve.',
      )
    )
      return
    setBusy(true)
    setError(false)
    try {
      await checklistEvidenceApi.selectForCustomer(missionId, item.id, {
        expectedVersion: item.version,
        evidenceIds: ids,
        confirmSurplus: progress.surplus,
      })
      setSaved(true)
      setSuggestion(null)
      setSuggestionError(false)
      refresh()
    } catch (cause) {
      setConflict(cause instanceof ApiError && cause.status === 409)
      setError(true)
      refresh()
    } finally {
      setBusy(false)
    }
  }
  const links = item.evidence ?? []
  const selected = readOnly
    ? links
    : links.filter((link) => ids.includes(link.evidenceId))
  const imageCount = selected.filter(
    (link) => link.mediaType === 'IMAGE',
  ).length
  const videoCount = selected.filter(
    (link) => link.mediaType === 'VIDEO',
  ).length
  const locked = readOnly || busy || mutationBusy || conflict || saved
  const suggestionText = deliverySuggestionMessages[lang]
  const needsImageSuggestions =
    item.evidencePolicyVersion === 3
      ? (item.minimumImageCount ?? 0) > 0
      : item.requiredEvidenceType !== 'VIDEO'
  const showSuggestions =
    !readOnly &&
    needsImageSuggestions &&
    (links.some((link) => link.mediaType === 'IMAGE') || suggestion !== null)
  const suggestionContext = JSON.stringify([
    missionId,
    item.id,
    item.version,
    item.evidencePolicyVersion,
    item.requiredEvidenceType,
    item.minimumEvidenceCount,
    item.minimumImageCount,
    item.minimumVideoCount,
    links
      .map((link) =>
        JSON.stringify([
          link.evidenceId,
          link.mediaId,
          link.version,
          link.mediaType,
          link.mediaStatus,
          link.eligibleForFinalApproval,
          Boolean(link.selectedForCustomer),
        ]),
      )
      .sort(),
  ])
  const staleSuggestion =
    suggestion !== null &&
    (suggestion.context !== suggestionContext ||
      suggestion.result.executionVersion !== item.version ||
      suggestion.result.candidates.some(
        ({ evidenceId }) =>
          !links.some(
            (link) =>
              link.evidenceId === evidenceId && link.mediaType === 'IMAGE',
          ),
      ) ||
      suggestion.result.suggestedImageEvidenceIds.some(
        (id) =>
          !links.some(
            (link) =>
              link.evidenceId === id &&
              link.mediaType === 'IMAGE' &&
              link.eligibleForFinalApproval,
          ),
      ))
  const activeSuggestion =
    showSuggestions && !staleSuggestion ? suggestion?.result : undefined
  const suggestionById = new Map(
    activeSuggestion?.candidates.map((candidate) => [
      candidate.evidenceId,
      candidate,
    ]),
  )
  const suggestedIds = activeSuggestion?.suggestedImageEvidenceIds
  const canApplySuggestion =
    !locked && !suggestionBusy && Boolean(suggestedIds?.length)

  async function requestSuggestion() {
    if (!showSuggestions || locked || suggestionBusy) return
    setSuggestionBusy(true)
    setSuggestionAttempt((attempt) => attempt + 1)
    setSuggestion(null)
    setSuggestionError(false)
    try {
      const result = await checklistEvidenceApi.getDeliverySuggestion(
        missionId,
        item.id,
      )
      if (
        !result ||
        !Array.isArray(result.suggestedImageEvidenceIds) ||
        !Array.isArray(result.candidates) ||
        !Array.isArray(result.warnings) ||
        !result.candidates.every(
          (candidate) => candidate && Array.isArray(candidate.reasonCodes),
        ) ||
        result.suggestedImageCount !==
          result.suggestedImageEvidenceIds.length ||
        new Set(result.suggestedImageEvidenceIds).size !==
          result.suggestedImageCount
      ) {
        setSuggestionError(true)
        return
      }
      setSuggestion({ context: suggestionContext, result })
    } catch {
      setSuggestionError(true)
    } finally {
      setSuggestionBusy(false)
    }
  }

  function applySuggestion() {
    if (!canApplySuggestion || !suggestedIds) return
    const videoIds = new Set(
      links
        .filter((link) => link.mediaType === 'VIDEO')
        .map((link) => link.evidenceId),
    )
    setIds((current) => [
      ...suggestedIds,
      ...current.filter((id) => videoIds.has(id)),
    ])
  }

  const typeLabel = (video: boolean) => (video ? 'Video' : vi ? 'Ảnh' : 'Image')
  const minimum =
    item.evidencePolicyVersion === 3
      ? vi
        ? `Tối thiểu ${item.minimumImageCount ?? 0} ảnh · ${item.minimumVideoCount ?? 0} video`
        : `Minimum ${item.minimumImageCount ?? 0} images · ${item.minimumVideoCount ?? 0} videos`
      : vi
        ? `Tối thiểu ${item.minimumEvidenceCount ?? 0} ${item.requiredEvidenceType === 'IMAGE' ? 'ảnh' : item.requiredEvidenceType === 'VIDEO' ? 'video' : item.requiredEvidenceType === 'IMAGE_AND_VIDEO' ? 'tệp, gồm ảnh và video' : 'ảnh hoặc video'}`
        : `Minimum ${item.minimumEvidenceCount ?? 0} ${item.requiredEvidenceType === 'IMAGE' ? 'images' : item.requiredEvidenceType === 'VIDEO' ? 'videos' : item.requiredEvidenceType === 'IMAGE_AND_VIDEO' ? 'files, including images and videos' : 'images or videos'}`
  return (
    <section
      className={`customer-evidence-selection${readOnly ? ' is-read-only' : ''}`}
      aria-label={
        readOnly
          ? vi
            ? 'Ảnh/video bằng chứng'
            : 'Evidence images and videos'
          : vi
            ? 'Chọn media gửi khách hàng'
            : 'Select customer media'
      }
    >
      <header className="customer-evidence-selection__header">
        <div>
          <h4>
            <SendOutlined aria-hidden="true" />{' '}
            {readOnly
              ? vi
                ? 'Ảnh/video bằng chứng'
                : 'Evidence images and videos'
              : vi
                ? 'Chọn ảnh/video gửi khách hàng'
                : 'Select customer images and videos'}
          </h4>
          <p>
            {readOnly
              ? vi
                ? 'Xem ảnh/video để nghiệm thu. Chỉ chọn tệp gửi khách khi checklist đã đạt và được phép bàn giao.'
                : 'Review the evidence. Delivery selection is available only for accepted checklists when permitted.'
              : vi
                ? 'Chọn các tệp đã duyệt để bàn giao. Tệp không chọn vẫn được giữ dự phòng.'
                : 'Select approved files for delivery. Unselected files stay in reserve.'}
          </p>
        </div>
        <Tag
          color={
            readOnly
              ? undefined
              : changed
                ? 'gold'
                : ids.length
                  ? 'blue'
                  : undefined
          }
        >
          {readOnly
            ? vi
              ? 'Chỉ xem'
              : 'View only'
            : saved
              ? vi
                ? 'Đã lưu'
                : 'Saved'
              : changed
                ? vi
                  ? 'Chưa lưu'
                  : 'Unsaved changes'
                : ids.length
                  ? vi
                    ? 'Đã lưu'
                    : 'Saved'
                  : vi
                    ? 'Chưa chọn tệp'
                    : 'No files selected'}
        </Tag>
      </header>
      <div
        className="customer-evidence-selection__summary"
        role="status"
        aria-atomic="true"
      >
        <div>
          <span className="customer-evidence-selection__metric-label">
            {readOnly
              ? vi
                ? 'Yêu cầu bằng chứng'
                : 'Evidence requirement'
              : vi
                ? 'Yêu cầu bàn giao'
                : 'Delivery requirement'}
          </span>
          <strong>{minimum}</strong>
        </div>
        <div>
          <span className="customer-evidence-selection__metric-label">
            {readOnly
              ? vi
                ? 'Đã gắn vào checklist'
                : 'Attached to checklist'
              : vi
                ? 'Đang chọn gửi khách'
                : 'Selected for delivery'}
          </span>
          <strong>
            {vi
              ? `${imageCount} ảnh · ${videoCount} video`
              : `${imageCount} images · ${videoCount} videos`}
          </strong>
        </div>
      </div>
      <details className="customer-evidence-selection__details">
        <summary>
          {vi ? 'Thông tin bằng chứng hợp lệ' : 'Eligible evidence details'}
        </summary>
        <div className="customer-evidence-selection__evidence-count">
          {vi
            ? item.evidencePolicyVersion === 3
              ? `Bằng chứng hợp lệ: ảnh ${item.eligibleImageCount ?? 0}/${item.minimumImageCount ?? 0} · video ${item.eligibleVideoCount ?? 0}/${item.minimumVideoCount ?? 0}`
              : `Bằng chứng hợp lệ: ${item.eligibleEvidenceCount ?? 0}/${item.minimumEvidenceCount ?? 0}`
            : item.evidencePolicyVersion === 3
              ? `Eligible evidence: images ${item.eligibleImageCount ?? 0}/${item.minimumImageCount ?? 0} · videos ${item.eligibleVideoCount ?? 0}/${item.minimumVideoCount ?? 0}`
              : `Eligible evidence: ${item.eligibleEvidenceCount ?? 0}/${item.minimumEvidenceCount ?? 0}`}
        </div>
      </details>
      {showSuggestions && (
        <div className="customer-evidence-selection__suggestion">
          <div className="customer-evidence-selection__actions">
            <Button
              size="small"
              disabled={locked || suggestionBusy}
              loading={suggestionBusy}
              aria-label={suggestionText.request}
              aria-busy={suggestionBusy}
              onClick={() => void requestSuggestion()}
            >
              {suggestionText.request}
            </Button>
            {Boolean(suggestedIds?.length) && (
              <Button
                size="small"
                disabled={!canApplySuggestion}
                onClick={applySuggestion}
              >
                {suggestionText.apply}
              </Button>
            )}
          </div>
          {Boolean(suggestedIds?.length) && (
            <div className="customer-evidence-selection__metric-label">
              {suggestionText.applyHint}
            </div>
          )}
          {suggestionError && (
            <Alert type="warning" showIcon message={suggestionText.error} />
          )}
          {staleSuggestion && (
            <Alert type="warning" showIcon message={suggestionText.stale} />
          )}
          {activeSuggestion && (
            <Alert
              showIcon
              type={
                activeSuggestion.suggestedImageCount <
                  activeSuggestion.requiredImageCount ||
                activeSuggestion.warnings.length > 0
                  ? 'warning'
                  : 'info'
              }
              message={suggestionText.count(
                activeSuggestion.suggestedImageCount,
                activeSuggestion.requiredImageCount,
              )}
              description={
                <>
                  {activeSuggestion.warnings.map((code) => (
                    <div key={code}>{suggestionReason(lang, code)}</div>
                  ))}
                  {(activeSuggestion.suggestedImageCount === 0 ||
                    activeSuggestion.suggestedImageCount <
                      activeSuggestion.requiredImageCount) && (
                    <div>{suggestionText.qualityHint}</div>
                  )}
                </>
              }
            />
          )}
          <ImageContentAssessment
            missionId={missionId}
            executionId={item.id}
            context={JSON.stringify([suggestionContext, suggestionAttempt, lang])}
            suggestion={activeSuggestion}
            links={links}
            lang={lang}
            disabled={locked || suggestionBusy}
          />
        </div>
      )}
      <ul className="customer-evidence-selection__list">
        {links.map((link) => {
          const recommendation =
            link.mediaType === 'IMAGE'
              ? suggestionById.get(link.evidenceId)
              : undefined
          const checked = !readOnly && ids.includes(link.evidenceId)
          const disabled =
            locked || (!link.eligibleForFinalApproval && !checked)
          const state = checked
            ? vi
              ? 'Gửi khách hàng'
              : 'Customer'
            : !link.eligibleForFinalApproval
              ? vi
                ? 'Chưa đủ điều kiện'
                : 'Not eligible'
              : vi
                ? 'Dự phòng'
                : 'Reserve'
          return (
            <li
              key={link.evidenceId}
              className={`customer-evidence-selection__row${checked ? ' is-selected' : ''}`}
            >
              <div className="customer-evidence-selection__choice">
                {!readOnly && (
                  <Checkbox
                    id={`${selectionId}-${link.evidenceId}`}
                    aria-label={`${link.fileName} · ${state}`}
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) =>
                      setIds((current) =>
                        event.target.checked
                          ? [...current, link.evidenceId]
                          : current.filter((id) => id !== link.evidenceId),
                      )
                    }
                  />
                )}
                <span>
                  {readOnly
                    ? typeLabel(link.mediaType === 'VIDEO')
                    : checked
                      ? vi
                        ? 'Đã chọn'
                        : 'Selected'
                      : vi
                        ? 'Chọn gửi khách'
                        : 'Select for delivery'}
                </span>
              </div>
              <button
                type="button"
                className="customer-evidence-selection__thumbnail"
                disabled={!link.previewUrl && !link.thumbnailUrl}
                aria-label={
                  vi ? `Xem ${link.fileName}` : `Preview ${link.fileName}`
                }
                onClick={() => setPreview(link)}
              >
                <EvidenceThumbnail link={link} />
              </button>
              <div className="customer-evidence-selection__file">
                <label
                  htmlFor={
                    readOnly ? undefined : `${selectionId}-${link.evidenceId}`
                  }
                  title={link.fileName}
                >
                  {link.fileName}
                </label>
                <small>
                  {typeLabel(link.mediaType === 'VIDEO')} ·{' '}
                  {link.sourceType === 'SATELLITE_SNAPSHOT'
                    ? vi
                      ? 'Ảnh vệ tinh'
                      : 'Satellite image'
                    : link.sourceType === 'DRONE_CAMERA'
                      ? vi
                        ? 'Camera drone'
                        : 'Drone camera'
                      : link.sourceType === 'MANUAL_UPLOAD'
                        ? vi
                          ? 'Tải thủ công'
                          : 'Manual upload'
                        : vi
                          ? 'Nguồn khác'
                          : 'Other source'}
                </small>
                <span className="customer-evidence-selection__review">
                  {getUploadMediaStatusLabel(
                    link.mediaStatus ?? 'Legacy',
                    lang,
                  )}
                </span>
                {recommendation && (
                  <div className="customer-evidence-selection__recommendation">
                    <Tag
                      color={
                        {
                          SUGGESTED: 'blue',
                          REVIEW: 'orange',
                          RESERVE: undefined,
                        }[recommendation.recommendation]
                      }
                    >
                      {
                        suggestionText.recommendations[
                          recommendation.recommendation
                        ]
                      }
                    </Tag>
                    {recommendation.reasonCodes.length > 0 && (
                      <small>
                        {recommendation.reasonCodes
                          .map((code) => suggestionReason(lang, code))
                          .join(' · ')}
                      </small>
                    )}
                  </div>
                )}
              </div>
              <div className="customer-evidence-selection__state">
                {!readOnly && (
                  <Tag
                    color={
                      checked
                        ? 'blue'
                        : !link.eligibleForFinalApproval
                          ? 'orange'
                          : undefined
                    }
                    icon={
                      checked ? <CheckOutlined aria-hidden="true" /> : undefined
                    }
                  >
                    {state}
                  </Tag>
                )}
                {!readOnly && onDetach && (
                  <Button
                    size="small"
                    type="text"
                    danger
                    disabled={locked}
                    aria-label={
                      vi
                        ? `Gỡ bằng chứng ${link.fileName}`
                        : `Remove evidence ${link.fileName}`
                    }
                    onClick={() => void onDetach(link)}
                  >
                    {vi ? 'Gỡ' : 'Remove'}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {links.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            vi
              ? 'Chưa có media được gắn vào checklist.'
              : 'No media attached to this checklist.'
          }
        />
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message={
            vi
              ? 'Không thể lưu lựa chọn. Tải lại danh sách kiểm tra và kiểm tra dữ liệu mới trước khi thử lại.'
              : 'Unable to save the selection. Reload the checklist and review the latest data before retrying.'
          }
        />
      )}
      {!readOnly && (
        <footer className="customer-evidence-selection__footer">
          <div className="customer-evidence-selection__feedback">
            {saved ? (
              <span role="status">
                {vi
                  ? 'Đã lưu lựa chọn. Đang tải checklist mới.'
                  : 'Selection saved. Reloading the checklist.'}
              </span>
            ) : !progress.valid && links.length > 0 ? (
              <span className="customer-evidence-selection__warning">
                {vi
                  ? 'Chọn đủ số lượng ảnh/video tối thiểu trước khi lưu.'
                  : 'Select the minimum required images/videos before saving.'}
              </span>
            ) : (
              <span>
                {vi
                  ? 'Lựa chọn được áp dụng khi xác nhận nghiệm thu.'
                  : 'Selection applies when the inspection is confirmed.'}
              </span>
            )}
          </div>
          <div className="customer-evidence-selection__actions">
            {(conflict || saved) && (
              <Button size="small" onClick={refresh}>
                {vi ? 'Tải lại checklist' : 'Reload checklist'}
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined aria-hidden="true" />}
              loading={busy}
              disabled={locked || !changed || !progress.valid}
              onClick={() => void save()}
            >
              {vi ? 'Lưu lựa chọn gửi khách hàng' : 'Save customer selection'}
            </Button>
          </div>
        </footer>
      )}
      {preview && (
        <InspectorEvidencePreview
          key={`${missionId}:${preview.evidenceId}:${preview.mediaId}`}
          missionId={missionId}
          executionId={item.id}
          link={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  )
}
