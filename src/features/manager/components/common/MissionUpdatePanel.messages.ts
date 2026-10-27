import { defineMessages } from '../../../../shared/i18n'

export const missionUpdatePanelMessages = defineMessages({
  vi: {
    edit: 'Chỉnh sửa',
    editTitle: (code: string) => `Chỉnh sửa nhiệm vụ ${code}`,
    heading: (code: string) => `Chỉnh sửa nhiệm vụ ${code}`,
    subtitle:
      'Kiểm tra thời tiết, chọn lịch bay và phân bổ danh mục kiểm tra cho nhiệm vụ.',
    closeAria: 'Đóng form chỉnh sửa nhiệm vụ',
    closeTitle: 'Đóng form',
    contextAria: 'Bối cảnh lập kế hoạch nhiệm vụ',
    scopeHeading: 'Phạm vi công việc của nhiệm vụ',
    scopeDescription:
      'Đang cập nhật lịch thực hiện và danh sách danh mục kiểm tra phân bổ cho nhiệm vụ này.',
    scopeFieldLabel: 'Mô tả phạm vi công việc',
    scopeFallback: 'Toàn bộ phạm vi của đơn hàng',
    planInfo: 'Thông tin kế hoạch',
    orderCode: 'Mã đơn hàng:',
    planStatus: 'Trạng thái kế hoạch:',
    planVersion: (n: number) => `Phiên bản #${n}`,
    location: 'Vị trí:',
    locationFallback: 'Theo đơn hàng',
    needChecklist:
      'Vui lòng chọn ít nhất một hạng mục danh mục kiểm tra cho nhiệm vụ.',
    actionHint:
      'Kiểm tra lại lịch bay và phân bổ danh mục kiểm tra trước khi lưu thay đổi.',
    cancel: 'Hủy',
    saving: 'Đang lưu…',
    save: 'Lưu thay đổi',
  },
  en: {
    edit: 'Edit',
    editTitle: (code: string) => `Edit mission ${code}`,
    heading: (code: string) => `Edit mission ${code}`,
    subtitle:
      'Check the weather, choose the flight schedule and assign checklist items to the mission.',
    closeAria: 'Close the edit mission form',
    closeTitle: 'Close form',
    contextAria: 'Mission planning context',
    scopeHeading: 'Mission work scope',
    scopeDescription:
      'Updating the schedule and the checklist items assigned to this mission.',
    scopeFieldLabel: 'Work scope description',
    scopeFallback: 'Entire order scope',
    planInfo: 'Plan information',
    orderCode: 'Order code:',
    planStatus: 'Plan status:',
    planVersion: (n: number) => `Revision #${n}`,
    location: 'Location:',
    locationFallback: 'Per the order',
    needChecklist: 'Select at least one checklist item for the mission.',
    actionHint:
      'Review the flight schedule and checklist assignment before saving changes.',
    cancel: 'Cancel',
    saving: 'Saving…',
    save: 'Save changes',
  },
})
