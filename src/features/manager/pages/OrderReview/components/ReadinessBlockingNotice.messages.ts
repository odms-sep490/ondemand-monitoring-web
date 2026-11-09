import { defineMessages } from '../../../../../shared/i18n'

export const readinessBlockingNoticeMessages = defineMessages({
  vi: {
    serviceArea: 'Chọn lại vị trí hoặc vùng giám sát',
    siteAccess:
      'Giấy tờ chứng minh quyền sử dụng hoặc giấy ủy quyền tại khu vực',
    requestedScope: 'Chọn lại vùng và bán kính giám sát',
    purpose: 'Mô tả rõ mục đích sử dụng ảnh và dữ liệu',
    clarify: (title: string) =>
      `Bổ sung thông tin và tài liệu làm rõ: ${title}`,
    cannotApprove: 'Lý do chưa thể duyệt',
    requestSupplement: 'Yêu cầu bổ sung',
    rejectOrder: 'Từ chối đơn',
    chooseContent: 'Chọn nội dung khách hàng cần bổ sung',
    customerWillSee:
      'Khách hàng sẽ nhìn thấy đúng các yêu cầu được chọn dưới đây.',
    cancel: 'Hủy',
    sending: 'Đang gửi…',
    sendRequest: 'Gửi yêu cầu bổ sung',
  },
  en: {
    serviceArea: 'Re-select the location or monitoring area',
    siteAccess:
      'Documents proving the right to use the site, or an authorization letter',
    requestedScope: 'Re-select the monitoring area and radius',
    purpose: 'Clearly describe the purpose of using the images and data',
    clarify: (title: string) =>
      `Provide additional information and documents to clarify: ${title}`,
    cannotApprove: 'Reasons the order cannot be approved yet',
    requestSupplement: 'Request more information',
    rejectOrder: 'Reject order',
    chooseContent: 'Select what the customer needs to supply',
    customerWillSee:
      'The customer will see exactly the requests selected below.',
    cancel: 'Cancel',
    sending: 'Sending…',
    sendRequest: 'Send request',
  },
})
