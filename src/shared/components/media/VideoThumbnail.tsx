import { useState } from 'react'
import { Modal } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { defineMessages, useI18n } from '../../i18n'
import { ResilientMedia } from './MediaRecovery'
import type { MediaRecoveryProps } from './useMediaRecovery'
import './VideoThumbnail.css'

const messages = defineMessages({
  vi: {
    view: (name: string) => `Xem video ${name}`,
    video: 'Video',
    pending: 'Video chưa sẵn sàng',
  },
  en: {
    view: (name: string) => `View video ${name}`,
    video: 'Video',
    pending: 'Video is not ready',
  },
})

/** A poster is always an image. Never mount a video decoder to render a list thumbnail. */
export function VideoPoster({
  poster,
  fileName = '',
}: {
  poster?: string | null
  fileName?: string
}) {
  const { t } = useI18n(messages)
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <span className="media-video-poster">
      {poster && poster !== failed ? (
        <img
          className="media-video-poster__image"
          src={poster}
          alt={fileName}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(poster)}
        />
      ) : (
        <span className="media-video-poster__empty" aria-hidden="true">
          {t.video}
        </span>
      )}
      <PlayCircleOutlined
        className="media-video-poster__play"
        aria-hidden="true"
      />
    </span>
  )
}

type Props = Omit<MediaRecoveryProps, 'src'> & {
  src?: string | null
  poster?: string | null
  fileName: string
}
export function VideoThumbnail(props: Props) {
  const { t } = useI18n(messages)
  const [open, setOpen] = useState(false)
  return (
    <div className="media-video-thumbnail">
      <button
        type="button"
        className="media-video-thumbnail__open"
        disabled={!props.src}
        aria-label={props.src ? t.view(props.fileName) : t.pending}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        <VideoPoster poster={props.poster} />
      </button>
      <Modal
        title={props.fileName}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={960}
        destroyOnHidden
      >
        {open && props.src && (
          <ResilientMedia {...props} src={props.src} kind="video" expanded />
        )}
      </Modal>
    </div>
  )
}
