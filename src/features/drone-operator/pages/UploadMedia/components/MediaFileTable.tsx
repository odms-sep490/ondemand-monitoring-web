import { MediaTable } from './MediaTable'
import type { MediaFile } from '../../../types/mission'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'

export function MediaFileTable({
  files,
  busyId,
  isBusy,
  items,
  approve,
  effectiveStatus,
}: {
  files: MediaFile[]
  busyId: string | null
  isBusy: boolean
  items: LocalMedia[]
  approve: (item: LocalMedia, manual?: boolean) => Promise<boolean>
  effectiveStatus: (item: LocalMedia) => string
}) {
  return (
    <MediaTable
      files={files}
      retryingId={busyId}
      onRetry={(id) => {
        if (isBusy) return
        const item = items.find((entry) => entry.localMediaId === id)
        if (item)
          void approve(item, effectiveStatus(item) === 'MANUAL_UPLOAD_REQUIRED')
      }}
    />
  )
}
