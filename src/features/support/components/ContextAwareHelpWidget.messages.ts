import { defineMessages } from '../../../shared/i18n'

export const contextAwareHelpWidgetMessages = defineMessages({
  vi: {
    heading: (isOrder: boolean) =>
      `Bạn cần trợ giúp cho ${isOrder ? 'đơn hàng' : 'mission bay'} này?`,
    currentOrder: 'Đơn hàng hiện tại',
    currentMission: 'Nhiệm vụ hiện tại',
    orderRef: (id: string) => `Đơn hàng #${id}`,
    missionRef: (id: string) => `Nhiệm vụ #${id}`,
    preflightFailedBanner:
      'Lần bay này không thể khởi hành do drone không vượt qua kiểm tra an toàn tự động trước chuyến bay.',
    suggestedFor: (status: string) =>
      `Câu hỏi thường gặp gợi ý cho trạng thái (${status}):`,
    thisOrder: 'Đơn hàng này',
    thisMission: 'Nhiệm vụ này',
    needHelpFor: 'Cần hỗ trợ riêng cho',
    autoAttach: 'Tạo yêu cầu hỗ trợ đính kèm tự động:',
    createTicketFor: (label: string) => `Tạo yêu cầu hỗ trợ cho ${label}`,
    subject: (isOrder: boolean, label: string) =>
      `Cần hỗ trợ cho ${isOrder ? 'đơn hàng' : 'mission'} ${label}`,
    questions: {
      'ord-1': 'Tại sao đơn hàng của tôi vẫn đang chờ phê duyệt?',
      'ord-3': 'Tôi có thể thay đổi lịch bay đã chọn không?',
      'ord-4': 'Chính sách hủy đơn và hoàn tiền như thế nào?',
      'msn-3': 'Tại sao lần bay của tôi bị thất bại kiểm tra an toàn?',
      'msn-2': 'Hệ thống có tự động điều drone thay thế không?',
      'msn-1': 'Khi nào lịch bay lại của tôi sẽ được xếp?',
    },
  },
  en: {
    heading: (isOrder: boolean) =>
      `Need help with this ${isOrder ? 'order' : 'flight mission'}?`,
    currentOrder: 'Current order',
    currentMission: 'Current mission',
    orderRef: (id: string) => `Order #${id}`,
    missionRef: (id: string) => `Mission #${id}`,
    preflightFailedBanner:
      'This flight could not depart because the drone did not pass the automated preflight safety check.',
    suggestedFor: (status: string) =>
      `Suggested questions for status (${status}):`,
    thisOrder: 'this order',
    thisMission: 'this mission',
    needHelpFor: 'Need one-to-one help with',
    autoAttach: 'Create a ticket with the details attached automatically:',
    createTicketFor: (label: string) => `Create a ticket for ${label}`,
    subject: (isOrder: boolean, label: string) =>
      `Need help with ${isOrder ? 'order' : 'mission'} ${label}`,
    questions: {
      'ord-1': 'Why is my order still pending approval?',
      'ord-3': 'Can I change the flight schedule I picked?',
      'ord-4': 'What is the cancellation and refund policy?',
      'msn-3': 'Why did my flight fail the safety check?',
      'msn-2': 'Will a replacement drone be assigned automatically?',
      'msn-1': 'When will my flight be rescheduled?',
    },
  },
})
