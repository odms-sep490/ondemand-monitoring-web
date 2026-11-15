import type { Language } from '../../../shared/i18n'

const reasons: Record<string, { vi: string; en: string }> = {
  MEDIA_CAPTURE_TOO_OLD: {
    vi: 'Thời điểm chụp/quay đã vượt giới hạn thời gian cho phép theo thời lượng dự kiến của nhiệm vụ. Không thể tải tệp này lên; hãy kiểm tra thời gian chụp/quay và chọn tệp phù hợp.',
    en: 'The capture time exceeds the allowed age based on the planned mission duration. This file cannot be uploaded; check its capture time and select an eligible file.',
  },
  MANUAL_UPLOAD_REQUIRED: {
    vi: 'Media cần tải lên thủ công trước khi gắn.',
    en: 'Upload the media manually before attaching it.',
  },
  LOCAL_MEDIA_UNAVAILABLE: {
    vi: 'Không tìm thấy tệp gốc trên thiết bị.',
    en: 'The original file could not be found on the device.',
  },
  MEDIA_UPLOAD_NOT_ALLOWED: {
    vi: 'Tài khoản hiện không có quyền tải media lên.',
    en: 'Your account is not currently allowed to upload media.',
  },
}

export function evidenceQueueFeedback(
  code: string | undefined,
  language: Language,
): string {
  return (
    reasons[code ?? '']?.[language] ??
    (language === 'vi'
      ? 'Không thể tải hoặc gắn media. Hãy thử lại.'
      : 'Could not upload or attach the media. Please try again.')
  )
}
