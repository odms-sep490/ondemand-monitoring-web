import { defineMessages } from '../../../../shared/i18n'

export const wizardRoleSelectionMessages = defineMessages({
  vi: {
    title: 'Chọn nhiệm vụ để phân công',
    reload: 'Làm mới nhiệm vụ',
    loading: 'Đang tải nhiệm vụ…',
    history: 'Lịch sử · chỉ xem',
    resourcesAssigned: 'Đã phân công nguồn lực',
    planNotFinalized: 'Chưa chốt kế hoạch',
    notEligible: 'Chưa đủ điều kiện phân công',
    awaitingConfirm: 'Chờ xác nhận phân công',
    rolesAssigned: (n: number) => `Đã phân công ${n}/4 vai trò`,
  },
  en: {
    title: 'Select a mission to assign',
    reload: 'Reload missions',
    loading: 'Loading missions…',
    history: 'History · view only',
    resourcesAssigned: 'Resources assigned',
    planNotFinalized: 'Plan not finalized',
    notEligible: 'Not yet eligible for assignment',
    awaitingConfirm: 'Awaiting assignment confirmation',
    rolesAssigned: (n: number) => `${n}/4 roles assigned`,
  },
})
