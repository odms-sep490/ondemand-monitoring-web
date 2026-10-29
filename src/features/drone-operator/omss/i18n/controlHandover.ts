import { defineMessages } from '../../../../shared/i18n'

export const controlHandoverMessages = defineMessages({
  vi: {
    preflightCheck: 'Kiểm tra trước bay',
    title: 'Bàn giao quyền điều khiển',
    description:
      'Yêu cầu phê duyệt từ quản lý giám sát trước khi bắt đầu nhiệm vụ.',
    steps: {
      submitRequest: 'Gửi yêu cầu',
      managerApproves: 'Quản lý phê duyệt',
      enterAuthCode: 'Nhập mã xác thực',
    },
    fields: {
      mission: 'Nhiệm vụ',
      drone: 'Drone',
      operator: 'Operator',
      scheduled: 'Lịch trình',
    },
    requestHandover: 'Yêu cầu phê duyệt bàn giao',
    awaitingApproval: 'Đang chờ quản lý phê duyệt',
    notificationSent: 'Thông báo đã được gửi tới quản lý giám sát.',
    approvedByManager: 'Quản lý đã phê duyệt bàn giao',
    enterCodePrompt:
      'Nhập mã xác thực do quản lý của bạn cung cấp để tiếp tục.',
    authCodeLabel: 'Mã xác thực',
    authCodePlaceholder: 'Nhập mã 6 chữ số',
    confirmLabel:
      'Tôi xác nhận quyền điều khiển đã được bàn giao và chấp nhận toàn bộ trách nhiệm vận hành nhiệm vụ này.',
    completeHandover: 'Hoàn tất bàn giao',
  },
  en: {
    preflightCheck: 'Pre-flight check',
    title: 'Control handover',
    description:
      'Request authorisation from your supervising manager before starting the mission.',
    steps: {
      submitRequest: 'Submit request',
      managerApproves: 'Manager approves',
      enterAuthCode: 'Enter auth code',
    },
    fields: {
      mission: 'Mission',
      drone: 'Drone',
      operator: 'Operator',
      scheduled: 'Scheduled',
    },
    requestHandover: 'Request handover authorisation',
    awaitingApproval: 'Awaiting manager approval',
    notificationSent:
      'A notification has been sent to the supervising manager.',
    approvedByManager: 'Handover approved by manager',
    enterCodePrompt:
      'Enter the authorisation code provided by your manager to continue.',
    authCodeLabel: 'Authorisation code',
    authCodePlaceholder: 'Enter 6-digit code',
    confirmLabel:
      'I confirm that control has been handed over and I accept full operational responsibility for this mission.',
    completeHandover: 'Complete handover',
  },
})
