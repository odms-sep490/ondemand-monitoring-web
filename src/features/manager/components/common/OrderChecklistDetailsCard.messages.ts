import { defineMessages } from '../../../../shared/i18n'

export const orderChecklistDetailsCardMessages = defineMessages({
  vi: {
    title: 'Checklist của đơn hàng',
    empty: 'Đơn hàng chưa có checklist.',
    loadingError: 'Chưa tải được ghi chú và trạng thái checklist.',
    retry: 'Thử tải lại',
    itemNote: 'Ghi chú checklist',
    pricingReason: 'Lý do điều chỉnh giá',
    noNote: 'Chưa có ghi chú',
    imageVideo: (images: number, videos: number) => `${images} ảnh · ${videos} video`,
    status: {
      PENDING: 'Chờ xem xét',
      INCLUDED: 'Trong gói',
      ADDITIONAL: 'Tính phí bổ sung',
      DUPLICATE: 'Trùng lặp',
      REJECTED: 'Từ chối',
    },
  },
  en: {
    title: 'Order checklists',
    empty: 'This order has no checklists.',
    loadingError: 'Checklist notes and statuses could not be loaded.',
    retry: 'Retry',
    itemNote: 'Checklist note',
    pricingReason: 'Price adjustment reason',
    noNote: 'No note added',
    imageVideo: (images: number, videos: number) => `${images} photos · ${videos} videos`,
    status: {
      PENDING: 'Pending review',
      INCLUDED: 'Included',
      ADDITIONAL: 'Additional charge',
      DUPLICATE: 'Duplicate',
      REJECTED: 'Rejected',
    },
  },
})
