import { defineMessages } from '../../../../../shared/i18n'

export const missionChecklistAssignmentEditorMessages = defineMessages({
  vi: {
    saved: 'Đã lưu phân công danh mục kiểm tra.',
    selectedCount: (selected: number, total: number) =>
      `${selected}/${total} mục được chọn`,
    itemCount: (n: number | string) => `${n} mục`,
    loading: 'Đang tải phân công…',
    reload: 'Tải lại',
    assigned: 'Đã phân công',
    noneAssigned: 'Chưa có danh mục kiểm tra được phân công.',
    selectAll: 'Chọn tất cả',
    deselect: 'Bỏ chọn',
    serviceTemplate: 'Mẫu dịch vụ',
    customerAdded: 'Khách hàng bổ sung',
    noRequests: 'Chưa có yêu cầu danh mục kiểm tra.',
    saving: 'Đang lưu…',
    save: 'Lưu phân công',
  },
  en: {
    saved: 'Checklist assignment saved.',
    selectedCount: (selected: number, total: number) =>
      `${selected}/${total} selected`,
    itemCount: (n: number | string) => `${n} item(s)`,
    loading: 'Loading assignments…',
    reload: 'Reload',
    assigned: 'Assigned',
    noneAssigned: 'No checklist items assigned.',
    selectAll: 'Select all',
    deselect: 'Deselect all',
    serviceTemplate: 'Service template',
    customerAdded: 'Added by customer',
    noRequests: 'No checklist requests yet.',
    saving: 'Saving…',
    save: 'Save assignment',
  },
})
