import { useEffect, useRef, useState } from 'react'
import { Button, Modal, Spin } from 'antd'
import { ImagePreview } from '../../../shared/components/media/ImagePreview'
import {
  CloseOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../../../shared/i18n'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import type { MissionChecklistEvidence } from '../types/checklistExecution'
import '../../media/components/MediaInspectionAction.css'
import './InspectorEvidencePreview.css'

/** Staff derivative viewer. Never requests a customer URL or silently downloads an original. */
export function InspectorEvidencePreview({
  missionId,
  executionId,
  link,
  onClose,
}: {
  missionId: string
  executionId: string
  link: MissionChecklistEvidence
  onClose: () => void
}) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const image = link.mediaType !== 'VIDEO'
  const [source, setSource] = useState(
    link.previewUrl ?? (image ? link.thumbnailUrl : null),
  )
  const [poster, setPoster] = useState(link.thumbnailUrl)
  const [thumbnail, setThumbnail] = useState(!link.previewUrl && image)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const attempted = useRef(false)
  const pending = useRef(false)
  const generation = useRef(0)
  const controller = useRef<AbortController | null>(null)
  useEffect(
    () => () => {
      generation.current++
      controller.current?.abort()
    },
    [],
  )

  async function refresh() {
    if (pending.current) return
    pending.current = true
    attempted.current = true
    const token = ++generation.current
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    const timeout = setTimeout(() => abort.abort(), 15000)
    setBusy(true)
    setFailed(false)
    setSource(null)
    try {
      const checklist =
        await checklistExecutionApi.getMissionChecklistExecutions(
          missionId,
          abort.signal,
        )
      const fresh =
        checklist.missionId === missionId
          ? checklist.executions
              .find((row) => row.id === executionId)
              ?.evidence?.find(
                (row) =>
                  row.evidenceId === link.evidenceId &&
                  row.mediaId === link.mediaId &&
                  row.mediaType === link.mediaType,
              )
          : undefined
      if (!fresh || (!fresh.previewUrl && !(image && fresh.thumbnailUrl)))
        throw new Error('Evidence preview unavailable')
      if (token !== generation.current) return
      setPoster(fresh.thumbnailUrl)
      setSource(fresh.previewUrl ?? fresh.thumbnailUrl)
      setThumbnail(!fresh.previewUrl && image)
    } catch (cause) {
      if (token !== generation.current) return
      // Retrying a denied Staff request must not conceal revoked authorization.
      if (
        !(
          cause instanceof ApiError && [401, 403].includes(cause.status ?? 0)
        ) &&
        image &&
        link.thumbnailUrl
      ) {
        setSource(link.thumbnailUrl)
        setThumbnail(true)
      } else setFailed(true)
    } finally {
      clearTimeout(timeout)
      if (token === generation.current) {
        pending.current = false
        setBusy(false)
      }
    }
  }
  function onError() {
    if (pending.current || failed) return
    if (!attempted.current) {
      void refresh()
      return
    }
    if (image && !thumbnail && poster && source !== poster) {
      setSource(poster)
      setThumbnail(true)
      return
    }
    setFailed(true)
  }
  const notice =
    busy || !source || failed ? (
      <div
        className="media-inspection__placeholder"
        role={failed ? 'alert' : 'status'}
      >
        {busy ? (
          <>
            <Spin />
            <span>
              {vi
                ? 'Đang lấy lại đường dẫn xem…'
                : 'Refreshing the preview link…'}
            </span>
          </>
        ) : (
          <>
            <p>
              {vi
                ? 'Không thể mở bản xem trước. Tệp có thể chưa sẵn sàng hoặc đường dẫn đã hết hạn.'
                : 'Unable to open the preview. The file may not be ready or its link may have expired.'}
            </p>
            <div className="media-inspection__recovery">
              <Button onClick={() => void refresh()}>
                {vi ? 'Thử lại' : 'Retry'}
              </Button>
            </div>
          </>
        )}
      </div>
    ) : null
  const thumbnailNotice = thumbnail && !notice && (
    <div className="inspector-evidence-preview__notice" role="status">
      <span>
        {vi
          ? 'Đang xem ảnh thu nhỏ. Bản xem trước chưa khả dụng; chưa thể kiểm tra đầy đủ chất lượng.'
          : 'Showing the thumbnail. The preview is unavailable; full quality cannot be assessed.'}
      </span>
      <Button onClick={() => void refresh()}>
        {vi ? 'Thử lại bản xem trước' : 'Retry preview'}
      </Button>
    </div>
  )
  const viewerHeader = (
    <div className="inspector-viewer__header">
      <span className="inspector-viewer__type" aria-hidden>
        {image ? <PictureOutlined /> : <VideoCameraOutlined />}
      </span>
      <div className="inspector-viewer__identity">
        <span className="inspector-viewer__eyebrow">
          {vi ? 'Xem ảnh/video' : 'Media viewer'}
          <span>
            {thumbnail && image
              ? vi
                ? 'Ảnh thu nhỏ'
                : 'Thumbnail'
              : vi
                ? 'Bản xem trước'
                : 'Preview'}
          </span>
        </span>
        <strong title={link.fileName}>{link.fileName}</strong>
      </div>
      <Button
        type="text"
        icon={<CloseOutlined />}
        aria-label={vi ? 'Đóng' : 'Close'}
        title={vi ? 'Đóng' : 'Close'}
        onClick={onClose}
      />
    </div>
  )
  return image ? (
    <ImagePreview
      src={source ?? ''}
      fileName={link.fileName}
      viewerOnly
      visible
      onVisibleChange={(visible) => {
        if (!visible) onClose()
      }}
      onError={onError}
      statusContent={notice}
      toolbarExtra={
        <>
          <span title={link.fileName}>{link.fileName}</span>
          {thumbnailNotice}
        </>
      }
    />
  ) : (
    <Modal
      open
      className="inspector-video-viewer"
      title={viewerHeader}
      closable={false}
      centered
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnHidden
    >
      {notice ?? (
        <video
          className="customer-evidence-selection__video"
          src={source ?? undefined}
          poster={poster ?? undefined}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          onError={onError}
        />
      )}
    </Modal>
  )
}
