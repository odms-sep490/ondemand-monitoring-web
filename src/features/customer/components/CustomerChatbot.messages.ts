import { defineMessages } from '../../../shared/i18n'

export const customerChatbotMessages = defineMessages({
  vi: {
    chips: {
      createRequest: 'Tạo yêu cầu',
      flightZone: 'Kiểm tra vùng bay',
      cost: 'Chi phí',
      weather: 'Thời tiết',
    },
    replies: {
      createRequest:
        'Bạn chọn dịch vụ, vị trí, phạm vi giám sát rồi gửi yêu cầu để quản lý duyệt.',
      flightZone:
        'Khi bạn kéo vị trí hoặc đổi bán kính, hệ thống sẽ kiểm tra vùng cấm bay và báo hợp lệ ngay trên bản đồ.',
      cost: 'Chi phí phụ thuộc diện tích, thời lượng, loại payload và độ phức tạp nhiệm vụ. Báo giá sẽ hiện trước khi bạn gửi duyệt.',
      weather:
        'Nếu thời tiết xấu, hệ thống sẽ cảnh báo và có thể gợi ý đổi lịch bay để đảm bảo an toàn.',
      status:
        'Sau khi gửi yêu cầu, bạn theo dõi trạng thái ở mục Đơn của tôi và nhận thông báo khi đơn được duyệt.',
      fallback:
        'Mình có thể hỗ trợ về tạo yêu cầu, vùng bay, chi phí, thời tiết và trạng thái đơn. Bạn hỏi ngắn hơn một chút nhé.',
    },
    greeting:
      'Xin chào! Mình có thể hỗ trợ bạn tạo yêu cầu giám sát và kiểm tra thông tin nhiệm vụ.',
    assistantLabel: 'Trợ lý khách hàng',
    assistantName: 'Trợ lý ODMS',
    online: 'Đang trực tuyến',
    closeChatbot: 'Đóng chatbot',
    openChatbot: 'Mở chatbot',
    inputPlaceholder: 'Nhập câu hỏi...',
    send: 'Gửi',
    bubble: 'Cần hỗ trợ?',
  },
  en: {
    chips: {
      createRequest: 'Create request',
      flightZone: 'Check flight zone',
      cost: 'Cost',
      weather: 'Weather',
    },
    replies: {
      createRequest:
        'Choose a service, location and monitoring scope, then submit the request for manager approval.',
      flightZone:
        'When you drag the location or change the radius, the system checks for no-fly zones and shows validity right on the map.',
      cost: 'Cost depends on the area, duration, payload type, and mission complexity. A quote is shown before you submit for approval.',
      weather:
        'If the weather is bad, the system will warn you and may suggest rescheduling the flight to keep it safe.',
      status:
        'After submitting a request, track its status under My orders and get notified when it is approved.',
      fallback:
        'I can help with creating requests, flight zones, cost, weather, and order status. Try a shorter question.',
    },
    greeting:
      'Hi! I can help you create a monitoring request and check mission information.',
    assistantLabel: 'Customer assistant',
    assistantName: 'ODMS Assistant',
    online: 'Online',
    closeChatbot: 'Close chatbot',
    openChatbot: 'Open chatbot',
    inputPlaceholder: 'Type a question...',
    send: 'Send',
    bubble: 'Need help?',
  },
})
