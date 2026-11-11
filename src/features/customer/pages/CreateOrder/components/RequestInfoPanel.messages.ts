import { defineMessages } from '../../../../../shared/i18n'

export const requestInfoPanelMessages = defineMessages({
  vi: {
    cardTitle: 'Thông tin yêu cầu',
    titleLabel: 'Tiêu đề',
    titlePlaceholder: 'VD: Giám sát tiến độ khu công trình phía Đông',
    descriptionLabel: 'Ghi chú tổng quan',
    descriptionPlaceholder: 'Bối cảnh, lưu ý hoặc yêu cầu bổ sung nếu cần...',
    attachmentsTitle: 'Tệp đính kèm (không bắt buộc)',
    attachmentsCount: (count: number) => `${count} tệp`,
    flightPurposeLabel: 'Mục đích chuyến bay',
    flightPurposePlaceholder: 'Chọn mục đích chuyến bay',
    otherFlightPurposeLabel: 'Mô tả mục đích chuyến bay khác',
    otherFlightPurposePlaceholder: 'Nhập mục đích chuyến bay cụ thể',
    flightPurposes: {
      SURVEY_MONITORING: 'Đo đạc, khảo sát, giám sát từ trên cao',
      AGRICULTURE: 'Nông nghiệp',
      CONSTRUCTION_MONITORING: 'Giám sát tiến độ công trình',
      INDUSTRIAL_INSPECTION: 'Kiểm tra nhà xưởng và cơ sở sản xuất',
      AREA_MONITORING: 'Giám sát khu vực',
      FOREST_MONITORING: 'Giám sát tài nguyên rừng',
      OTHER: 'Mục đích khác',
    },
  },
  en: {
    cardTitle: 'Request information',
    titleLabel: 'Title',
    titlePlaceholder: 'E.g. Monitor progress on the east construction site',
    descriptionLabel: 'General notes',
    descriptionPlaceholder:
      'Context, caveats or extra requirements if needed...',
    attachmentsTitle: 'Attachments (optional)',
    attachmentsCount: (count: number) =>
      `${count} ${count === 1 ? 'file' : 'files'}`,
    flightPurposeLabel: 'Purpose of the flight',
    flightPurposePlaceholder: 'Select a flight purpose',
    otherFlightPurposeLabel: 'Describe the other flight purpose',
    otherFlightPurposePlaceholder: 'Enter the specific flight purpose',
    flightPurposes: {
      SURVEY_MONITORING: 'Surveying, mapping and aerial monitoring',
      AGRICULTURE: 'Agriculture',
      CONSTRUCTION_MONITORING: 'Construction progress monitoring',
      INDUSTRIAL_INSPECTION: 'Factory and industrial facility inspection',
      AREA_MONITORING: 'Area monitoring',
      FOREST_MONITORING: 'Forest resource monitoring',
      OTHER: 'Other purpose',
    },
  },
})
