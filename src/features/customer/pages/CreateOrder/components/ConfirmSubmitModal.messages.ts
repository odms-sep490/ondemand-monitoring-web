import { defineMessages } from '../../../../../shared/i18n'

export const confirmSubmitModalMessages = defineMessages({
  vi: {
    title: 'Gửi yêu cầu giám sát?',
    subtitle:
      'Yêu cầu sẽ được chuyển cho bộ phận vận hành để xem xét và duyệt.',
    groupContent: 'Nội dung giám sát',
    checklists: 'Nội dung đã chọn',
    checklistCount: (n: number) => `${n} nội dung`,
    mediaValue: (images: number, videos: number) =>
      `${images} ảnh · ${videos} video`,
    timeWindow: 'Khung giờ',
    area: 'Vùng bay',
    areaValue: (radius: number, ha: string) =>
      `Bán kính ${radius} m · khoảng ${ha} ha`,
    resultFormats: 'Định dạng kết quả',
    deliveryMethods: 'Cách nhận',
    retention: 'Thời hạn lưu trữ',
    retentionDays: (days: number) => `${days} ngày`,
    aiAnalysis: 'Phân tích hình ảnh bằng AI',
    aiYes: 'Có (tính thêm phí)',
    priceNotePending:
      'Chi phí chưa gồm các nội dung bạn tự thêm đang chờ quản lý báo giá; quản lý sẽ gửi báo giá cuối cùng để bạn xác nhận.',
    priceNote:
      'Đây là chi phí dự kiến. Quản lý sẽ xem xét và gửi báo giá cuối cùng để bạn xác nhận trước khi thanh toán.',
    service: 'Dịch vụ',
    location: 'Địa điểm',
    dates: 'Ngày bay mong muốn',
    altitude: 'Độ cao giám sát mong muốn',
    contact: 'Liên hệ hiện trường',
    permit: 'Giấy phép bay',
    permitHave: (number: string) => `Đã có giấy phép ${number}`,
    permitSupport: 'Cần hỗ trợ xin phép',
    total: 'Chi phí dự kiến',
    totalUnknown: 'Sẽ được xác nhận khi duyệt',
    note: 'Sau khi gửi, bạn có thể theo dõi trạng thái ở mục Đơn của tôi.',
    back: 'Xem lại',
    confirm: 'Xác nhận gửi',
    submitting: 'Đang gửi yêu cầu...',
  },
  en: {
    title: 'Submit this monitoring request?',
    subtitle: 'The request goes to operations for review and approval.',
    groupContent: 'Monitoring content',
    checklists: 'Selected content',
    checklistCount: (n: number) => `${n} item${n === 1 ? '' : 's'}`,
    mediaValue: (images: number, videos: number) =>
      `${images} photos · ${videos} videos`,
    timeWindow: 'Time window',
    area: 'Flight area',
    areaValue: (radius: number, ha: string) =>
      `Radius ${radius} m · about ${ha} ha`,
    resultFormats: 'Result formats',
    deliveryMethods: 'Delivery',
    retention: 'Data retention',
    retentionDays: (days: number) => `${days} days`,
    aiAnalysis: 'AI image analysis',
    aiYes: 'Yes (extra fee)',
    priceNotePending:
      'The cost excludes items you added that are awaiting a Manager quote; the Manager will send the final quote for you to confirm.',
    priceNote:
      'This is an estimate. A Manager reviews the request and sends the final quote for you to confirm before payment.',
    service: 'Service',
    location: 'Location',
    dates: 'Preferred flight dates',
    altitude: 'Flight altitude',
    contact: 'On-site contact',
    permit: 'Flight permit',
    permitHave: (number: string) => `Permit held: ${number}`,
    permitSupport: 'Needs help getting a permit',
    total: 'Estimated cost',
    totalUnknown: 'Confirmed on approval',
    note: 'After submitting you can track its status under My orders.',
    back: 'Review again',
    confirm: 'Confirm and submit',
    submitting: 'Submitting request...',
  },
})
