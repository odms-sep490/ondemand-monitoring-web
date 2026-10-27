import { defineMessages } from '../../../../../shared/i18n'

export const reviewStageReadinessMessages = defineMessages({
  vi: {
    failedBlocked: (n: number) =>
      `Có ${n} tiêu chí bắt buộc không đạt — không thể tiếp tục sang danh mục kiểm tra và báo giá`,
    draftBlocked:
      'Có tiêu chí bắt buộc đang chọn Không đạt — hãy nhập lý do và lưu quyết định',
    pendingBlocked: (n: number) =>
      `Còn ${n} mục bắt buộc chưa xác nhận — chưa thể duyệt báo giá`,
    notMet:
      'Điều kiện duyệt chưa đạt — không thể tiếp tục sang danh mục kiểm tra và báo giá',
    approvalCriteria: 'Điều kiện duyệt',
    nextLabel: 'Tiếp: Danh mục kiểm tra & báo giá',
  },
  en: {
    failedBlocked: (n: number) =>
      `${n} required criteria failed — cannot continue to the checklist and quote`,
    draftBlocked:
      'A required criterion is set to Fail — enter a reason and save the decision',
    pendingBlocked: (n: number) =>
      `${n} required item(s) not yet confirmed — the quote cannot be approved`,
    notMet:
      'Approval criteria not met — cannot continue to the checklist and quote',
    approvalCriteria: 'Approval criteria',
    nextLabel: 'Next: Checklist & quote',
  },
})
