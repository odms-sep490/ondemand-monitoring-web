import { defineMessages } from '../../../shared/i18n'

export const productTabs = ['request', 'progress', 'report'] as const

export const productMessages = defineMessages({
  vi: {
    label: 'Các phần trong hệ thống',
    panelLabel: 'TRẢI NGHIỆM KHÁCH HÀNG',
    visual: {
      area: 'Khu vực kiểm tra',
      illustrative: 'Ảnh & dữ liệu minh họa',
      site: 'Khu vực công trình · 04',
      imageLabel: 'Hình ảnh hiện trường',
      objective: 'Kiểm tra hiện trạng công trình',
      review: 'Thông tin đã sẵn sàng để rà soát',
      requestReady: 'Tóm tắt yêu cầu',
      fieldUpdate: 'Đội kiểm tra cập nhật hiện trường',
      scopeConfirmed: 'Đã xác nhận phạm vi',
      inspection: 'Đang ghi nhận hình ảnh',
      reportPending: 'Tổng hợp báo cáo',
      reportTitle: 'Báo cáo kiểm tra',
      finding: 'Vị trí cần theo dõi',
      findingCopy: 'Hình ảnh và ghi chú được liên kết với khu vực kiểm tra.',
      images: 'Hình ảnh',
      notes: 'Ghi chú phát hiện',
      viewReport: 'Xem kết quả trong dashboard',
    },
    tabs: {
      request: {
        label: 'Yêu cầu',
        description: 'Xác định khu vực và mục tiêu',
        title: 'Nêu rõ điều bạn cần kiểm tra',
        body: 'Gửi thông tin khu vực, mục tiêu và thời gian mong muốn để đội ngũ có thể rà soát yêu cầu.',
      },
      progress: {
        label: 'Tiến độ',
        description: 'Theo dõi cập nhật theo yêu cầu',
        title: 'Nắm tiến trình xử lý',
        body: 'Xem trạng thái, các mốc cập nhật và trao đổi liên quan ngay trong trang theo dõi yêu cầu.',
      },
      report: {
        label: 'Báo cáo',
        description: 'Xem kết quả và hình ảnh',
        title: 'Tra cứu kết quả tập trung',
        body: 'Mở báo cáo kiểm tra, hình ảnh và ghi chú phát hiện từ dashboard khách hàng.',
      },
    },
  },
  en: {
    label: 'Product areas',
    panelLabel: 'CUSTOMER EXPERIENCE',
    visual: {
      area: 'Inspection area',
      illustrative: 'Illustrative image & data',
      site: 'Site area · 04',
      imageLabel: 'Site imagery',
      objective: 'Review the site condition',
      review: 'Details are ready for review',
      requestReady: 'Request summary',
      fieldUpdate: 'The team shares a field update',
      scopeConfirmed: 'Scope confirmed',
      inspection: 'Documenting site imagery',
      reportPending: 'Preparing the report',
      reportTitle: 'Inspection report',
      finding: 'Area to follow up',
      findingCopy: 'Images and notes are linked to the inspection area.',
      images: 'Images',
      notes: 'Finding notes',
      viewReport: 'Review results in your dashboard',
    },
    tabs: {
      request: {
        label: 'Request',
        description: 'Set an area and objective',
        title: 'Describe what needs inspection',
        body: 'Share the area, objective, and preferred timing so the team can review your request.',
      },
      progress: {
        label: 'Progress',
        description: 'Follow updates for a request',
        title: 'Keep track of the work',
        body: 'See status, progress updates, and related conversations in the request view.',
      },
      report: {
        label: 'Report',
        description: 'Review results and images',
        title: 'Find results in one place',
        body: 'Open inspection reports, images, and finding notes from your customer dashboard.',
      },
    },
  },
})
