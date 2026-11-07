import { useId, useState } from 'react'
import { Alert, Button, Checkbox, Empty, Image, Modal, Tag } from 'antd'
import {
  CheckOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../../../shared/i18n'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { getUploadMediaStatusLabel } from '../../drone-operator/pages/UploadMedia/uploadMediaHelpers'
import { customerSelectionProgress } from '../lib/customerEvidenceSelection'
import './CustomerEvidenceSelection.css'
import type {
  MissionChecklistEvidence,
  MissionChecklistExecution,
} from '../types/checklistExecution'

export function CustomerEvidenceSelection({
  missionId,
  item,
  refresh,
  mutationBusy = false,
  onDetach,
}: {
  missionId: string
  item: MissionChecklistExecution
  refresh: () => void
  mutationBusy?: boolean
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
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<MissionChecklistEvidence | null>(null)
  const persistedIds = (item.evidence ?? [])
    .filter((link) => link.selectedForCustomer)
    .map((link) => link.evidenceId)
  const changed =
    ids.length !== persistedIds.length ||
    ids.some((id) => !persistedIds.includes(id))
  const progress = customerSelectionProgress(item, ids)
  async function save() {
    if (
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
    setError(null)
    try {
      await checklistEvidenceApi.selectForCustomer(missionId, item.id, {
        expectedVersion: item.version,
        evidenceIds: ids,
        confirmSurplus: progress.surplus,
      })
      setSaved(true)
      refresh()
    } catch (cause) {
      setConflict(cause instanceof ApiError && cause.status === 409)
      setError(
        vi
          ? 'Không thể lưu lựa chọn. Tải lại checklist và kiểm tra dữ liệu mới trước khi thử lại.'
          : 'Unable to save the selection. Reload the checklist and review the latest data before retrying.',
      )
      refresh()
    } finally {
      setBusy(false)
    }
  }
  const links = item.evidence ?? []
  const selected = links.filter((link) => ids.includes(link.evidenceId))
  const imageCount = selected.filter(
    (link) => link.mediaType === 'IMAGE',
  ).length
  const videoCount = selected.filter(
    (link) => link.mediaType === 'VIDEO',
  ).length
  const locked = busy || mutationBusy || conflict || saved
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
      className="customer-evidence-selection"
      aria-label={vi ? 'Chọn media gửi khách hàng' : 'Select customer media'}
    >
      <header className="customer-evidence-selection__header">
        <div>
          <h4>
            <SendOutlined aria-hidden="true" />{' '}
            {vi ? 'Media của checklist' : 'Checklist media'}
          </h4>
          <p>
            {vi
              ? 'Chọn ảnh/video đã duyệt. Các tệp còn lại được giữ dự phòng.'
              : 'Select approved images/videos. Other files stay in reserve.'}
          </p>
        </div>
        <Tag color={ids.length ? 'blue' : undefined}>
          {vi
            ? `Đã chọn ${ids.length}/${links.length}`
            : `${ids.length}/${links.length} selected`}
        </Tag>
      </header>
      <div className="customer-evidence-selection__evidence-count">
        {vi
          ? item.evidencePolicyVersion === 3
            ? `Bằng chứng hợp lệ: ảnh ${item.eligibleImageCount ?? 0}/${item.minimumImageCount ?? 0} · video ${item.eligibleVideoCount ?? 0}/${item.minimumVideoCount ?? 0}`
            : `Bằng chứng hợp lệ: ${item.eligibleEvidenceCount ?? 0}/${item.minimumEvidenceCount ?? 0}`
          : item.evidencePolicyVersion === 3
            ? `Eligible evidence: images ${item.eligibleImageCount ?? 0}/${item.minimumImageCount ?? 0} · videos ${item.eligibleVideoCount ?? 0}/${item.minimumVideoCount ?? 0}`
            : `Eligible evidence: ${item.eligibleEvidenceCount ?? 0}/${item.minimumEvidenceCount ?? 0}`}
      </div>
      <div
        className="customer-evidence-selection__summary"
        role="status"
        aria-atomic="true"
      >
        <span>
          {vi
            ? `Chọn gửi khách: ${imageCount} ảnh · ${videoCount} video`
            : `Customer selection: ${imageCount} images · ${videoCount} videos`}
        </span>
        <span className="customer-evidence-selection__minimum">{minimum}</span>
      </div>
      <ul className="customer-evidence-selection__list">
        {links.map((link) => {
          const checked = ids.includes(link.evidenceId)
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
              <button
                type="button"
                className="customer-evidence-selection__thumbnail"
                disabled={!link.previewUrl && !link.thumbnailUrl}
                aria-label={
                  vi ? `Xem ${link.fileName}` : `Preview ${link.fileName}`
                }
                onClick={() => setPreview(link)}
              >
                {link.thumbnailUrl && link.mediaType !== 'VIDEO' ? (
                  <img src={link.thumbnailUrl} alt="" loading="lazy" />
                ) : link.mediaType === 'VIDEO' ? (
                  <PlayCircleOutlined aria-hidden="true" />
                ) : (
                  <PictureOutlined aria-hidden="true" />
                )}
              </button>
              <div className="customer-evidence-selection__file">
                <label
                  htmlFor={`${selectionId}-${link.evidenceId}`}
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
              </div>
              <div className="customer-evidence-selection__state">
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
                {onDetach && (
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
      {error && <Alert type="error" showIcon message={error} />}
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
      <Modal
        className="customer-evidence-selection-preview"
        open={preview !== null}
        title={preview?.fileName}
        footer={null}
        width={860}
        onCancel={() => setPreview(null)}
        destroyOnHidden
      >
        {preview?.previewUrl &&
          (preview.mediaType === 'VIDEO' ? (
            <video
              className="customer-evidence-selection__video"
              src={preview.previewUrl}
              controls
              preload="metadata"
            />
          ) : (
            <Image
              src={preview.previewUrl}
              alt={preview.fileName}
              width="100%"
              preview={{ mask: vi ? 'Phóng to ảnh' : 'Zoom image' }}
            />
          ))}
      </Modal>
    </section>
  )
}
