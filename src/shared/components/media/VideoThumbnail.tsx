import { useState } from 'react'
import { VideoPreview } from './VideoPreview'
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
  fallbackPoster,
}: {
  poster?: string | null
  fallbackPoster?: string | null
  fileName?: string
}) {
  const { t } = useI18n(messages)
  const [failed, setFailed] = useState<string[]>([])
  const current = [poster, fallbackPoster].find((source) => source && !failed.includes(source))
  return (
    <span className="media-video-poster">
      {current ? (
        <img
          className="media-video-poster__image"
          src={current}
          alt={fileName}
          loading="lazy"
          decoding="async"
          onError={() => setFailed((previous) => [...previous, current])}
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
  fallbackPoster?: string | null
  fileName: string
  appearance?: 'cockpit'
}
export function VideoThumbnail(props: Props) {
  const { t } = useI18n(messages)
  const [open, setOpen] = useState(false)
  const { fallbackPoster, appearance, ...mediaProps } = props
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
        <VideoPoster poster={props.poster} fallbackPoster={fallbackPoster} fileName={props.fileName} />
      </button>
      <VideoPreview
        fileName={props.fileName}
        open={open}
        onClose={() => setOpen(false)}
        appearance={appearance}
      >
        {open && props.src && (
          <ResilientMedia {...mediaProps} src={props.src} kind="video" expanded />
        )}
      </VideoPreview>
    </div>
  )
}
