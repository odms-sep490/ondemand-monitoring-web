import { defineMessages } from '../../../../../shared/i18n'

export const orderExpirationSettingsMessages = defineMessages({
  vi: {
    title: 'Thời hạn báo giá và tiền đặt cọc',
    formTitle: 'Thiết lập thời hạn',
    description:
      'Thời hạn độc lập, được áp dụng khi báo giá được duyệt hoặc khách hàng chấp nhận báo giá.',
    independentBadge: 'Hai mốc thời gian độc lập',
    quotation: 'Thời hạn khách hàng chấp nhận báo giá',
    quotationHint:
      'Báo giá sẽ hết hiệu lực nếu khách hàng chưa phản hồi trong khoảng thời gian này.',
    deposit: 'Thời hạn thanh toán tiền đặt cọc',
    depositHint:
      'Khách hàng cần hoàn tất thanh toán đặt cọc trước khi thời hạn này kết thúc.',
    requiredHours: 'Vui lòng nhập thời hạn.',
    integerHours: 'Thời hạn phải là số giờ nguyên.',
    positiveHours: 'Thời hạn phải lớn hơn 0.',
    maxHours: 'Thời hạn không được vượt quá 8.760 giờ.',
    snapshotNote:
      'Thay đổi chỉ áp dụng cho thời hạn được cấp mới; thời hạn đã lưu không thay đổi.',
    save: 'Lưu thời hạn',
    saving: 'Đang lưu…',
    noPendingChanges:
      'Chưa có thay đổi mới — lịch sử chỉ ghi khi giá trị thay đổi.',
    unsavedChanges: 'Bạn có thay đổi chưa được lưu.',
    saved: 'Đã cập nhật thời hạn hết hạn.',
    saveError: 'Không thể cập nhật thời hạn. Vui lòng thử lại.',
    auditTitle: 'Lịch sử thay đổi thời hạn',
    auditDescription: 'Theo dõi các lần cập nhật cấu hình gần đây.',
    changeCount: (count: number) => `${count} lần thay đổi`,
    noAudit: 'Chưa có thay đổi nào được ghi nhận.',
    field: 'Trường cấu hình',
    previous: 'Giá trị cũ',
    next: 'Giá trị mới',
    actor: 'Người thực hiện',
    unknownActor: 'Không rõ người thực hiện',
    legacyActor: 'Tài khoản cũ',
    changedAt: 'Thời điểm',
    hoursShort: 'giờ',
  },
  en: {
    title: 'Quotation and deposit timeouts',
    formTitle: 'Configure timeouts',
    description:
      'Independent timeouts applied when a quote is approved or accepted by the customer.',
    independentBadge: 'Two independent timers',
    quotation: 'Customer quote-acceptance timeout',
    quotationHint:
      'The quote expires if the customer has not responded within this period.',
    deposit: 'Deposit-payment timeout',
    depositHint:
      'The customer must complete the deposit payment before this period ends.',
    requiredHours: 'Enter a timeout duration.',
    integerHours: 'The timeout must be a whole number of hours.',
    positiveHours: 'The timeout must be greater than zero.',
    maxHours: 'The timeout cannot exceed 8,760 hours.',
    snapshotNote:
      'Changes apply only to newly assigned deadlines; saved deadlines are unchanged.',
    save: 'Save timeouts',
    saving: 'Saving…',
    noPendingChanges:
      'No new changes — history is recorded when values change.',
    unsavedChanges: 'You have unsaved changes.',
    saved: 'Expiration timeouts updated.',
    saveError: 'Could not update expiration timeouts. Please try again.',
    auditTitle: 'Timeout change history',
    auditDescription: 'Review recent updates to these settings.',
    changeCount: (count: number) => `${count} changes`,
    noAudit: 'No changes have been recorded.',
    field: 'Setting',
    previous: 'Previous value',
    next: 'New value',
    actor: 'Changed by',
    unknownActor: 'Unknown user',
    legacyActor: 'Legacy account',
    changedAt: 'Changed at',
    hoursShort: 'hours',
  },
})
