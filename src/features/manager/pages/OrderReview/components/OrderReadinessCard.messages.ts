import { defineMessages } from '../../../../../shared/i18n'

export const orderReadinessCardMessages = defineMessages({
  vi: {
    approvalCriteria: 'Điều kiện duyệt',
    checking: 'Đang kiểm tra điều kiện duyệt...',
    loadFailed: 'Không tải được điều kiện duyệt.',
    saveFailed: 'Không lưu được. Vui lòng thử lại.',
    reasonRequired:
      'Vui lòng nhập lý do cho tất cả tiêu chí không đạt trước khi tiếp tục.',
    chooseSupplement: 'Chọn ít nhất một nội dung khách hàng cần bổ sung.',
    customerSupplement: (items: string) => `Khách hàng cần bổ sung: ${items}`,
    submitFailed: 'Không gửi được quyết định.',
    requiredFailed: 'Có tiêu chí bắt buộc không đạt',
    pendingManager: (n: number) => `Còn ${n} mục manager cần xác nhận`,
    managerConfirm: 'Quản lý xác nhận',
    confirmedCount: 'đã xác nhận',
  },
  en: {
    approvalCriteria: 'Approval criteria',
    checking: 'Checking approval criteria...',
    loadFailed: 'Could not load the approval criteria.',
    saveFailed: 'Could not save. Please try again.',
    reasonRequired:
      'Please enter a reason for every failed criterion before continuing.',
    chooseSupplement: 'Select at least one item the customer needs to supply.',
    customerSupplement: (items: string) => `Customer needs to supply: ${items}`,
    submitFailed: 'Could not submit the decision.',
    requiredFailed: 'A required criterion failed',
    pendingManager: (n: number) =>
      `${n} item(s) still need manager confirmation`,
    managerConfirm: 'Manager confirmation',
    confirmedCount: 'confirmed',
  },
})
