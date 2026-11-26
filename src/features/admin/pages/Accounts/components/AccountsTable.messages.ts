import { defineMessages } from '../../../../../shared/i18n'

export const accountsTableMessages = defineMessages({
  vi: {
    tableLabel: 'Danh sách tài khoản người dùng',
    verifiedEmail: 'Email đã xác thực',
    neverLoggedIn: 'Chưa đăng nhập',
    createdAt: (date: string) => `Tạo ngày ${date}`,
    columnUser: 'Người dùng',
    columnRole: 'Vai trò',
    columnStatus: 'Trạng thái',
    columnLastLogin: 'Đăng nhập cuối',
    columnActions: 'Thao tác',
    unverifiedEmail: 'Chưa xác thực email',
  },
  en: {
    tableLabel: 'User account directory',
    verifiedEmail: 'Email verified',
    neverLoggedIn: 'Not signed in yet',
    createdAt: (date: string) => `Created ${date}`,
    columnUser: 'User',
    columnRole: 'Role',
    columnStatus: 'Status',
    columnLastLogin: 'Last login',
    columnActions: 'Actions',
    unverifiedEmail: 'Email not verified',
  },
})
