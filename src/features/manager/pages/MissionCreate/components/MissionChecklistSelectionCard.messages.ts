import { defineMessages } from '../../../../../shared/i18n'

export const missionChecklistSelectionMessages = defineMessages({
  vi: {
    title: 'Hạng mục kiểm tra của nhiệm vụ *',
    selectedCount: (selected: number, total: number) =>
      `Đã chọn ${selected}/${total} mục`,
    allAssignedHint:
      'Tất cả mục đã được gán. Chọn lại mục nếu nhiệm vụ này cần kiểm tra lặp.',
    selectAllTitle: 'Chọn tất cả các mục',
    selectAll: 'Chọn tất cả',
    selectUncoveredTitle: 'Chỉ chọn các mục chưa gán cho nhiệm vụ nào',
    selectUncovered: 'Chọn các mục chưa gán',
    deselectTitle: 'Bỏ chọn toàn bộ',
    deselect: 'Bỏ chọn',
    empty: 'Đơn hàng này chưa có danh mục kiểm tra nào từ hệ thống.',
    uncovered: 'Chưa gán',
    assigned: (scope: string) => `Đã gán: ${scope}`,
    otherMission: 'Nhiệm vụ khác',
    sourceTemplate: 'Mặc định gói',
    sourceCustom: 'Khách yêu cầu thêm',
    evidenceType: 'Loại tư liệu:',
    evidenceTypes: {
      IMAGE: 'Ảnh',
      VIDEO: 'Video',
      IMAGE_AND_VIDEO: 'Ảnh và video',
      IMAGE_OR_VIDEO: 'Ảnh hoặc video',
    } as Record<string, string>,
    minEvidence: (n: number) => `Tối thiểu ${n} tư liệu`,
    images: (n: number) => `${n} ảnh`,
    videos: (n: number) => `${n} video`,
  },
  en: {
    title: 'Mission checklist items *',
    selectedCount: (selected: number, total: number) =>
      `${selected}/${total} selected`,
    allAssignedHint:
      'All items are already assigned. Select any item again if this mission should repeat the check.',
    selectAllTitle: 'Select all items',
    selectAll: 'Select all',
    selectUncoveredTitle: 'Select only items not assigned to any mission',
    selectUncovered: 'Select unassigned items',
    deselectTitle: 'Clear selection',
    deselect: 'Clear',
    empty: 'This order has no checklist items from the system.',
    uncovered: 'Unassigned',
    assigned: (scope: string) => `Assigned: ${scope}`,
    otherMission: 'Another mission',
    sourceTemplate: 'Package default',
    sourceCustom: 'Added by customer',
    evidenceType: 'Evidence type:',
    evidenceTypes: {
      IMAGE: 'Photo',
      VIDEO: 'Video',
      IMAGE_AND_VIDEO: 'Photo and video',
      IMAGE_OR_VIDEO: 'Photo or video',
    } as Record<string, string>,
    minEvidence: (n: number) => `At least ${n} items`,
    images: (n: number) => `${n} photos`,
    videos: (n: number) => `${n} videos`,
  },
})
