import { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'antd'
import { ExpandOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useI18n, defineMessages } from '../../i18n'
import { useMediaRecovery, type MediaRecoveryProps } from './useMediaRecovery'
import './MediaRecovery.css'

const messages = defineMessages({
  vi: {
    loading: 'Đang lấy lại đường dẫn xem…',
    expandVideo: 'Phóng to video',
    videoPlaceholder: 'Video',
    failed:
      'Không thể hiển thị tệp. Tệp có thể không còn khả dụng hoặc định dạng chưa được trình duyệt hỗ trợ.',
    retry: 'Thử lại',
    large: 'Bản gốc lớn hơn 20 MB. Chỉ tải khi bạn muốn xem.',
    open: 'Mở bản gốc để xem',
  },
  en: {
    loading: 'Refreshing the viewing link…',
    expandVideo: 'Expand video',
    videoPlaceholder: 'Video',
    failed:
      'Unable to display this file. It may be unavailable or its format may not be supported by your browser.',
    retry: 'Retry',
    large:
      'The original is larger than 20 MB. Load it when you want to view it.',
    open: 'Load original to view',
  },
})

export function MediaRecoveryNotice({
  recovery,
}: {
  recovery: ReturnType<typeof useMediaRecovery>
}) {
  const { t } = useI18n(messages)
  return (
    <div
      className="media-recovery-notice"
      role={recovery.failed ? 'alert' : 'status'}
    >
      <span>
        {recovery.loading ? t.loading : recovery.paused ? t.large : t.failed}
      </span>
      {!recovery.loading && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (recovery.paused && !recovery.failed) recovery.allow()
            else recovery.retry()
          }}
        >
          {recovery.paused && !recovery.failed ? t.open : t.retry}
        </button>
      )}
    </div>
  )
}

type Props = MediaRecoveryProps & {
  expanded?: boolean
  kind: 'image' | 'video'
  fileName: string
  poster?: string | null
}
export function ResilientMedia(props: Props) {
  return (
    <MediaSurface
      key={`${props.mediaId ?? ''}:${props.kind}:${props.src}`}
      {...props}
    />
  )
}
function MediaSurface(props: Props & { expanded?: boolean }) {
  const recovery = useMediaRecovery(props)
  useEffect(() => {
    if (
      props.kind === 'image' &&
      !recovery.loading &&
      !recovery.failed &&
      !recovery.paused
    )
      recovery.startLoad()
    return recovery.stopLoad
  }, [
    props.kind,
    recovery.source,
    recovery.loading,
    recovery.failed,
    recovery.paused,
  ])
  if (recovery.loading || recovery.failed || recovery.paused)
    return <MediaRecoveryNotice recovery={recovery} />
  return props.kind === 'video' ? (
    <VideoSurface {...props} recovery={recovery} />
  ) : (
    <img
      src={recovery.source}
      alt={props.fileName}
      decoding="async"
      onLoad={recovery.completeLoad}
      onError={recovery.onError}
    />
  )
}

function VideoSurface(
  props: Props & {
    expanded?: boolean
    recovery: ReturnType<typeof useMediaRecovery>
  },
) {
  const { t } = useI18n(messages)
  const video = useRef<HTMLVideoElement>(null)
  const playbackRequested = useRef(false)
  const [open, setOpen] = useState(false)
  const [hasFrame, setHasFrame] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)
  const { recovery } = props
  useEffect(() => {
    const player = video.current
    if (
      posterFailed &&
      player &&
      player.readyState >= 1 &&
      Number.isFinite(player.duration) &&
      player.duration > 0
    )
      seekInitialFrame(player)
  }, [posterFailed])
  useEffect(() => {
    playbackRequested.current = false
    setHasFrame(false)
    setPosterFailed(false)
    if (!props.poster) return
    let active = true
    const probe = new window.Image()
    probe.onerror = () => {
      if (active) setPosterFailed(true)
    }
    probe.src = props.poster
    return () => {
      active = false
      probe.onerror = null
    }
  }, [recovery.source, props.poster])
  return (
    <div
      className={`media-video${props.expanded ? ' media-video--expanded' : ''}`}
    >
      <div className="media-video__frame">
        <video
          ref={video}
          src={recovery.source}
          poster={posterFailed ? undefined : (props.poster ?? undefined)}
          controls
          controlsList="nodownload"
          preload={props.poster && !posterFailed ? 'none' : 'metadata'}
          playsInline
          aria-label={props.fileName}
          onError={recovery.onError}
          onLoadStart={() => {
            if (!props.poster || posterFailed) recovery.startLoad()
          }}
          onPlay={() => {
            playbackRequested.current = true
            recovery.startLoad()
          }}
          onPause={() => {
            playbackRequested.current = false
            recovery.stopLoad()
          }}
          onLoadedMetadata={(event) => {
            recovery.completeLoad()
            if (
              (!props.poster || posterFailed) &&
              Number.isFinite(event.currentTarget.duration) &&
              event.currentTarget.duration > 0
            ) {
              seekInitialFrame(event.currentTarget)
            }
          }}
          onLoadedData={() => {
            setHasFrame(true)
            recovery.completeLoad()
          }}
          onStalled={() => {
            if (playbackRequested.current) recovery.restartLoad()
          }}
          onWaiting={() => {
            if (playbackRequested.current) recovery.restartLoad()
          }}
          onPlaying={() => {
            setHasFrame(true)
            recovery.completeLoad()
          }}
        />
        {(!props.poster || posterFailed) && !hasFrame && (
          <div className="media-video__placeholder" aria-hidden="true">
            <PlayCircleOutlined />
            <span>{t.videoPlaceholder}</span>
          </div>
        )}
      </div>
      {!props.expanded && (
        <Button
          className="media-video__expand"
          aria-label={t.expandVideo}
          size="small"
          icon={<ExpandOutlined />}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            video.current?.pause()
            setOpen(true)
          }}
        >
          {t.expandVideo}
        </Button>
      )}
      <Modal
        title={props.fileName}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={960}
        destroyOnHidden
      >
        {open && (
          <MediaSurface
            {...props}
            src={recovery.source}
            original={props.original || recovery.source !== props.src}
            expanded
          />
        )}
      </Modal>
    </div>
  )
}

function seekInitialFrame(player: HTMLVideoElement) {
  try {
    player.currentTime = Math.min(0.01, player.duration / 2)
  } catch {
    // Some sources are not seekable; native playback remains available.
  }
}
