import { defineMessages } from '../../../shared/i18n'

export const pricingMessages = defineMessages({
  vi: {
    workDetails: 'Hướng dẫn',
    statusAdditional: 'Tính phí bổ sung',
    statusDuplicate: 'Trùng lặp',
    statusRejected: 'Từ chối',
    errReviewInvalid:
      'Danh sách yêu cầu chưa được xem xét đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.',
    errStalePolicy:
      'Chính sách giá vừa được cập nhật. Giá trên màn hình đã được tải lại, vui lòng kiểm tra rồi duyệt lại.',
    errStaleRevision:
      'Báo giá đã được cập nhật ở nơi khác. Vui lòng tải lại dữ liệu.',
    errReasonRequired: (min: number) =>
      `Lý do điều chỉnh giá cần ít nhất ${min} ký tự.`,
    errSelfApproval: 'Người đề xuất không thể tự phê duyệt điều chỉnh giá.',
    errOverrideExceeds: 'Mức điều chỉnh vượt quá giới hạn cho phép.',
    errBelowMinimum: 'Giá sau điều chỉnh thấp hơn mức giá sàn cho phép.',
    errZeroPrice: 'Giá báo không được bằng 0.',
    errUnapprovedPricing: 'Điều chỉnh giá chưa được phê duyệt.',
    errQuoteNotCurrent: 'Báo giá này không còn là phiên bản hiện hành.',
    errConcurrent: 'Dữ liệu vừa được cập nhật. Vui lòng tải lại và thử lại.',
    errReviewIncomplete: (detail: string) =>
      `Đơn chưa đủ điều kiện duyệt${detail ? `: ${detail}` : '.'}`,
    errPricingInvalid: (detail: string) =>
      `Dữ liệu giá không hợp lệ${detail ? `: ${detail}` : '.'}`,
    errGeneric: (detail: string, code: string) =>
      `Không thể xử lý yêu cầu định giá${
        detail ? `: ${detail}` : ''
      }${code ? ` (${code})` : ''}. Vui lòng thử lại.`,
    errFallback: 'Không thể xử lý yêu cầu. Vui lòng thử lại.',

    reasonMissing: 'Vui lòng nhập lý do điều chỉnh giá.',
    reasonTooShort: (min: number, length: number) =>
      `Lý do điều chỉnh cần ít nhất ${min} ký tự (hiện có ${length}).`,
    outOfRangeReasonMissing: (n: number) =>
      `Còn ${n} mục có giá ngoài khoảng đề nghị chưa có lý do đủ rõ.`,
    pendingCustom: (n: number) =>
      `Còn ${n} yêu cầu bổ sung của khách hàng chưa được phân loại.`,
    approveSuccess:
      'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
    filterAll: 'Tất cả',
    filterPending: 'Chưa xem xét',
    filterReviewed: 'Đã xem xét',
    filterAdditional: 'Có phụ phí',

    summaryAria: 'Tóm tắt báo giá',
    summaryTitle: 'Tóm tắt báo giá',
    systemPriceSourceHint: 'Giá Base Checklist được Backend tính từ giá gốc và diện tích tiêu chuẩn do ADMIN cấu hình.',
    policyVersion: 'Chính sách giá v',
    systemPrice: 'Giá hệ thống',
    adjustment: 'Điều chỉnh',
    quoteTotal: 'Tổng báo giá',
    remainingToReview: (n: number) =>
      `Còn ${n} nội dung cần xem xét trước khi duyệt.`,
    adjustmentReasonLabel: 'Lý do điều chỉnh giá',
    adjustmentReasonHint: (min: number) => `(bắt buộc, ít nhất ${min} ký tự)`,
    adjustmentReasonOptionalHint: ' (không bắt buộc)',
    reasonCounter: (length: number, min: number) =>
      `${length}/${min} ký tự tối thiểu`,
    quoteNoteLabel: 'Ghi chú báo giá (tùy chọn)',
    quoteNotePlaceholder: 'Thêm ghi chú cho báo giá...',
    approveTitlePending:
      'Phân loại các yêu cầu bổ sung trước khi duyệt báo giá',
    approveTitleOutOfRange: 'Ghi lý do cho giá ngoài khoảng đề nghị',
    approved: 'Đã duyệt thành công',
    approve: 'Tiếp tục chuẩn bị hợp đồng',

    reviewTitle: 'Xem xét yêu cầu và báo giá',
    reviewSubtitle: 'Phân loại yêu cầu để chốt báo giá.',
    reviewedProgress: (reviewed: number, total: number) =>
      `${reviewed}/${total} nội dung đã xem xét`,
    filterGroupAria: 'Lọc nội dung',
    colContent: 'Nội dung yêu cầu',
    colPricing: 'Cách tính giá',
    colSurcharge: 'Phụ phí',
    colStatus: 'Trạng thái',
    colNote: 'Ghi chú',

    differenceLabel: 'Chênh lệch: ',
    outsideRange: 'Ngoài khoảng đề nghị: ',
    allowedRange: 'Khoảng đề nghị: ',

    loadingPricing: 'Đang tải thông tin giá...',
    loadingQuote: 'Đang tải báo giá...',

    breakdownAria: 'Chi tiết giá hệ thống',
    breakdownTitle: (count: number) => `Chi tiết giá hệ thống · ${count} dòng`,
    breakdownFallbackName: 'Nội dung',
    breakdownOrderLevel: 'Theo đơn hàng',

    sourceCustom: 'Khách yêu cầu thêm',
    customerRequested: (images: number, videos: number) =>
      `${images} ảnh · ${videos} video`,
    includedInPackage: 'Trong gói',
    classify: 'Phân loại',
    pending: 'Chưa xem xét',
    systemPriceInline: 'Giá hệ thống: ',
    approvedPriceLabel: 'Giá duyệt',
    moneyRoundingHint: 'Giá nhập hoặc chỉnh sửa sẽ làm tròn đến 1.000 VND.',
    priceRangeReasonLabel: (min: number) =>
      `Lý do không theo khoảng giá hệ thống đề nghị (ít nhất ${min} ký tự)`,
    priceRangeReasonPlaceholder:
      'Giải thích vì sao giá này cần nằm ngoài khoảng hệ thống đề nghị…',
    badgeAuto: 'Tự tính',
    badgeAwaitingPrice: 'Chờ duyệt giá',
    badgeReviewed: 'Đã xem xét',
    noteAria: (content: string) => `Ghi chú: ${content}`,
    managerNote: 'Ghi chú của quản lý',
    notePlaceholderPending: 'Phân loại nội dung trước',
    notePlaceholderReason: 'Lý do hoặc phạm vi xử lý',
  },
  en: {
    workDetails: 'Guidance',
    statusAdditional: 'Charge as extra',
    statusDuplicate: 'Duplicate',
    statusRejected: 'Rejected',
    errReviewInvalid:
      'The request list has not been fully reviewed. Classify every item before approving the quote.',
    errStalePolicy:
      'The pricing policy was just updated. The prices on screen have been reloaded; please check them and approve again.',
    errStaleRevision:
      'The quote was updated elsewhere. Please reload the data.',
    errReasonRequired: (min: number) =>
      `The price adjustment reason must be at least ${min} characters.`,
    errSelfApproval: 'The proposer cannot approve their own price adjustment.',
    errOverrideExceeds: 'The adjustment exceeds the allowed limit.',
    errBelowMinimum: 'The adjusted price is below the allowed minimum.',
    errZeroPrice: 'The quoted price cannot be 0.',
    errUnapprovedPricing: 'The price adjustment has not been approved.',
    errQuoteNotCurrent: 'This quote is no longer the current version.',
    errConcurrent: 'The data was just updated. Please reload and try again.',
    errReviewIncomplete: (detail: string) =>
      `The order is not ready for approval${detail ? `: ${detail}` : '.'}`,
    errPricingInvalid: (detail: string) =>
      `Invalid pricing data${detail ? `: ${detail}` : '.'}`,
    errGeneric: (detail: string, code: string) =>
      `Could not process the pricing request${
        detail ? `: ${detail}` : ''
      }${code ? ` (${code})` : ''}. Please try again.`,
    errFallback: 'Could not process the request. Please try again.',

    reasonMissing: 'Please enter the price adjustment reason.',
    reasonTooShort: (min: number, length: number) =>
      `The adjustment reason must be at least ${min} characters (currently ${length}).`,
    outOfRangeReasonMissing: (n: number) =>
      `${n} item(s) outside the suggested range still need a reason.`,
    pendingCustom: (n: number) =>
      `${n} additional customer request(s) have not been classified yet.`,
    approveSuccess:
      'Quote approved successfully. It is ready for the customer to accept.',
    filterAll: 'All',
    filterPending: 'Not reviewed',
    filterReviewed: 'Reviewed',
    filterAdditional: 'Surcharged',

    summaryAria: 'Quote summary',
    summaryTitle: 'Quote summary',
    systemPriceSourceHint: 'System prices use the Base Checklist price and standard area configured by ADMIN.',
    policyVersion: 'Pricing policy v',
    systemPrice: 'System price',
    adjustment: 'Adjustment',
    quoteTotal: 'Quote total',
    remainingToReview: (n: number) =>
      `${n} item(s) still need review before approval.`,
    adjustmentReasonLabel: 'Price adjustment reason',
    adjustmentReasonHint: (min: number) =>
      `(required, at least ${min} characters)`,
    adjustmentReasonOptionalHint: ' (optional)',
    reasonCounter: (length: number, min: number) =>
      `${length}/${min} minimum characters`,
    quoteNoteLabel: 'Quote note (optional)',
    quoteNotePlaceholder: 'Add a note to the quote...',
    approveTitlePending:
      'Classify the additional requests before approving the quote',
    approveTitleOutOfRange: 'Explain prices outside the suggested range',
    approved: 'Approved successfully',
    approve: 'Continue to contract',

    reviewTitle: 'Review requests and quote',
    reviewSubtitle: 'Classify requests to finalize the quote.',
    reviewedProgress: (reviewed: number, total: number) =>
      `${reviewed}/${total} items reviewed`,
    filterGroupAria: 'Filter items',
    colContent: 'Request',
    colPricing: 'Pricing method',
    colSurcharge: 'Surcharge',
    colStatus: 'Status',
    colNote: 'Note',

    differenceLabel: 'Difference: ',
    outsideRange: 'Outside suggested range: ',
    allowedRange: 'Suggested range: ',

    loadingPricing: 'Loading pricing information...',
    loadingQuote: 'Loading quote...',

    breakdownAria: 'System price breakdown',
    breakdownTitle: (count: number) => `System price details · ${count} lines`,
    breakdownFallbackName: 'Item',
    breakdownOrderLevel: 'Order level',

    sourceCustom: 'Customer extra',
    customerRequested: (images: number, videos: number) =>
      `${images} photo(s) · ${videos} video(s)`,
    includedInPackage: 'Included',
    classify: 'Classify',
    pending: 'Not reviewed',
    systemPriceInline: 'System price: ',
    approvedPriceLabel: 'Approved price',
    moneyRoundingHint: 'Entered or edited prices round to the nearest 1,000 VND.',
    priceRangeReasonLabel: (min: number) =>
      `Reason for going outside the system range (at least ${min} characters)`,
    priceRangeReasonPlaceholder:
      'Explain why this price needs to be outside the system suggested range…',
    badgeAuto: 'Auto',
    badgeAwaitingPrice: 'Awaiting price approval',
    badgeReviewed: 'Reviewed',
    noteAria: (content: string) => `Note: ${content}`,
    managerNote: 'Manager note',
    notePlaceholderPending: 'Classify the item first',
    notePlaceholderReason: 'Reason or handling scope',
  },
})
