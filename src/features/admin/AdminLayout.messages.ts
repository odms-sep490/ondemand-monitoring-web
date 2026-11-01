import { defineMessages } from '../../shared/i18n'

export const adminLayoutMessages = defineMessages({
  vi: {
    nav: 'Điều hướng quản trị',
    menu: 'Menu',
    navItems: {
      dashboard: 'Tổng quan',
      accounts: 'Tài khoản',
      catalog: 'Danh mục',
      checklists: 'Checklist',
      devices: 'Thiết bị',
      operatingConfig: 'Cấu hình vận hành',
    },
    closeNav: 'Đóng điều hướng',
    openNav: 'Mở điều hướng',
    toggleTheme: 'Đổi giao diện sáng / tối',
    admin: 'Quản trị viên',
    adminRole: 'Quản trị viên',
  },
  en: {
    nav: 'Admin navigation',
    menu: 'Menu',
    navItems: {
      dashboard: 'Overview',
      accounts: 'Accounts',
      catalog: 'Catalog',
      checklists: 'Checklists',
      devices: 'Devices',
      operatingConfig: 'Operating configuration',
    },
    closeNav: 'Close navigation',
    openNav: 'Open navigation',
    toggleTheme: 'Switch to light / dark theme',
    admin: 'Admin',
    adminRole: 'Administrator',
  },
})
