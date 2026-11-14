import { cloneElement, useEffect, useRef, useState } from 'react'
import type { ImgHTMLAttributes, ReactElement } from 'react'
import { Button, Image, Modal, Spin } from 'antd'
import {
  EyeOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import './MediaInspectionAction.css'
import { apiRequest } from '../../../shared/api/httpClient'
import { defineMessages, useI18n } from '../../../shared/i18n'

const messages = defineMessages({
  vi: {
    open: 'Kiểm tra bản gốc',
    local: 'Xem tệp trên thiết bị',
    localShort: 'Xem tệp',
    openShort: 'Xem bản gốc',
    quality: 'Bản gốc · kiểm tra chất lượng',
    localQuality: 'Tệp lưu trên thiết bị điều khiển',
    failed: 'Không thể mở tệp. Hãy kiểm tra quyền truy cập và thử lại.',
    close: 'Đóng',
    image: 'Ảnh',
    video: 'Video',
    onDevice: 'Trên thiết bị',
    original: 'Bản gốc',
    loading: 'Đang mở tệp…',
    retry: 'Thử lại',
    notReady: 'Bản gốc chưa sẵn sàng; cần tải lên và xác thực thành công.',
  },
  en: {
    open: 'Inspect original',
    local: 'View local file',
    localShort: 'View file',
    openShort: 'View original',
    quality: 'Original · quality inspection',
    localQuality: 'Local drone file',
    failed: 'Unable to open the file. Check access and try again.',
    close: 'Close',
    image: 'Image',
    video: 'Video',
    onDevice: 'On device',
    original: 'Original',
    loading: 'Opening file…',
    retry: 'Retry',
    notReady:
      'The original is not ready; upload and validation must succeed first.',
  },
})

/** Internal review only. Original URLs are requested on demand for the exact Mission. */
type Props = {
  missionId: string
  mediaId?: string
  mediaType: string
  fileName: string
  localUrl?: string | null
  originalReady?: boolean
  buttonLabel?: string
  className?: string
  compact?: boolean
  appearance?: 'default' | 'cockpit'
}
export function MediaInspectionAction(props: Props) {
  return (
    <Inspection
      key={`${props.missionId}:${props.mediaId ?? ''}:${props.localUrl ?? ''}`}
      {...props}
    />
  )
}
function Inspection({
  missionId,
  mediaId,
  mediaType,
  fileName,
  localUrl,
  className,
  buttonLabel,
  compact = false,
  appearance = 'default',
  originalReady = true,
}: Props) {
  const { t } = useI18n(messages)
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [usingLocal, setUsingLocal] = useState(Boolean(localUrl))
  const generation = useRef(0)
  const request = useRef<AbortController | null>(null)
  useEffect(() => {
    generation.current++
    request.current?.abort()
    setOpen(false)
    setUrl(null)
    setBusy(false)
    setFailed(false)
    return () => {
      generation.current++
      request.current?.abort()
    }
  }, [missionId, mediaId, localUrl])
  async function inspect(useLocal = Boolean(localUrl)) {
    if (!useLocal && !originalReady) return
    setUsingLocal(useLocal)
    const current = ++generation.current
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const timeout = setTimeout(() => controller.abort(), 15000)
    setBusy(true)
    setFailed(false)
    setUrl(null)
    setOpen(true)
    try {
      const response = useLocal
        ? null
        : await apiRequest<{ mediaId: string; viewUrl: string }>(
            `/api/operator/missions/${encodeURIComponent(missionId)}/media/${encodeURIComponent(mediaId!)}/original-view`,
            { method: 'POST', signal: controller.signal },
          )
      if (response && response.mediaId !== mediaId)
        throw new Error('Invalid media scope')
      if (generation.current === current)
        setUrl(useLocal ? localUrl! : response!.viewUrl)
    } catch {
      if (generation.current === current) setFailed(true)
    } finally {
      clearTimeout(timeout)
      if (generation.current === current) setBusy(false)
    }
  }
  function close() {
    generation.current++
    request.current?.abort()
    setOpen(false)
    setUrl(null)
    setBusy(false)
  }
  const statusContent =
    busy || (!url && !failed) ? (
      <div className="media-inspection__placeholder" role="status">
        <Spin />
        <span>{t.loading}</span>
      </div>
    ) : failed ? (
      <div className="media-inspection__placeholder">
        <ExclamationCircleOutlined aria-hidden />
        <p role="alert">{t.failed}</p>
        <div className="media-inspection__recovery">
          <Button onClick={() => void inspect(usingLocal)}>{t.retry}</Button>
          {usingLocal && mediaId && originalReady && (
            <Button onClick={() => void inspect(false)}>{t.open}</Button>
          )}
        </div>
        {usingLocal && mediaId && !originalReady && <p>{t.notReady}</p>}
      </div>
    ) : null
  if (!localUrl && !mediaId) return null
  return (
    <>
      <Button
        size="small"
        className={className}
        onClick={() => void inspect()}
        loading={busy}
        disabled={!localUrl && !originalReady}
        icon={compact ? <EyeOutlined aria-hidden /> : undefined}
        aria-label={buttonLabel ?? (localUrl ? t.local : t.open)}
        title={localUrl ? t.local : originalReady ? t.open : t.notReady}
      >
        {buttonLabel ??
          (compact
            ? localUrl
              ? t.localShort
              : t.openShort
            : localUrl
              ? t.local
              : t.open)}
      </Button>
      {mediaType === 'VIDEO' && (
        <Modal
          open={open}
          className={`media-inspection-dialog${appearance === 'cockpit' ? ' media-inspection-dialog--cockpit' : ''}`}
          title={
            <div className="media-inspection__heading">
              <span className="media-inspection__icon" aria-hidden>
                {mediaType === 'VIDEO' ? (
                  <VideoCameraOutlined />
                ) : (
                  <FileImageOutlined />
                )}
              </span>
              <div className="media-inspection__identity">
                <div className="media-inspection__caption">
                  <span>{mediaType === 'VIDEO' ? t.video : t.image}</span>
                  <span className="media-inspection__source">
                    {usingLocal ? t.onDevice : t.original}
                  </span>
                </div>
                <div className="media-inspection__filename" title={fileName}>
                  {fileName}
                </div>
              </div>
            </div>
          }
          onCancel={close}
          footer={
            <div className="media-inspection__footer">
              <span className="media-inspection__hint">
                {usingLocal ? t.localQuality : t.quality}
              </span>
              <div className="media-inspection__tools">
                <Button onClick={close}>{t.close}</Button>
              </div>
            </div>
          }
          width={1180}
          centered
          destroyOnHidden
        >
          <div className="media-inspection__stage">
            {statusContent ??
              (url && mediaType === 'VIDEO' && (
                <video
                  key={url}
                  src={url}
                  controls
                  preload="metadata"
                  onError={() => setFailed(true)}
                />
              ))}
          </div>
        </Modal>
      )}
      {open && mediaType !== 'VIDEO' && (
        <Image
          src={url ?? undefined}
          alt={fileName}
          wrapperStyle={{ display: 'none' }}
          onError={() => setFailed(true)}
          preview={{
            visible: true,
            rootClassName: 'media-inspection-image',
            toolbarRender: statusContent ? () => null : undefined,
            imageRender: (image) =>
              statusContent ??
              cloneElement(
                image as ReactElement<ImgHTMLAttributes<HTMLImageElement>>,
                {
                  onError: () => setFailed(true),
                },
              ),
            onVisibleChange: (visible) => {
              if (!visible) close()
            },
          }}
        />
      )}
    </>
  )
}
