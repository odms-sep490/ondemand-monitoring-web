import { defineMessages } from '../../../../shared/i18n'

export const orderPlanningMessages = defineMessages({
  vi: {
    finalizeTitle: 'Chốt kế hoạch?',
    finalizeBody:
      'Sau khi chốt, cấu trúc nhiệm vụ và phân công danh mục kiểm tra của phiên bản hiện tại sẽ được cố định.',
    finalizeAction: 'Chốt kế hoạch',
    amendTitle: 'Điều chỉnh kế hoạch?',
    cancelTitle: 'Hủy nhiệm vụ?',
    amendBody:
      'Mở phiên bản kế hoạch mới để thay đổi cấu trúc nhiệm vụ. Lịch sử vẫn được giữ nguyên.',
    cancelBody: 'Nhiệm vụ sẽ được hủy và giữ lại trong lịch sử.',
    amendAction: 'Điều chỉnh kế hoạch',
    cancelAction: 'Hủy nhiệm vụ',
    finalized: 'Kế hoạch đã được chốt thành công.',
    updated: 'Đã cập nhật kế hoạch.',
    noInvoice:
      'Khách hàng chưa chấp nhận báo giá nên chưa có khoản đặt cọc để kiểm tra.',
    paymentReconciled:
      'Đã đối soát với VNPAY. Trạng thái đặt cọc đã được cập nhật.',
    checklistDirty:
      'Bạn vừa thay đổi danh mục kiểm tra. Hãy bấm “Lưu phân công” trước khi tiếp tục.',
    coverageIncomplete:
      'Còn danh mục kiểm tra chưa được gán cho nhiệm vụ. Hãy chọn các mục còn thiếu và bấm “Lưu phân công”, sau đó tiếp tục gán nguồn lực.',
    approveBlocked: (reasons: string) => `Chưa đủ điều kiện duyệt: ${reasons}`,
  },
  en: {
    finalizeTitle: 'Finalize the plan?',
    finalizeBody:
      'Once finalized, the Mission structure and checklist assignments of the current version are locked.',
    finalizeAction: 'Finalize plan',
    amendTitle: 'Amend the plan?',
    cancelTitle: 'Cancel Mission?',
    amendBody:
      'Opens a new plan version so the Mission structure can change. History is kept.',
    cancelBody: 'The Mission will be cancelled and kept in history.',
    amendAction: 'Amend plan',
    cancelAction: 'Cancel Mission',
    finalized: 'The plan was finalized successfully.',
    updated: 'The plan was updated.',
    noInvoice:
      'The customer has not accepted the quote yet, so there is no deposit to check.',
    paymentReconciled:
      'Reconciled with VNPAY. The deposit status has been updated.',
    checklistDirty:
      'You changed the checklist. Click “Save assignment” before continuing.',
    coverageIncomplete:
      'Some checklist items are not assigned to a Mission. Select the missing items and click “Save assignment”, then continue assigning resources.',
    approveBlocked: (reasons: string) =>
      `Not eligible for approval: ${reasons}`,
  },
})
