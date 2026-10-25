import { defineMessages } from '../../../../../shared/i18n'

export const mediaTableMessages = defineMessages({
  vi: {
    emptyTitle: 'Chưa có media để upload',
    emptyBody: 'Không có tệp nào ở trạng thái PENDING_UPLOAD trên thiết bị.',
    columns: {
      name: 'Tên tệp',
      type: 'Loại',
      size: 'Dung lượng',
      progress: 'Tiến trình',
      attempt: 'Lần thử',
      status: 'Trạng thái',
    },
    statusLabel: {
      UPLOADED: 'Đã upload',
      UPLOADING: 'Đang upload',
      FAILED: 'Thất bại',
      PENDING_UPLOAD: 'Chờ upload',
    },
    manualTaskCreated: 'Đã tạo yêu cầu xử lý thủ công',
    retrying: 'Đang thử...',
    retry: 'Thử lại',
    validating: 'Đang xác thực',
  },
  en: {
    emptyTitle: 'No media to upload yet',
    emptyBody: 'No files on the device are in PENDING_UPLOAD status.',
    columns: {
      name: 'File name',
      type: 'Type',
      size: 'Size',
      progress: 'Progress',
      attempt: 'Attempt',
      status: 'Status',
    },
    statusLabel: {
      UPLOADED: 'Uploaded',
      UPLOADING: 'Uploading',
      FAILED: 'Failed',
      PENDING_UPLOAD: 'Pending upload',
    },
    manualTaskCreated: 'A manual review task was created',
    retrying: 'Retrying...',
    retry: 'Retry',
    validating: 'Validating',
  },
})
