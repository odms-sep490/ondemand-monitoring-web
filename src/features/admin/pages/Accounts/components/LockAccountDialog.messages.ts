import { defineMessages } from '../../../../../shared/i18n'

export const lockAccountDialogMessages = defineMessages({
  vi: {
    unlockTitle: 'Mở khóa tài khoản',
    lockTitle: 'Khóa tài khoản',
    unlockConfirmPrefix: 'Mở khóa tài khoản',
    unlockConfirmSuffix: '? Người dùng sẽ có thể đăng nhập lại.',
    lockConfirmPrefix: 'Khóa tài khoản',
    lockConfirmSuffix: '? Người dùng sẽ không thể đăng nhập.',
    lockWarning:
      'Cảnh báo: nếu người dùng còn nhiệm vụ đang thực hiện, hãy kết thúc trước khi khóa.',
    cancel: 'Hủy',
    processing: 'Đang xử lý...',
    unlockAction: 'Mở khóa',
    lockAction: 'Khóa tài khoản',
    genericError: 'Lỗi khi thay đổi trạng thái.',
  },
  en: {
    unlockTitle: 'Unlock account',
    lockTitle: 'Lock account',
    unlockConfirmPrefix: 'Unlock account',
    unlockConfirmSuffix: '? The user will be able to sign in again.',
    lockConfirmPrefix: 'Lock account',
    lockConfirmSuffix: '? The user will no longer be able to sign in.',
    lockWarning:
      'Warning: if the user still has a mission in progress, finish it before locking.',
    cancel: 'Cancel',
    processing: 'Processing...',
    unlockAction: 'Unlock',
    lockAction: 'Lock account',
    genericError: 'Failed to change status.',
  },
})
