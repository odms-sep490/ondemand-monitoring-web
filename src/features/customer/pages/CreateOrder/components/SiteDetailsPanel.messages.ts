import { defineMessages } from '../../../../../shared/i18n'

export const siteDetailsPanelMessages = defineMessages({
  vi: {
    cardTitle: 'Chi tiết khu vực & hiện trường',
    flightSection: 'Thông số bay',
    altitudeLabel: 'Độ cao giám sát mong muốn (m)',
    altitudeHint:
      'Bắt buộc, từ 10 đến 120 m. Đây là độ cao bạn mong muốn, độ cao thực tế còn tùy thẩm định và cấp phép.',
    lengthLabel: 'Chiều dài (m)',
    lengthPlaceholder: 'VD: 1200',
    lengthHint: 'Tùy chọn. Dùng cho đường băng, đường bộ, đường ống.',
    contactSection: 'Liên hệ tại hiện trường',
    contactHint: 'Để đội bay gọi khi đến nơi hoặc cần vào khu vực.',
    contactNameLabel: 'Người liên hệ',
    contactNamePlaceholder: 'Họ tên',
    contactPhoneLabel: 'Số điện thoại',
    contactPhonePlaceholder: '0901 234 567',
    accessNotesLabel: 'Điều kiện ra vào',
    accessNotesPlaceholder:
      'Cổng vào, thủ tục đăng ký, người dẫn đường, giờ làm việc...',
    filesSection: 'Tệp khu vực (tùy chọn)',
  },
  en: {
    cardTitle: 'Area & site details',
    flightSection: 'Flight settings',
    altitudeLabel: 'Desired monitoring altitude (m)',
    altitudeHint:
      'Required, between 10 and 120 m. This is your preferred altitude; the actual altitude depends on review and approval.',
    lengthLabel: 'Length (m)',
    lengthPlaceholder: 'E.g. 1200',
    lengthHint: 'Optional. For runways, roads, pipelines.',
    contactSection: 'On-site contact',
    contactHint:
      'So the flight crew can call you on arrival or when access is needed.',
    contactNameLabel: 'Contact person',
    contactNamePlaceholder: 'Full name',
    contactPhoneLabel: 'Phone number',
    contactPhonePlaceholder: '0901 234 567',
    accessNotesLabel: 'Access conditions',
    accessNotesPlaceholder: 'Gate, registration, escort, working hours...',
    filesSection: 'Area files (optional)',
  },
})
