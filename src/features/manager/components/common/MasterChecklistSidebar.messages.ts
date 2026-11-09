import { defineMessages } from '../../../../shared/i18n'

export const masterChecklistSidebarMessages = defineMessages({
  vi: {
    fallbackMission: 'Nhiệm vụ',
    title: 'Danh sách nhiệm vụ',
    collapse: 'Thu gọn',
    searchPlaceholder: 'Tìm nhiệm vụ...',
    assigned: (n: number, total: number) => `Đã phân công (${n}/${total})`,
    assignedEmpty: 'Chưa có nhiệm vụ nào được phân công.',
    unassigned: (n: number) => `Chưa phân công (${n})`,
    unassignedEmpty: 'Tất cả nhiệm vụ đã được phân công đầy đủ',
    customer: 'Khách yêu cầu',
    standard: 'Tiêu chuẩn',
    order: (n: number) => `Thứ tự #${n}`,
  },
  en: {
    fallbackMission: 'Mission',
    title: 'Mission list',
    collapse: 'Collapse',
    searchPlaceholder: 'Search missions...',
    assigned: (n: number, total: number) => `Assigned (${n}/${total})`,
    assignedEmpty: 'No items are assigned yet.',
    unassigned: (n: number) => `Unassigned (${n})`,
    unassignedEmpty: 'Everything is assigned',
    customer: 'Customer request',
    standard: 'Standard',
    order: (n: number) => `Order #${n}`,
  },
})
