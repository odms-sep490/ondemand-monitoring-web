import { defineMessages } from '../../../../shared/i18n'

export const accountsPageMessages = defineMessages({
  vi: {
    title: 'Người dùng',
    subtitle: 'tài khoản',
    createUser: '+ Tạo tài khoản',
    emptyTitle: 'Không tìm thấy tài khoản',
    emptyDescription: 'Thử thay đổi bộ lọc hoặc tạo tài khoản mới.',
    createdBanner: 'Đã tạo tài khoản',
    invitationSent: 'Lời mời đã được gửi qua email.',
    passwordChangeRequired:
      'Người dùng phải đổi mật khẩu khi đăng nhập lần đầu.',
  },
  en: {
    title: 'Users',
    subtitle: 'accounts',
    createUser: '+ Create account',
    emptyTitle: 'No accounts found',
    emptyDescription: 'Try changing the filters or create a new account.',
    createdBanner: 'Account created',
    invitationSent: 'An invitation was sent by email.',
    passwordChangeRequired:
      'The user must change their password on first sign-in.',
  },
})
