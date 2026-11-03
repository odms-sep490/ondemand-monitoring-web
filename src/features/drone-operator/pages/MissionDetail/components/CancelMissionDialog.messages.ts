import { defineMessages } from '../../../../../shared/i18n'

export const cancelMissionDialogMessages = defineMessages({
  vi: {
    title: (code: string) => `Hủy Mission ${code}?`,
    description: 'Mission sẽ bị hủy và không thể Start lại.',
    reasonLabel: 'Lý do hủy (bắt buộc)',
    reasonPlaceholder: 'Nhập lý do hủy mission.',
    reasonRequired: 'Vui lòng nhập lý do hủy.',
    keepMission: 'Quay lại',
    confirmCancel: 'Hủy Mission',
    cancelFailed: 'Không thể hủy Mission. Vui lòng thử lại.',
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
