import { useEffect } from 'react'
import { useI18n, defineMessages } from '../../i18n'
import { useMediaRecovery, type MediaRecoveryProps } from './useMediaRecovery'
import './MediaRecovery.css'

const messages = defineMessages({
  vi: {
    loading: 'Đang lấy lại đường dẫn xem…',
    failed:
      'Không thể hiển thị tệp. Tệp có thể không còn khả dụng hoặc định dạng chưa được trình duyệt hỗ trợ.',
    retry: 'Thử lại',
    large: 'Bản gốc lớn hơn 20 MB. Chỉ tải khi bạn muốn xem.',
    open: 'Mở bản gốc để xem',
  },
  en: {
    loading: 'Refreshing the viewing link…',
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
function MediaSurface(props: Props) {
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
    <video
      src={recovery.source}
      poster={props.poster ?? undefined}
      controls
      preload="none"
      aria-label={props.fileName}
      onError={recovery.onError}
      onLoadStart={recovery.startLoad}
      onLoadedData={recovery.completeLoad}
      onStalled={recovery.restartLoad}
      onWaiting={recovery.restartLoad}
      onPlaying={recovery.completeLoad}
    />
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
