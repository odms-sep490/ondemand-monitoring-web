import { defineMessages } from '../../../shared/i18n'

// Patterns accept common Vietnamese and English keywords. Replies are always
// selected from the active locale, never borrowed from the other dictionary.
export const kbPatterns: RegExp[] = [
  /chi ph[ií]|gi[aá]|cost|price|pricing/i,
  /tr[aạ]ng th[aá]i|ti[eế]n [đd][ộo]|ticket|status|progress/i,
  /b[aá]o c[aá]o|k[eế]t qu[aả]|report|result|finding/i,
  /an to[aà]n|nguy hi[eể]m|drone|safety|hazard/i,
  /t[aạ]o|[đd][ăa]ng k[yý]|y[eê]u c[aầ]u|create|request|submit/i,
]

export const chatbotWidgetMessages = defineMessages({
  vi: {
    responses: [
      'Chi phí được xác định theo phạm vi và nội dung kiểm tra. Hãy tạo yêu cầu để đội ngũ trao đổi và xác nhận thông tin cụ thể.',
      'Bạn có thể xem tiến độ và trao đổi trực tiếp trong ticket gắn với từng yêu cầu. Lịch sử cập nhật được lưu để tiện theo dõi.',
      'Báo cáo được hiển thị trong dashboard sau khi hoàn tất, theo phạm vi đã thống nhất. Báo cáo có thể kèm hình ảnh và ghi chú phát hiện.',
      'Mục tiêu của dịch vụ là giảm nhu cầu tiếp cận trực tiếp khu vực khó hoặc có rủi ro. Đội ngũ sẽ xác định phương thức phù hợp; drone chỉ là một công cụ hỗ trợ khi thích hợp.',
      'Bạn có thể đăng nhập rồi chọn “Tạo yêu cầu” để mô tả khu vực, mục tiêu kiểm tra và thời gian mong muốn. Đội ngũ sẽ tiếp nhận và xác nhận phạm vi.',
    ],
    chips: [
      'Cách tạo yêu cầu?',
      'Theo dõi tiến độ ở đâu?',
      'Báo cáo gồm những gì?',
      'Có phải luôn dùng drone?',
    ],
    defaultMessage:
      'Mình chưa có câu trả lời phù hợp. Bạn có thể hỏi về cách tạo yêu cầu, theo dõi ticket, báo cáo hoặc liên hệ support@odms.vn.',
    greeting:
      'Xin chào! Mình là trợ lý OnDemand Monitor. Mình có thể hướng dẫn bạn tạo yêu cầu, theo dõi tiến độ và tìm báo cáo.',
    assistantName: 'Trợ lý ODMS',
    onlineStatus: 'Trực tuyến',
    close: 'Đóng trợ lý',
    inputPlaceholder: 'Nhập câu hỏi của bạn...',
    send: 'Gửi',
    hint: 'Cần hỗ trợ về yêu cầu?',
    fabAriaLabel: 'Trợ lý OnDemand Monitor',
  },
  en: {
    responses: [
      'Cost is based on the inspection scope and requested work. Create a request so our team can discuss and confirm the details.',
      'You can follow progress and communicate in the ticket linked to each request. Updates stay in its history for reference.',
      'Once the work is complete, the report appears in your dashboard based on the agreed scope. It may include images and inspection notes.',
      'The service aims to reduce the need to enter hard-to-reach or hazardous areas in person. Our team determines a suitable method; a drone is only a supporting tool when appropriate.',
      'Sign in and choose “Create request” to describe the site, inspection goal, and preferred timing. Our team will review it and confirm the scope.',
    ],
    chips: [
      'How do I create a request?',
      'Where can I track progress?',
      'What is in the report?',
      'Does every job use a drone?',
    ],
    defaultMessage:
      "I don't have a matching answer yet. Ask about creating a request, tracking a ticket, reports, or contact support@odms.vn.",
    greeting:
      "Hi! I'm the OnDemand Monitor assistant. I can help you create a request, track progress, and find reports.",
    assistantName: 'ODMS Assistant',
    onlineStatus: 'Online',
    close: 'Close assistant',
    inputPlaceholder: 'Type your question...',
    send: 'Send',
    hint: 'Questions about a request?',
    fabAriaLabel: 'OnDemand Monitor assistant',
  },
})
