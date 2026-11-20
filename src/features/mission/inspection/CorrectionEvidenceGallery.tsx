import { useState } from 'react'
import { Checkbox, Tag } from 'antd'
import { PictureOutlined } from '@ant-design/icons'
import { defineMessages, useI18n } from '../../../shared/i18n'
import { VideoPoster } from '../../../shared/components/media/VideoThumbnail'
import { InspectorEvidencePreview } from '../components/InspectorEvidencePreview'
import { getUploadMediaStatusLabel } from '../../drone-operator/pages/UploadMedia/uploadMediaHelpers'
import type { MissionChecklistEvidence } from '../types/checklistExecution'

const messages = defineMessages({
  vi: {
    referenceTitle: 'Tệp được đánh dấu trong yêu cầu',
    title: 'Ảnh/video liên quan (không bắt buộc)',
    hint: 'Chọn tệp minh họa vấn đề cần bổ sung. Các tệp này không phải lựa chọn bàn giao cho khách hàng.',
    selected: (count: number) => `Đã chọn ${count} tệp`,
    select: (name: string) => `Chọn tệp liên quan ${name}`,
    view: (name: string) => `Xem bằng chứng ${name}`,
    preview: 'Xem',
    image: 'Ảnh',
    video: 'Video',
    noThumbnail: 'Chưa có ảnh thu nhỏ',
  },
  en: {
    referenceTitle: 'Files referenced in the request',
    title: 'Related images/videos (optional)',
    hint: 'Select files that illustrate the required corrections. This does not select files for customer delivery.',
    selected: (count: number) => `${count} files selected`,
    select: (name: string) => `Select related file ${name}`,
    view: (name: string) => `View evidence ${name}`,
    preview: 'View',
    image: 'Image',
    video: 'Video',
    noThumbnail: 'Thumbnail unavailable',
  },
})
const UUID_ONLY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z0-9]+)?$/i

function displayFileName(
  rawName: string | null | undefined,
  index: number,
  mediaType: string | undefined,
  t: { image: string; video: string },
) {
  if (!rawName || UUID_ONLY_PATTERN.test(rawName.trim())) {
    return `${mediaType === 'VIDEO' ? t.video : t.image} #${index + 1}`
  }
  return rawName
}

export function CorrectionEvidenceGallery({
  missionId,
  executionId,
  links,
  selected,
  disabled,
  onChange,
  readOnly = false,
  title,
  selectedLabel,
  loadChecklist,
}: {
  missionId: string
  executionId: string
  links: MissionChecklistEvidence[]
  selected: string[]
  disabled: boolean
  selectedLabel?: string
  title?: string
  loadChecklist?: React.ComponentProps<typeof InspectorEvidencePreview>['loadChecklist']
  readOnly?: boolean
  onChange: (ids: string[]) => void
}) {
  const { t, lang } = useI18n(messages)
  const [preview, setPreview] = useState<MissionChecklistEvidence | null>(null)
  const selectedCount = links.filter((link) =>
    selected.includes(link.mediaId),
  ).length
  return (
    <fieldset className="inspection-corrections__related">
      <legend>
        {readOnly ? (title ?? t.referenceTitle) : <>{t.title} <Tag>{t.selected(selectedCount)}</Tag></>}
      </legend>
      {!readOnly && <p className="inspection-corrections__media-hint">{t.hint}</p>}
      <div className="inspection-corrections__media-grid">
        {links.map((link, index) => {
          const chosen = selected.includes(link.mediaId)
          const name = link.fileName ?? link.mediaId
          const visibleName = displayFileName(
            link.fileName,
            index,
            link.mediaType,
            t,
          )
          return (
            <article
              key={link.evidenceId}
              className={`inspection-corrections__media-card${chosen ? ' is-selected' : ''}`}
            >
              <div className="inspection-corrections__media-frame">
                <button
                  type="button"
                  className="inspection-corrections__media-preview"
                  aria-label={t.view(name)}
                  onClick={() => setPreview(link)}
                >
                  <CorrectionThumbnail link={link} fallback={t.noThumbnail} />
                  <span className="inspection-corrections__media-view">
                    {t.preview}
                  </span>
                </button>
                {!readOnly && (
                  <label className="inspection-corrections__media-badge">
                    <Checkbox
                      aria-label={t.select(name)}
                      checked={chosen}
                      disabled={disabled}
                      onChange={(event) =>
                        onChange(
                          event.target.checked
                            ? [...new Set([...selected, link.mediaId])]
                            : selected.filter((id) => id !== link.mediaId),
                        )
                      }
                    />
                  </label>
                )}
              </div>
              <div className="inspection-corrections__media-info">
                <strong title={name}>{visibleName}</strong>
                <div className="inspection-corrections__media-meta">
                  <span>{link.mediaType === 'VIDEO' ? t.video : t.image}</span>
                  {link.mediaStatus && (
                    <small>
                      {getUploadMediaStatusLabel(link.mediaStatus, lang)}
                    </small>
                  )}
                </div>
                {readOnly && chosen && selectedLabel && <Tag color="blue">{selectedLabel}</Tag>}
              </div>
            </article>
          )
        })}
      </div>
      {preview && (
        <InspectorEvidencePreview
          key={`${executionId}:${preview.evidenceId}`}
          missionId={missionId}
          executionId={executionId}
          link={preview}
          loadChecklist={loadChecklist}
          onClose={() => setPreview(null)}
        />
      )}
    </fieldset>
  )
}
function CorrectionThumbnail({
  link,
  fallback,
}: {
  link: MissionChecklistEvidence
  fallback: string
}) {
  const [failed, setFailed] = useState<string[]>([])
  if (link.mediaType === 'VIDEO')
    return <VideoPoster poster={link.thumbnailUrl} />
  const source = [link.thumbnailUrl, link.previewUrl].find(
    (url) => url && !failed.includes(url),
  )
  return source ? (
    <img
      src={source}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed((previous) => [...previous, source])}
    />
  ) : (
    <span className="inspection-corrections__media-placeholder">
      <PictureOutlined aria-hidden />
      {fallback}
    </span>
  )
}
