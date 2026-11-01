import { defineMessages } from '../../../../shared/i18n'

export const adminDashboardPageMessages = defineMessages({
  vi: {
    title: 'Tổng quan hệ thống',
    refresh: 'Làm mới',
    updatedAt: 'Cập nhật lúc',
    hero: {
      morning: 'Chào buổi sáng',
      afternoon: 'Chào buổi chiều',
      evening: 'Chào buổi tối',
      alerts: (n: number) =>
        n > 0
          ? `Có ${n} mục cần bạn chú ý trong hệ thống.`
          : 'Hệ thống ổn định, không có mục nào cần chú ý.',
    },
    loadError: 'Không tải được dữ liệu này',
    retry: 'Thử lại',
    kpi: {
      accounts: 'Tài khoản',
      accountsHint: (n: number) => `+${n} trong 30 ngày`,
      locked: 'Tài khoản bị khóa',
      lockedHint: (n: number) => `${n} chưa xác thực`,
      devicesReady: 'Thiết bị sẵn sàng',
      devicesTotal: (n: number) => `/ ${n}`,
      devicesHint: (n: number) => `${n} đang hoạt động`,
      devicesAttention: 'Bảo trì / ngoại tuyến',
      devicesAttentionHint: (m: number, o: number) =>
        `${m} bảo trì · ${o} ngừng/ngoại tuyến`,
      services: 'Dịch vụ đang hoạt động',
      servicesHint: (n: number) => `${n} tạm tắt`,
      checklists: 'Checklist đang dùng',
      checklistsHint: (n: number) => `${n} tạm tắt`,
      unavailable: 'Không có dữ liệu',
    },
    charts: {
      roles: 'Tài khoản theo vai trò',
      rolesAria: (n: number) => `Tổng ${n} tài khoản`,
      rolesEmpty: 'Chưa có tài khoản',
      weekly: 'Tài khoản mới theo tuần',
      weeklyName: 'Tài khoản mới',
      weeklyNote: (n: number) => `Tính trên ${n} tài khoản mới nhất`,
      weeklyAria: 'Biểu đồ cột tài khoản mới theo tuần',
      devices: 'Thiết bị theo nhóm trạng thái',
      devicesEmpty: 'Chưa có thiết bị',
      devicesAria: 'Biểu đồ số thiết bị theo nhóm trạng thái',
      groups: {
        ready: 'Sẵn sàng',
        active: 'Đang hoạt động',
        charging: 'Đang sạc',
        maintenance: 'Bảo trì',
        offline: 'Ngừng hoạt động / ngoại tuyến',
      },
    },
    recent: {
      title: 'Tài khoản mới nhất',
      viewAll: 'Xem tất cả',
      empty: 'Chưa có tài khoản nào.',
      locked: 'Đã khóa',
    },
    attention: {
      title: 'Cần chú ý',
      empty: 'Không có mục nào cần xử lý.',
      open: 'Xử lý',
      items: {
        lockedAccounts: (n: number) => `${n} tài khoản đang bị khóa`,
        unverifiedAccounts: (n: number) => `${n} tài khoản chưa xác thực email`,
        devicesAttention: (n: number) =>
          `${n} thiết bị bảo trì hoặc ngoại tuyến`,
        servicesWithoutChecklist: (n: number) =>
          `${n} dịch vụ đang hoạt động chưa có checklist`,
        draftPolicies: (n: number) => `${n} chính sách giá đang là bản nháp`,
        noActivePolicy: () => 'Chưa có chính sách giá nào đang áp dụng',
      },
    },
    config: {
      title: 'Cấu hình hệ thống',
      policy: 'Chính sách giá hiện hành',
      version: (v: number) => `phiên bản ${v}`,
      none: 'Chưa có',
      drafts: 'Bản nháp',
      quote: 'Hạn chấp nhận báo giá',
      deposit: 'Hạn thanh toán cọc',
      hours: (n: number) => `${n} giờ`,
      catalog: 'Khung giờ ưu tiên',
      models: 'Mẫu thiết bị',
      manage: 'Mở cấu hình vận hành',
    },
    quick: {
      title: 'Thao tác nhanh',
      createAccount: 'Tạo tài khoản',
      addDevice: 'Thêm thiết bị',
      addService: 'Thêm dịch vụ',
      checklists: 'Checklist',
    },
  },
  en: {
    title: 'System overview',
    refresh: 'Refresh',
    updatedAt: 'Updated at',
    hero: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      alerts: (n: number) =>
        n > 0
          ? `${n} item${n === 1 ? '' : 's'} in the system need your attention.`
          : 'The system is healthy: nothing needs attention.',
    },
    loadError: 'Could not load this data',
    retry: 'Retry',
    kpi: {
      accounts: 'Accounts',
      accountsHint: (n: number) => `+${n} in 30 days`,
      locked: 'Locked accounts',
      lockedHint: (n: number) => `${n} unverified`,
      devicesReady: 'Devices ready',
      devicesTotal: (n: number) => `/ ${n}`,
      devicesHint: (n: number) => `${n} in operation`,
      devicesAttention: 'Maintenance / offline',
      devicesAttentionHint: (m: number, o: number) =>
        `${m} maintenance · ${o} out of service/offline`,
      services: 'Active services',
      servicesHint: (n: number) => `${n} inactive`,
      checklists: 'Active checklists',
      checklistsHint: (n: number) => `${n} inactive`,
      unavailable: 'No data',
    },
    charts: {
      roles: 'Accounts by role',
      rolesAria: (n: number) => `${n} accounts in total`,
      rolesEmpty: 'No accounts yet',
      weekly: 'New accounts per week',
      weeklyName: 'New accounts',
      weeklyNote: (n: number) => `Based on the ${n} newest accounts`,
      weeklyAria: 'Column chart of new accounts per week',
      devices: 'Devices by status group',
      devicesEmpty: 'No devices yet',
      devicesAria: 'Bar chart of devices by status group',
      groups: {
        ready: 'Ready',
        active: 'In operation',
        charging: 'Charging',
        maintenance: 'Maintenance',
        offline: 'Out of service / offline',
      },
    },
    recent: {
      title: 'Newest accounts',
      viewAll: 'View all',
      empty: 'No accounts yet.',
      locked: 'Locked',
    },
    attention: {
      title: 'Needs attention',
      empty: 'Nothing to take care of.',
      open: 'Open',
      items: {
        lockedAccounts: (n: number) =>
          `${n} locked account${n === 1 ? '' : 's'}`,
        unverifiedAccounts: (n: number) =>
          `${n} account${n === 1 ? '' : 's'} with unverified email`,
        devicesAttention: (n: number) =>
          `${n} device${n === 1 ? '' : 's'} in maintenance or offline`,
        servicesWithoutChecklist: (n: number) =>
          `${n} active service${n === 1 ? '' : 's'} without a checklist`,
        draftPolicies: (n: number) =>
          `${n} pricing polic${n === 1 ? 'y' : 'ies'} still in draft`,
        noActivePolicy: () => 'No pricing policy is currently in effect',
      },
    },
    config: {
      title: 'System configuration',
      policy: 'Current pricing policy',
      version: (v: number) => `version ${v}`,
      none: 'None',
      drafts: 'Drafts',
      quote: 'Quote acceptance window',
      deposit: 'Deposit payment window',
      hours: (n: number) => `${n} h`,
      catalog: 'Preferred time slots',
      models: 'Device models',
      manage: 'Open operating configuration',
    },
    quick: {
      title: 'Quick actions',
      createAccount: 'Create account',
      addDevice: 'Add device',
      addService: 'Add service',
      checklists: 'Checklists',
    },
  },
})
