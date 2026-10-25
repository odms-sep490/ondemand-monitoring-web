import { defineMessages } from '../../../../../shared/i18n'

export const deliveryOptionsCardMessages = defineMessages({
  vi: {
    cardTitle: 'Nhận kết quả & cam kết',
    cardSubtitle: 'Chọn cách nhận kết quả và xác nhận trước khi gửi.',
    formatsLabel: 'Định dạng kết quả',
    formatsHint: 'Ảnh và video lấy từ checklist; Báo cáo PDF là tùy chọn.',
    formats: {
      PHOTO: 'Ảnh',
      VIDEO: 'Video',
      PDF_REPORT: 'Báo cáo PDF',
    },
    methodsLabel: 'Phương thức nhận',
    methods: {
      DOWNLOAD: 'Tải về',
      EMAIL: 'Email',
    },
    retentionLabel: 'Thời hạn lưu trữ dữ liệu',
    retentionHint: 'Tính từ ngày bàn giao.',
    days: (n: number) => `${n} ngày`,
    termsHeading: 'Điều khoản và cam kết bảo mật',
    termsRequired: 'Bắt buộc',
    termsLabel:
      'Tôi xác nhận mục đích giám sát và đồng ý với chính sách xử lý dữ liệu.',
    termsPrivacyNotice:
      'ODMS xử lý hình ảnh có người để bảo vệ quyền riêng tư.',
    commitmentsToggle: 'Xem chi tiết điều khoản',
    commitmentUse:
      'Dữ liệu giám sát chỉ được sử dụng để thực hiện và bàn giao dịch vụ theo yêu cầu đã thống nhất.',
    commitmentRetention:
      'Dữ liệu kết quả được lưu trữ tối đa 90 ngày kể từ khi bàn giao, sau đó được xử lý theo chính sách lưu trữ và xóa dữ liệu của ODMS.',
    commitmentResponsibility:
      'Khách hàng cam kết có quyền yêu cầu giám sát tại khu vực đã chọn và cung cấp giấy chấp thuận của chủ sở hữu hoặc đơn vị quản lý khi cần thiết.',
    commitmentPermit:
      'ODMS phụ trách thủ tục xin giấy phép bay đối với hoạt động do ODMS tổ chức, khai thác. Nhiệm vụ chỉ được thực hiện khi đáp ứng đầy đủ điều kiện bay theo quy định.',
    commitmentPrivacy:
      'Hoạt động giám sát có thể ghi nhận hình ảnh người và công trình lân cận. ODMS sẽ áp dụng biện pháp bảo vệ quyền riêng tư, bao gồm làm mờ hoặc xử lý hình ảnh không cần thiết trước khi bàn giao, khi phù hợp.',
  },
  en: {
    cardTitle: 'Result delivery & commitments',
    cardSubtitle:
      'Choose how to receive the result and confirm before submitting.',
    formatsLabel: 'Result formats',
    formatsHint:
      'Photos and video follow the checklist; the PDF report is optional.',
    formats: {
      PHOTO: 'Photos',
      VIDEO: 'Video',
      PDF_REPORT: 'PDF report',
    },
    methodsLabel: 'Delivery method',
    methods: {
      DOWNLOAD: 'Download',
      EMAIL: 'Email',
    },
    retentionLabel: 'Data retention period',
    retentionHint: 'Counted from the delivery date.',
    days: (n: number) => `${n} days`,
    termsHeading: 'Terms and security commitment',
    termsRequired: 'Required',
    termsLabel:
      'I confirm the monitoring purpose and agree to the data processing policy.',
    termsPrivacyNotice:
      'ODMS processes images containing people to protect privacy.',
    commitmentsToggle: 'View detailed terms',
    commitmentUse:
      'Monitoring data is used only to perform and deliver the service in accordance with the agreed request.',
    commitmentRetention:
      'Result data is retained for up to 90 days after delivery and is then handled in accordance with ODMS data retention and deletion policies.',
    commitmentResponsibility:
      'The customer confirms that they have the right to request monitoring in the selected area and will provide consent from the owner or managing entity when required.',
    commitmentPermit:
      'ODMS is responsible for flight permit procedures for operations organized and conducted by ODMS. A mission will only proceed when all applicable flight requirements have been met.',
    commitmentPrivacy:
      'Monitoring activities may capture images of people and nearby property. Where appropriate, ODMS will protect privacy by blurring or otherwise processing unnecessary imagery before delivery.',
  },
})
