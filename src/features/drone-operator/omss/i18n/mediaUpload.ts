import { defineMessages } from '../../../../shared/i18n'

export const mediaUploadMessages = defineMessages({
  vi: {
    title: 'Kiểm tra media đã chụp',
    description:
      'Tệp vẫn lưu trên Flight Controller cho đến khi bạn xóa. Duyệt sẽ gửi bản gốc thẳng lên S3; khách hàng chỉ thấy sau khi hệ thống xác thực.',
    refresh: 'Làm mới',
    manualUploadTasks: 'Tác vụ tải thủ công',
    backToMissions: 'Quay lại danh sách nhiệm vụ',
    loading: 'Đang tải media cục bộ…',
    noCaptures: 'Chưa có tệp chụp nào cho nhiệm vụ này.',
    backendMedia: 'Media backend',
    uploading: 'Đang tải lên…',
    approveAndUpload: 'Duyệt & tải lên',
    removeLocalCopy: 'Xóa bản sao cục bộ',
    discard: 'Xóa',
    discardConfirm: (fileName: string) =>
      `Xóa ${fileName} khỏi Flight Controller?`,
    cannotLoad: 'Không thể tải media cục bộ',
    discardFailed: 'Xóa thất bại',
    uploadFailed: 'Tải lên thất bại',
  },
  en: {
    title: 'Review captured media',
    description:
      'Files remain on the Flight Controller until you discard them. Approve sends the original directly to S3; the Customer sees it only after backend validation.',
    refresh: 'Refresh',
    manualUploadTasks: 'Manual upload tasks',
    backToMissions: 'Back to missions',
    loading: 'Loading local media…',
    noCaptures: 'No captures for this mission yet.',
    backendMedia: 'Backend media',
    uploading: 'Uploading…',
    approveAndUpload: 'Approve & upload',
    removeLocalCopy: 'Remove local copy',
    discard: 'Discard',
    discardConfirm: (fileName: string) =>
      `Discard ${fileName} from the Flight Controller?`,
    cannotLoad: 'Cannot load local media',
    discardFailed: 'Discard failed',
    uploadFailed: 'Upload failed',
  },
})
