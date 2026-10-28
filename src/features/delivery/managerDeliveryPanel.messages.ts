import { defineMessages } from '../../shared/i18n'

export const managerDeliveryPanelMessages = defineMessages({
  vi: {
    loadFailed: 'Không tải được thông tin bàn giao.',
    actionFailed: 'Thao tác thất bại.',
    eyebrow: 'Quy trình bàn giao',
    title: 'Gửi kết quả cho khách hàng',
    intro:
      'Chọn ảnh/video đã nghiệm thu để gửi cho khách hàng xem và xác nhận. Sau khi thanh toán hoàn tất, bạn có thể bàn giao tệp gốc.',
    revisionTitle: 'khách hàng yêu cầu chỉnh sửa',
    processingTitle: 'Chưa thể gửi bản xem trước',
    processingText:
      'Hãy duyệt toàn bộ kết quả nhiệm vụ trước khi gửi cho khách hàng.',
    noMediaTitle: 'Chưa có media hợp lệ',
    noMediaText:
      'Media đã được Nghiệm thu kiểm tra và hợp lệ sẽ xuất hiện tại đây.',
    mediaHeading: 'Media gửi cho khách hàng',
    selectedCount: (selected: number, total: number) =>
      `${selected}/${total} tệp đang được chọn`,
    deselectAll: 'Bỏ chọn tất cả',
    selectAll: 'Chọn tất cả',
    video: 'Video',
    image: 'Hình ảnh',
    fileNumber: (n: number) => `Tệp #${n}`,
    notesLabel: 'Ghi chú bàn giao',
    notesPlaceholder: 'Ví dụ: Đã cân chỉnh màu và chọn các góc quay rõ nhất…',
    filesCount: (n: number) => `${n} tệp`,
    willBeSentAsPreview: 'sẽ được gửi dưới dạng bản xem trước',
    selectAtLeastOne: 'Hãy chọn ít nhất một media',
    sending: 'Đang gửi…',
    sendResults: (n: number) => `Gửi kết quả cho khách hàng (${n})`,
    sentTitle: 'Đã gửi kết quả cho khách hàng',
    sentText: 'Đang chờ khách hàng xem và phản hồi kết quả.',
    acceptedTitle: 'khách hàng đã chấp nhận kết quả',
    acceptedText: 'Đang chờ khách hàng hoàn tất khoản thanh toán còn lại.',
    paymentConfirmed: 'Thanh toán đã được xác nhận',
    originalsReady: 'Bản gốc đã sẵn sàng để phát hành cho khách hàng.',
    delivering: 'Đang bàn giao…',
    deliverOriginals: 'Bàn giao bản gốc',
    deliveredTitle: 'Bàn giao hoàn tất',
    deliveredText: (n: number) =>
      `${n} tệp gốc đã sẵn sàng cho khách hàng tải xuống.`,
  },
  en: {
    loadFailed: 'Could not load delivery information.',
    actionFailed: 'Action failed.',
    eyebrow: 'Delivery workflow',
    title: 'Send results to the customer',
    intro:
      'Select the accepted photos/videos to send to the customer for review and confirmation. Once payment is complete, you can deliver the original files.',
    revisionTitle: 'The customer requested changes',
    processingTitle: 'Preview cannot be sent yet',
    processingText:
      'Approve all mission results before sending them to the customer.',
    noMediaTitle: 'No valid media yet',
    noMediaText: 'Media that has been checked and accepted will appear here.',
    mediaHeading: 'Media sent to the customer',
    selectedCount: (selected: number, total: number) =>
      `${selected}/${total} file(s) selected`,
    deselectAll: 'Deselect all',
    selectAll: 'Select all',
    video: 'Video',
    image: 'Image',
    fileNumber: (n: number) => `File #${n}`,
    notesLabel: 'Delivery notes',
    notesPlaceholder:
      'E.g. Colors were graded and the clearest angles were selected…',
    filesCount: (n: number) => `${n} file(s)`,
    willBeSentAsPreview: 'will be sent as a preview',
    selectAtLeastOne: 'Select at least one media file',
    sending: 'Sending…',
    sendResults: (n: number) => `Send results to the customer (${n})`,
    sentTitle: 'Results sent to the customer',
    sentText: 'Waiting for the customer to review and respond.',
    acceptedTitle: 'The customer accepted the results',
    acceptedText: 'Waiting for the customer to pay the remaining balance.',
    paymentConfirmed: 'Payment confirmed',
    originalsReady:
      'The original files are ready to be released to the customer.',
    delivering: 'Delivering…',
    deliverOriginals: 'Deliver originals',
    deliveredTitle: 'Delivery complete',
    deliveredText: (n: number) =>
      `${n} original file(s) are ready for the customer to download.`,
  },
})
