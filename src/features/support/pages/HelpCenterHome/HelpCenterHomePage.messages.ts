import { defineMessages } from '../../../../shared/i18n'

export const helpCenterHomeMessages = defineMessages({
  vi: {
    eyebrow: 'Thông tin & Hướng dẫn sử dụng',
    title: 'Chúng tôi có thể hỗ trợ bạn như thế nào?',
    subtitle:
      'Tìm câu trả lời về đơn hàng giám sát, lịch bay, kết quả và cài đặt tài khoản của bạn.',
    myTickets: 'Yêu cầu hỗ trợ của tôi',
    createTicket: '+ Tạo yêu cầu hỗ trợ',
    searchLabel: 'Tìm kiếm câu trả lời',
    searchPlaceholder:
      "Tìm kiếm câu trả lời (vd: 'Tại sao đơn hàng chưa được duyệt?', 'Video bị thiếu')...",
    clearSearch: 'Xóa tìm kiếm',
    topicsTitle: 'Chủ đề phổ biến',
    articleCount: (n: number) => `${n} bài viết`,
    faqTitle: 'Câu hỏi thường gặp',
    faqTitleFiltered: (topic: string) => `Câu hỏi thường gặp (${topic})`,
    clearFilter: 'Xóa bộ lọc',
    emptyTitle: 'Không tìm thấy bài viết nào',
    emptyDescription: (query: string) =>
      query
        ? `Không tìm thấy câu hỏi phù hợp với "${query}". Bạn có thể tạo yêu cầu hỗ trợ trực tiếp.`
        : 'Chưa có bài viết nào trong chủ đề này. Bạn có thể tạo yêu cầu hỗ trợ trực tiếp.',
    contactSupport: 'Liên hệ đội hỗ trợ',
    helpful: 'Bài viết này có hữu ích không?',
    yes: 'Có',
    no: 'Không',
    thanks: 'Cảm ơn phản hồi của bạn!',
    needMore: 'Vẫn cần hỗ trợ thêm?',
    createTicketShort: 'Tạo yêu cầu hỗ trợ',
  },
  en: {
    eyebrow: 'Guides & how-tos',
    title: 'How can we help you?',
    subtitle:
      'Find answers about your monitoring orders, flight schedules, results and account settings.',
    myTickets: 'My support tickets',
    createTicket: '+ New support ticket',
    searchLabel: 'Search for answers',
    searchPlaceholder:
      "Search for answers (for example 'Why is my order not approved?', 'Video is missing')...",
    clearSearch: 'Clear search',
    topicsTitle: 'Popular topics',
    articleCount: (n: number) => `${n} ${n === 1 ? 'article' : 'articles'}`,
    faqTitle: 'Frequently asked questions',
    faqTitleFiltered: (topic: string) =>
      `Frequently asked questions (${topic})`,
    clearFilter: 'Clear filter',
    emptyTitle: 'No articles found',
    emptyDescription: (query: string) =>
      query
        ? `No questions match "${query}". You can open a support ticket instead.`
        : 'There are no articles in this topic yet. You can open a support ticket instead.',
    contactSupport: 'Contact support',
    helpful: 'Was this article helpful?',
    yes: 'Yes',
    no: 'No',
    thanks: 'Thanks for your feedback!',
    needMore: 'Still need help?',
    createTicketShort: 'Open a ticket',
  },
})
