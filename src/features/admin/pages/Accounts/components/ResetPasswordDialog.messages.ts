import { defineMessages } from '../../../../../shared/i18n'

export const resetPasswordDialogMessages = defineMessages({
  vi: {
    title: 'Đặt lại mật khẩu',
    confirmPrefix: 'Đặt lại mật khẩu cho',
    unsupported: 'Chưa được hỗ trợ',
    unsupportedHint:
      'Hệ thống chưa hỗ trợ đặt lại mật khẩu cho quản trị viên. Chức năng sẽ được bật khi có hỗ trợ.',
    cancel: 'Đóng',
    confirm: 'Xác nhận đặt lại',
  },
  en: {
    title: 'Reset password',
    confirmPrefix: 'Reset the password for',
    unsupported: 'Not supported yet',
    unsupportedHint:
      'The system does not support admin password reset yet. This will be enabled once it is available.',
    cancel: 'Close',
    confirm: 'Confirm reset',
  },
})
