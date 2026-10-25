import { defineMessages } from '../../../../shared/i18n'

export const workflowStepperMessages = defineMessages({
  vi: {
    ariaLabel: 'Quy trình xử lý đơn hàng',
    orderLayer: 'Đơn hàng',
    missionLayer: 'Nhiệm vụ',
    orderStages: {
      intake: { label: 'Tiếp nhận', hint: 'Hồ sơ và vị trí' },
      criteria: {
        label: 'Kiểm tra điều kiện',
        hint: 'Khu vực và điều kiện duyệt',
      },
      decision: { label: 'Quyết định', hint: 'Báo giá, duyệt hoặc từ chối' },
      deposit: { label: 'Đặt cọc', hint: 'Khách thanh toán' },
      planning: { label: 'Lập kế hoạch', hint: 'Tạo và chốt Mission' },
    },
    missionStages: {
      permit: { label: 'Giấy phép bay', hint: 'Xin và xác nhận cấp phép' },
      execute: { label: 'Thực hiện', hint: 'Bay và ghi nhận' },
      done: { label: 'Hoàn tất', hint: 'Nghiệm thu kết quả' },
    },
    state: {
      done: 'Đã hoàn thành · bấm để xem lại',
      doneStatic: 'Đã hoàn thành',
      current: 'Đang thực hiện',
      waiting: 'Đang chờ',
      upcoming: 'Chưa tới',
      blocked: 'Không thể tiếp tục',
    },
    orderComplete: 'Đã hoàn tất giai đoạn Đơn hàng',
    rejected: 'Đơn đã bị từ chối',
    cancelledOrder: 'Đơn đã bị huỷ',
    waitingDeposit: 'Chờ đặt cọc',
    waitingDepositNote: 'Đang chờ khách hoàn tất khoản đặt cọc để tiếp tục.',
    missionOf: (index: number, total: number) => `Mission ${index} / ${total}`,
    missionPrev: 'Mission trước',
    missionNext: 'Mission sau',
  },
  en: {
    ariaLabel: 'Order workflow',
    orderLayer: 'Order',
    missionLayer: 'Missions',
    orderStages: {
      intake: { label: 'Intake', hint: 'Profile and location' },
      criteria: {
        label: 'Eligibility check',
        hint: 'Area and approval criteria',
      },
      decision: { label: 'Decision', hint: 'Quote, approve or reject' },
      deposit: { label: 'Deposit', hint: 'Customer payment' },
      planning: { label: 'Planning', hint: 'Create and finalize Missions' },
    },
    missionStages: {
      permit: { label: 'Flight permit', hint: 'Request and confirm approval' },
      execute: { label: 'Execution', hint: 'Fly and capture' },
      done: { label: 'Completion', hint: 'Inspect results' },
    },
    state: {
      done: 'Completed · click to review',
      doneStatic: 'Completed',
      current: 'In progress',
      waiting: 'Waiting',
      upcoming: 'Not reached yet',
      blocked: 'Cannot continue',
    },
    orderComplete: 'Order stages completed',
    rejected: 'Order rejected',
    cancelledOrder: 'Order cancelled',
    waitingDeposit: 'Waiting for deposit',
    waitingDepositNote:
      'Waiting for the customer to pay the deposit before continuing.',
    missionOf: (index: number, total: number) => `Mission ${index} / ${total}`,
    missionPrev: 'Previous Mission',
    missionNext: 'Next Mission',
  },
})
