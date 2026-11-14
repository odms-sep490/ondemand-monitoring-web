import type { ReactNode } from 'react'
import { useState } from 'react'
import { Modal } from 'antd'
import './VideoPreview.css'

/** Shared video lightbox. Playback and access checks remain with the caller. */
export function VideoPreview({
  open,
  onClose,
  fileName,
  children,
  footer,
  appearance,
}: {
  open: boolean
  onClose: () => void
  fileName: string
  children: ReactNode
  footer?: ReactNode
  appearance?: 'cockpit'
}) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={fileName}
      footer={footer ?? null}
      centered
      width={appearance === 'cockpit' ? 960 : `min(1280px, calc(100vw - 48px), calc((100dvh - 64px) * ${aspectRatio}))`}
      className={appearance === 'cockpit' ? undefined : 'shared-video-preview'}
      destroyOnHidden
    >
      {open ? (
        <div
          className={appearance === 'cockpit' ? undefined : 'shared-video-preview__surface'}
          onLoadedMetadataCapture={(event) => {
            const player = event.target
            if (player instanceof HTMLVideoElement && player.videoWidth > 0 && player.videoHeight > 0) {
              setAspectRatio(player.videoWidth / player.videoHeight)
            }
          }}
        >
          {children}
        </div>
      ) : null}
    </Modal>
  )
}
