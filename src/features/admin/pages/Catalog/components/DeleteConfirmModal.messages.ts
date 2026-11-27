import { defineMessages } from '../../../../../shared/i18n'

export const deleteConfirmMessages = defineMessages({
  vi: {
    confirmPrefix: 'Bạn có chắc muốn xoá',
    confirmSuffix: '? Thao tác này không thể hoàn tác.',
    cancel: 'Huỷ',
    processing: 'Đang xoá...',
    action: 'Xoá',
    genericError: 'Không xoá được. Vui lòng thử lại.',
    serviceInUse:
      'Dịch vụ đã có đơn hàng hoặc dữ liệu liên quan nên không thể xóa vĩnh viễn. Bạn có thể tạm ngừng hoạt động trong phần chỉnh sửa dịch vụ.',
  },
  en: {
    confirmPrefix: 'Are you sure you want to delete',
    confirmSuffix: '? This action cannot be undone.',
    cancel: 'Cancel',
    processing: 'Deleting...',
    action: 'Delete',
    genericError: 'Could not delete. Please try again.',
    serviceInUse:
      'This service has orders or related records and cannot be permanently deleted. You can temporarily deactivate it in the service editor.',
  },
})
