import { ApiError } from '../../../shared/api/httpClient'
import { getLanguage } from '../../../shared/i18n'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import type { StaffFileSelection } from '../capture/captureTime'

/** Each file is explicitly submitted once; transport/validation remains owned by the media API. */
export async function uploadStaffMediaBatch({
  missionId,
  deviceId,
  files,
  onPrepared,
  onFileStart,
}: {
  missionId: string
  deviceId: string
  files: StaffFileSelection[]
  onPrepared?: (mediaId: string, item: LocalMedia) => Promise<void>
  onFileStart?: (index: number) => void
}) {
  const failures: string[] = []
  let nextIndex = 0
  const worker = async () => {
    while (nextIndex < files.length) {
      const index = nextIndex++
      const { file, capturedAt, declaration, uploadIntentId } = files[index]
      onFileStart?.(index)
      try {
        await operatorMediaApi.uploadStaffFile(
          missionId,
          deviceId,
          file,
          capturedAt,
          onPrepared,
          declaration,
          uploadIntentId,
        )
      } catch (cause) {
        const english = getLanguage() === 'en'
        const message =
          cause instanceof ApiError && cause.code === 'MEDIA_REMOVED'
            ? english
              ? 'The previous upload was removed. Select the file again to start a new upload.'
              : 'Lần tải trước của tệp này đã được gỡ. Hãy chọn lại tệp để bắt đầu lần tải mới.'
            : cause instanceof ApiError && cause.code === 'MEDIA_NOT_FOUND'
              ? english
                ? 'The upload record was not found. Refresh the Mission and try again.'
                : 'Không tìm thấy bản ghi của lần tải này. Hãy làm mới Mission và kiểm tra lại.'
              : cause instanceof Error
                ? cause.message
                : english
                  ? 'Unable to upload this file.'
                  : 'Không thể tải tệp lên.'
        failures.push(`${file.name}: ${message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, files.length) }, worker))
  return { failures, submitted: files.length - failures.length }
}
