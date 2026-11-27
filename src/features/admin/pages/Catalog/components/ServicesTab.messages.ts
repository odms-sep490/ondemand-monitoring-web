import { defineMessages } from '../../../../../shared/i18n'

export const servicesTabMessages = defineMessages({
  vi: {
    add: '+ Thêm dịch vụ',
    emptyTitle: 'Chưa có dịch vụ',
    emptyDescription: 'Thêm dịch vụ đầu tiên vào danh mục.',
    deleteTitle: 'Xóa vĩnh viễn dịch vụ',
    deleteDescription:
      'Xóa dịch vụ và cấu hình riêng của dịch vụ. Checklist trong thư viện vẫn được giữ. Dịch vụ đã có đơn hàng không thể xóa; hãy dùng công tắc trong form chỉnh sửa để tạm ngừng hoạt động.',
  },
  en: {
    add: '+ Add service',
    emptyTitle: 'No services yet',
    emptyDescription: 'Add the first service to the catalog.',
    deleteTitle: 'Permanently delete service',
    deleteDescription:
      'Delete the service and its own configuration. Library checklists are kept. Services with orders cannot be deleted; use the switch in the service editor to temporarily deactivate them.',
  },
})
