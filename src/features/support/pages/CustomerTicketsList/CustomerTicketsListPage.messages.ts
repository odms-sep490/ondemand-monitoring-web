import { defineMessages } from '../../../../shared/i18n'

export const customerTicketsListMessages = defineMessages({
  vi: {
    back: '← Trung tâm hỗ trợ',
    title: 'Yêu cầu hỗ trợ của tôi',
    subtitle:
      'Theo dõi các yêu cầu hỗ trợ bạn đã gửi và trao đổi với đội ngũ của chúng tôi.',
    create: '+ Tạo yêu cầu hỗ trợ',
    total: 'Tổng số yêu cầu',
    filter: 'Lọc trạng thái',
    all: 'Tất cả',
    emptyTitle: 'Bạn chưa có yêu cầu hỗ trợ nào',
    emptyDescription:
      'Nếu bạn gặp sự cố với đơn hàng hoặc nhiệm vụ bay, đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ.',
    emptyAction: 'Tạo yêu cầu hỗ trợ đầu tiên',
    errorTitle: 'Không tải được danh sách yêu cầu hỗ trợ',
    viewOrder: 'Xem đơn hàng ↗',
    viewOrderTitle: 'Xem chi tiết đơn hàng liên kết',
    viewMission: 'Xem nhiệm vụ ↗',
    viewMissionTitle: 'Xem nhiệm vụ liên kết',
    createdAt: (date: string) => `Tạo lúc ${date}`,
    viewDetails: 'Xem chi tiết →',
  },
  en: {
    back: '← Help center',
    title: 'My support tickets',
    subtitle: 'Track the tickets you have opened and talk to our team.',
    create: '+ New support ticket',
    total: 'Total tickets',
    filter: 'Filter by status',
    all: 'All',
    emptyTitle: "You don't have any support tickets yet",
    emptyDescription:
      'If something goes wrong with an order or a flight mission, our team is here to help.',
    emptyAction: 'Open your first ticket',
    errorTitle: 'Unable to load your support tickets',
    viewOrder: 'View order ↗',
    viewOrderTitle: 'Open the linked order',
    viewMission: 'View mission ↗',
    viewMissionTitle: 'Open the linked mission',
    createdAt: (date: string) => `Opened ${date}`,
    viewDetails: 'View details →',
  },
})
