import { defineMessages } from '../../../../../shared/i18n'

export const pricingPolicyTabMessages = defineMessages({
  vi: {
    discardConfirm: 'Bỏ các thay đổi chưa lưu của bản nháp?',
    cloned: 'Đã nhân bản chính sách đang áp dụng thành bản nháp mới.',
    saved: 'Đã lưu bản nháp.',
    publishConfirm: (version: number) =>
      `Bạn có chắc muốn áp dụng chính sách giá v${version}? Chính sách đang áp dụng hiện tại sẽ được thay thế.`,
    published: 'Đã áp dụng chính sách giá.',
    updateFailed:
      'Không thể cập nhật chính sách giá. Vui lòng kiểm tra dữ liệu và thử lại.',
    loadFailed: 'Không thể tải chính sách giá. Vui lòng thử lại.',
  },
  en: {
    discardConfirm: 'Discard the unsaved changes to the draft?',
    cloned: 'The active policy was copied into a new draft.',
    saved: 'Draft saved.',
    publishConfirm: (version: number) =>
      `Are you sure you want to publish pricing policy v${version}? It will replace the currently active policy.`,
    published: 'Pricing policy published.',
    updateFailed:
      'Could not update the pricing policy. Please check the data and try again.',
    loadFailed: 'Could not load the pricing policy. Please try again.',
  },
})
