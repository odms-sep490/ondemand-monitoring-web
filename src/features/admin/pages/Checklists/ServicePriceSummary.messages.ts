import { defineMessages } from '../../../../shared/i18n'

export const servicePriceSummaryMessages = defineMessages({
  vi: {
    price: 'Giá mặc định của dịch vụ',
    heroLabel: 'Tổng giá dịch vụ',
    policy: 'Chính sách giá',
    draft: 'bản nháp',
    checklistCount: (n: number) => `${n} checklist`,
    columns: {
      checklist: 'Checklist',
      work: 'Công việc',
      media: 'Media',
      subtotal: 'Tạm tính',
    },
    images: 'ảnh',
    videos: 'video',
    extra: 'thêm',
    custom: 'Ngoài danh mục',
    awaitingQuote: 'Chờ quản lý báo giá',
    details: 'Chi tiết cách tính',
    qty: 'SL',
    unit: 'Đơn giá',
    amount: 'Thành tiền',
    block: 'khối',
    withinAllowance:
      'Số lượng yêu cầu nằm trong định mức đã bao gồm nên không tính thêm.',
    checklistsTotal: 'Tổng các checklist',
    addOns: 'Dịch vụ bổ sung',
    total: 'Giá mặc định',
    excludes:
      'Chưa gồm các yếu tố theo từng đơn như quãng đường và diện tích. Quản lý báo giá khi duyệt đơn.',
    warnings: 'Chưa tính được giá cho một số checklist',
    quotePending:
      'Các yêu cầu đang chờ quản lý báo giá chưa được tính vào tổng này.',
    unpriced:
      'Dịch vụ này chưa có checklist mặc định nào có giá. Hãy cấu hình giá checklist để dịch vụ có giá.',
    none: 'Chưa có checklist trong cấu hình này.',
  },
  en: {
    price: 'Default service price',
    heroLabel: 'Service total',
    policy: 'Pricing policy',
    draft: 'draft',
    checklistCount: (n: number) => `${n} checklist${n === 1 ? '' : 's'}`,
    columns: {
      checklist: 'Checklist',
      work: 'Work',
      media: 'Media',
      subtotal: 'Subtotal',
    },
    images: 'images',
    videos: 'videos',
    extra: 'extra',
    custom: 'Custom',
    awaitingQuote: 'Awaiting manager quote',
    details: 'How it is calculated',
    qty: 'Qty',
    unit: 'Unit price',
    amount: 'Amount',
    block: 'block',
    withinAllowance:
      'The requested quantity is within the included allowance, so nothing extra is charged.',
    checklistsTotal: 'Checklists total',
    addOns: 'Add-ons',
    total: 'Default price',
    excludes:
      'Excludes order-specific factors such as distance and area. A manager quotes these when approving an order.',
    warnings: 'Some checklists cannot be priced yet',
    quotePending:
      'Requirements awaiting a manager quote are excluded from this total.',
    unpriced:
      'This service has no priced default checklist yet. Price its checklists to give the service a price.',
    none: 'No checklist in this configuration.',
  },
})
