import { defineMessages } from '../../../../../shared/i18n'

export const cancelMissionDialogMessages = defineMessages({
  vi: {
    title: (code: string) => `Hủy nhiệm vụ ${code}?`,
    description: 'Nhiệm vụ sẽ bị hủy và không thể bắt đầu lại.',
    reasonLabel: 'Lý do hủy (bắt buộc)',
    reasonPlaceholder: 'Nhập lý do hủy nhiệm vụ.',
    reasonRequired: 'Vui lòng nhập lý do hủy.',
    keepMission: 'Quay lại',
    confirmCancel: 'Hủy nhiệm vụ',
    cancelFailed: 'Không thể hủy nhiệm vụ. Vui lòng thử lại.',
  },
  en: {
    title: (code: string) => `Cancel Mission ${code}?`,
    description: 'The Mission will be cancelled and cannot be started again.',
    reasonLabel: 'Cancellation reason (required)',
    reasonPlaceholder: 'Enter the reason for cancelling the Mission.',
    reasonRequired: 'Enter a cancellation reason.',
    keepMission: 'Go back',
    confirmCancel: 'Cancel Mission',
    cancelFailed: 'Could not cancel the Mission. Try again.',
  },
})
