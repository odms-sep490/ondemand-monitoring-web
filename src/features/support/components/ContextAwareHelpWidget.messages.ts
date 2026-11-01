import { defineMessages } from '../../../shared/i18n'

export const contextAwareHelpWidgetMessages = defineMessages({
  vi: {
    heading: (isOrder: boolean) =>
      `Bạn cần trợ giúp cho ${isOrder ? 'đơn hàng' : 'nhiệm vụ bay'} này?`,
    currentOrder: 'Đơn hàng hiện tại',
    currentMission: 'Nhiệm vụ hiện tại',
    orderRef: (id: string) => `Đơn hàng #${id}`,
    missionRef: (id: string) => `Nhiệm vụ #${id}`,
    preflightFailedBanner:
      'Lần bay này không thể khởi hành do drone không vượt qua kiểm tra an toàn tự động trước chuyến bay.',
    suggestedFor: (status: string) =>
      `Câu hỏi thường gặp gợi ý cho trạng thái (${status}):`,
    noSuggestedQuestions:
      'Chưa có câu hỏi thường gặp riêng cho bước này. Bạn có thể tạo yêu cầu hỗ trợ bên dưới.',
    thisOrder: 'Đơn hàng này',
    thisMission: 'Nhiệm vụ này',
    needHelpFor: 'Cần hỗ trợ riêng cho',
    autoAttach: 'Tạo ticket đính kèm tự động:',
    createTicketFor: (label: string) => `Tạo ticket cho ${label}`,
    subject: (isOrder: boolean, label: string) =>
      `Cần hỗ trợ cho ${isOrder ? 'đơn hàng' : 'nhiệm vụ'} ${label}`,
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
    noSuggestedQuestions:
      'There are no dedicated FAQs for this step yet. You can create a support request below.',
    thisOrder: 'this order',
    thisMission: 'this mission',
    needHelpFor: 'Need one-to-one help with',
    autoAttach: 'Create a ticket with the details attached automatically:',
    createTicketFor: (label: string) => `Create a ticket for ${label}`,
    subject: (isOrder: boolean, label: string) =>
      `Need help with ${isOrder ? 'order' : 'mission'} ${label}`,
  },
})
