import { defineMessages } from '../../../../shared/i18n'

export const accountsPageMessages = defineMessages({
  vi: {
    title: 'Người dùng',
    subtitle: 'tài khoản',
    createUser: 'Tạo tài khoản',
    description:
      'Quản lý khách hàng, đội ngũ vận hành và quyền truy cập hệ thống.',
    directoryTitle: 'Danh sách tài khoản',
    refresh: 'Làm mới',
    loading: 'Đang cập nhật danh sách…',
    loadFailed: 'Chưa thể tải danh sách tài khoản.',
    results: (total: number, filtered: boolean) =>
      filtered
        ? `${total} tài khoản phù hợp với bộ lọc`
        : `${total} tài khoản trong hệ thống`,
    range: (from: number, to: number) => `Đang hiển thị ${from}–${to}`,
    clearFilters: 'Xóa bộ lọc',
    noAccountsDescription:
      'Tạo tài khoản đầu tiên để bắt đầu quản lý người dùng.',
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
    createUser: 'Create account',
    description:
      'Manage customers, your operations team, and access to the system.',
    directoryTitle: 'Account directory',
    refresh: 'Refresh',
    loading: 'Updating accounts…',
    loadFailed: 'Unable to load accounts.',
    results: (total: number, filtered: boolean) =>
      filtered
        ? `${total} accounts match your filters`
        : `${total} accounts in the system`,
    range: (from: number, to: number) => `Showing ${from}–${to}`,
    clearFilters: 'Clear filters',
    noAccountsDescription: 'Create your first account to start managing users.',
    emptyTitle: 'No accounts found',
    emptyDescription: 'Try changing the filters or create a new account.',
    createdBanner: 'Account created',
    invitationSent: 'An invitation was sent by email.',
    passwordChangeRequired:
      'The user must change their password on first sign-in.',
  },
})
