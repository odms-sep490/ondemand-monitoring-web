import { defineMessages } from '../../../shared/i18n'

export const benefitIds = [
  'saferAccess',
  'clearProgress',
  'sharedResults',
] as const

export const benefitMessages = defineMessages({
  vi: {
    saferAccess: {
      title: 'Giảm nhu cầu tiếp cận khu vực khó hoặc nguy hiểm',
      detail:
        'Lựa chọn kiểm tra từ xa khi điều kiện hiện trường phù hợp, giúp hạn chế việc phải đến gần vị trí rủi ro.',
    },
    clearProgress: {
      title: 'Theo dõi tiến độ và trao đổi rõ ràng',
      detail:
        'Xem trạng thái xử lý và thông tin cập nhật gắn với yêu cầu của bạn.',
    },
    sharedResults: {
      title: 'Tập trung báo cáo và kết quả tại một nơi',
      detail:
        'Tra cứu báo cáo, hình ảnh và ghi chú kiểm tra từ dashboard khách hàng.',
    },
  },
  en: {
    saferAccess: {
      title: 'Reduce exposure to hard-to-reach or hazardous areas',
      detail:
        'Use remote inspection when site conditions allow, reducing the need to approach risky locations in person.',
    },
    clearProgress: {
      title: 'Follow progress and communicate clearly',
      detail:
        'See request status and updates in the context of your service request.',
    },
    sharedResults: {
      title: 'Keep reports and results together',
      detail:
        'Review inspection reports, images, and notes from your customer dashboard.',
    },
  },
})
