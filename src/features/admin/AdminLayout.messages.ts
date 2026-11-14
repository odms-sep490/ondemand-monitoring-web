import { defineMessages } from '../../shared/i18n'

export const adminLayoutMessages = defineMessages({
  vi: {
    nav: 'Điều hướng quản trị',
    menu: 'Menu',
    navItems: {
      accounts: 'Người dùng',
      roles: 'Vai trò',
      catalog: 'Danh mục',
      checklists: 'Checklist',
      operatingConfig: 'Cấu hình vận hành',
      orderCriteria: 'Tiêu chí duyệt đơn',
      auditLog: 'Nhật ký hệ thống',
      refunds: 'Hoàn tiền đặt cọc',
    },
    closeNav: 'Đóng điều hướng',
    openNav: 'Mở điều hướng',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm mã đơn, mission, drone...',
    toggleTheme: 'Đổi giao diện sáng / tối',
    admin: 'Admin',
  },
  en: {
    nav: 'Admin navigation',
    menu: 'Menu',
    navItems: {
      accounts: 'Users',
      roles: 'Roles',
      catalog: 'Catalog',
      checklists: 'Checklists',
      operatingConfig: 'Operating configuration',
      orderCriteria: 'Order review criteria',
      auditLog: 'Audit log',
      refunds: 'Deposit refunds',
    },
    closeNav: 'Close navigation',
    openNav: 'Open navigation',
    search: 'Search',
    searchPlaceholder: 'Search order, mission, drone id...',
    toggleTheme: 'Switch to light / dark theme',
    admin: 'Admin',
  },
})
