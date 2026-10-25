import { defineMessages } from '../../../../shared/i18n'

export const orderQueuePageMessages = defineMessages({
  vi: {
    title: 'Hàng đợi duyệt đơn',
    summary: (count: number, paid: number) =>
      `${count} đơn chờ duyệt · ${paid} đơn chờ lập kế hoạch`,
    paid: {
      title: 'Đơn đã nhận cọc – chờ lập kế hoạch',
      description:
        'Khách hàng đã thanh toán tiền đặt cọc. Manager có thể tạo Mission và phân công nguồn lực.',
      count: (count: number) => `${count} đơn sẵn sàng`,
      status: 'Trạng thái',
      depositReceived: 'Đã nhận cọc',
      action: 'Lập kế hoạch',
    },
    all: {
      title: 'Tất cả đơn hàng',
      description:
        'Xem lại mọi đơn, kể cả đơn đã duyệt đang chờ khách đặt cọc, đang thực hiện hoặc đã hoàn tất.',
      filters: {
        ALL: 'Tất cả',
        APPROVED: 'Đã duyệt',
        IN_PROGRESS: 'Đang thực hiện',
        COMPLETED: 'Hoàn tất',
        NEEDS_INFO: 'Cần bổ sung',
        CLOSED: 'Từ chối / Hủy',
      } as Record<string, string>,
      status: 'Trạng thái',
      view: 'Xem',
      empty: 'Không có đơn nào trong nhóm này.',
      loadError: 'Không tải được danh sách đơn.',
    },
    missionsToAssign: 'Mission chờ phân công',
    viewMissions: 'Xem nhiệm vụ đã tạo',
    refresh: 'Làm mới',
    loadError: 'Không tải được hàng đợi',
    emptyTitle: 'Không còn đơn chờ duyệt',
    emptyDescription:
      'Tuyệt vời. Khi khách gửi đơn mới, đơn sẽ xuất hiện ở đây. Các nhiệm vụ đã tạo có thể xem ở danh sách nhiệm vụ.',
    columns: {
      orderCode: 'Mã đơn',
      customer: 'Khách hàng',
      service: 'Dịch vụ',
      preferredDate: 'Ngày mong muốn',
    },
    review: 'Duyệt',
    loading: 'Đang tải…',
  },
  en: {
    title: 'Order review queue',
    summary: (count: number, paid: number) =>
      `${count} pending review · ${paid} ready for planning`,
    paid: {
      title: 'Deposit received – planning queue',
      description:
        'The customer has paid the deposit. A manager can now create Missions and assign resources.',
      count: (count: number) => `${count} ready`,
      status: 'Status',
      depositReceived: 'Deposit received',
      action: 'Plan execution',
    },
    missionsToAssign: 'Missions to assign',
    viewMissions: 'View created missions',
    all: {
      title: 'All orders',
      description:
        'Look back at every order, including approved orders waiting for the deposit, in progress or completed.',
      filters: {
        ALL: 'All',
        APPROVED: 'Approved',
        IN_PROGRESS: 'In progress',
        COMPLETED: 'Completed',
        NEEDS_INFO: 'Needs info',
        CLOSED: 'Rejected / Cancelled',
      } as Record<string, string>,
      status: 'Status',
      view: 'View',
      empty: 'No orders in this group.',
      loadError: 'Could not load the order list.',
    },
    refresh: 'Refresh',
    loadError: 'Could not load the queue',
    emptyTitle: 'No orders pending review',
    emptyDescription:
      'Nicely done. New orders will show up here as customers submit them.',
    columns: {
      orderCode: 'Order ID',
      customer: 'Customer',
      service: 'Service',
      preferredDate: 'Preferred date',
    },
    review: 'Review',
    loading: 'Loading…',
  },
})
