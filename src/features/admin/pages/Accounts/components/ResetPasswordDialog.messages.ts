import { defineMessages } from '../../../../../shared/i18n'

export const resetPasswordDialogMessages = defineMessages({
  vi: {
    title: 'Reset mật khẩu',
    confirmPrefix: 'Đặt lại mật khẩu cho',
    unsupported: 'Máy chủ chưa hỗ trợ',
    unsupportedHint:
      'Máy chủ chưa có chức năng đặt lại mật khẩu cho quản trị viên. Chức năng sẽ được bật khi được bổ sung.',
    cancel: 'Đóng',
    confirm: 'Xác nhận reset',
  },
  en: {
    title: 'Reset password',
    confirmPrefix: 'Reset the password for',
    unsupported: 'Not supported by the server yet',
    unsupportedHint:
      'The server has no admin password reset yet. This will be enabled once it is added.',
    cancel: 'Close',
    confirm: 'Confirm reset',
  },
})
