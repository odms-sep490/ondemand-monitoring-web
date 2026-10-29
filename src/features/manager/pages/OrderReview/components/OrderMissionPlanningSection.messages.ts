import { defineMessages } from '../../../../../shared/i18n'

export const orderMissionPlanningSectionMessages = defineMessages({
  vi: {
    sectionAria: 'Kế hoạch nhiệm vụ của đơn hàng',
    reloadPlan: 'Tải lại kế hoạch',
    loadingPlan: 'Đang tải kế hoạch…',
    allAssigned: 'Tất cả nhiệm vụ đã được phân công đầy đủ.',
    backToOrders: 'Về danh sách đơn',
    unsavedPerMission:
      'Thay đổi chưa lưu được giữ riêng theo nhiệm vụ. Lưu phân công trước khi chốt hoặc điều chỉnh kế hoạch.',
    missionFallback: 'Nhiệm vụ',
    finalizeTitle: 'Chốt kế hoạch?',
    finalizeBody:
      'Sau khi chốt, các nhiệm vụ sẽ chuyển sang trạng thái sẵn sàng. Mọi thay đổi tài nguyên sau đó sẽ yêu cầu nhập lý do.',
    finalizeAction: 'Chốt kế hoạch',
    finalizeBlockedHint:
      'Cần phân công toàn bộ công việc mới có thể chốt kế hoạch',
    noDeposit:
      'Khách hàng chưa chấp nhận báo giá nên chưa có khoản đặt cọc để kiểm tra.',
    paymentChecked:
      'Đã đối soát với VNPAY. Trạng thái đặt cọc đã được cập nhật.',
    closeFormTitle: 'Đóng form tạo nhiệm vụ?',
    closeFormBody: 'Dữ liệu chưa gửi sẽ không được lưu.',
    closeFormAction: 'Đóng form',
    closeFormLabel: 'Đóng form',
    createDialogAria: 'Tạo nhiệm vụ trong đơn hàng',
    createHeading: 'Tạo nhiệm vụ mới',
    createSubtitle:
      'Đặt tên dễ nhận biết, sau đó kiểm tra thời tiết và chọn lịch bay.',
    closeCreateAria: 'Đóng form tạo nhiệm vụ',
    replaceCloseTitle: 'Đóng form tạo nhiệm vụ thay thế?',
    replaceDialogAria: (code: string) => `Tạo nhiệm vụ thay thế cho ${code}`,
    replaceHeading: (code: string) => `Tạo nhiệm vụ thay thế cho ${code}`,
    replaceSubtitle:
      'Thiết lập lại lịch bay, phạm vi và danh sách công việc thay thế cho nhiệm vụ đã hủy.',
    closeReplaceAria: 'Đóng form tạo nhiệm vụ thay thế',
    noMissions: 'Chưa có nhiệm vụ nào',
    permitEmptyHint:
      'Cần lập kế hoạch và khởi tạo nhiệm vụ trước khi quản lý giấy phép bay.',
    planEmptyHint:
      'Bấm nút “Thêm mới nhiệm vụ” ở trên để khởi tạo nhiệm vụ đầu tiên cho đơn hàng.',
    openChecklist: (uncovered: number) =>
      `Mở danh sách công việc (${uncovered} chưa gán)`,
    openChecklistTitle: 'Mở danh sách công việc',
    addMission: 'Thêm mới nhiệm vụ',
    uncoveredNote: (n: number) => `Còn ${n} công việc chưa được phân công`,
  },
  en: {
    sectionAria: 'Order mission planning',
    reloadPlan: 'Reload plan',
    loadingPlan: 'Loading plan…',
    allAssigned: 'All missions are fully assigned.',
    backToOrders: 'Back to order list',
    unsavedPerMission:
      'Unsaved changes are kept per mission. Save the assignment before finalizing or adjusting the plan.',
    missionFallback: 'Mission',
    finalizeTitle: 'Finalize the plan?',
    finalizeBody:
      'Once finalized, the missions move to the ready state. Any later resource change will require a reason.',
    finalizeAction: 'Finalize plan',
    finalizeBlockedHint:
      'Every task must be assigned before the plan can be finalized',
    noDeposit:
      'The customer has not accepted the quote yet, so there is no deposit to check.',
    paymentChecked:
      'Reconciled with VNPAY. The deposit status has been updated.',
    closeFormTitle: 'Close the mission form?',
    closeFormBody: 'Unsent data will not be saved.',
    closeFormAction: 'Close form',
    closeFormLabel: 'Close form',
    createDialogAria: 'Create a mission for this order',
    createHeading: 'Create new mission',
    createSubtitle:
      'Give it a recognizable name, then check the weather and pick a flight schedule.',
    closeCreateAria: 'Close mission creation form',
    replaceCloseTitle: 'Close the replacement mission form?',
    replaceDialogAria: (code: string) =>
      `Create replacement mission for ${code}`,
    replaceHeading: (code: string) => `Create replacement mission for ${code}`,
    replaceSubtitle:
      'Set up the flight schedule, scope and task list again to replace the cancelled mission.',
    closeReplaceAria: 'Close replacement mission form',
    noMissions: 'No missions yet',
    permitEmptyHint: 'Plan and create missions before managing flight permits.',
    planEmptyHint:
      'Use the “Add mission” button above to create the first mission for this order.',
    openChecklist: (uncovered: number) =>
      `Open task list (${uncovered} unassigned)`,
    openChecklistTitle: 'Open task list',
    addMission: 'Add mission',
    uncoveredNote: (n: number) => `${n} task(s) are not assigned yet`,
  },
})
