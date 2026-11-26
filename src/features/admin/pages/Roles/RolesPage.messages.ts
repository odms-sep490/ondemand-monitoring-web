import { defineMessages } from '../../../../shared/i18n'

export const rolesPageMessages = defineMessages({
  vi: {
    title: 'Vai trò',
    subtitle:
      'Nắm rõ trách nhiệm và phạm vi sử dụng hệ thống của từng nhóm người dùng.',
    overview: 'Tổng quan vai trò',
    manageUsers: 'Quản lý người dùng',
    systemRoles: (count: number) => `${count} vai trò hệ thống`,
    scope: 'Phạm vi phụ trách',
    assignedAccounts: 'Tài khoản được gán',
    loading: 'Đang tải số tài khoản',
    retryRole: (role: string) => `Tải lại số tài khoản ${role}`,
    responsibilities: {
      ADMIN: [
        'Quản lý tài khoản người dùng',
        'Quản lý dịch vụ và checklist',
        'Thiết lập cấu hình vận hành',
      ],
      MANAGER: [
        'Tiếp nhận và xử lý đơn hàng',
        'Lập kế hoạch, phân công nhiệm vụ',
        'Theo dõi nguồn lực và kết quả',
      ],
      STAFF: [
        'Thực hiện nhiệm vụ được phân công',
        'Thu thập và kiểm tra ảnh/video',
        'Bảo trì, hỗ trợ theo chuyên môn',
      ],
      CUSTOMER: [
        'Đặt dịch vụ và theo dõi đơn hàng',
        'Xem, đánh giá kết quả nhiệm vụ',
        'Thanh toán và nhận dữ liệu bàn giao',
      ],
    },
    users: 'người dùng',
    loadError: 'Không tải được số liệu',
    retry: 'Thử lại',
    descriptions: {
      ADMIN: 'Toàn quyền quản trị hệ thống, tài khoản và cấu hình.',
      STAFF:
        'Thực hiện nhiệm vụ theo phân công: bay, dữ liệu, kiểm tra, bảo trì hoặc hỗ trợ.',
      MANAGER: 'Điều phối đơn hàng, nhiệm vụ và tài nguyên.',
      CUSTOMER: 'Đặt dịch vụ và theo dõi kết quả giám sát.',
    } as Record<string, string>,
  },
  en: {
    title: 'Roles',
    subtitle:
      'Understand how each user group works within the monitoring system.',
    overview: 'Role overview',
    manageUsers: 'Manage users',
    systemRoles: (count: number) => `${count} system roles`,
    scope: 'Responsibilities',
    assignedAccounts: 'Assigned accounts',
    loading: 'Loading account count',
    retryRole: (role: string) => `Reload account count for ${role}`,
    responsibilities: {
      ADMIN: [
        'Manage user accounts',
        'Manage services and checklists',
        'Configure system operations',
      ],
      MANAGER: [
        'Review and process orders',
        'Plan and assign missions',
        'Monitor resources and results',
      ],
      STAFF: [
        'Carry out assigned missions',
        'Collect and inspect photos/videos',
        'Provide maintenance and specialist support',
      ],
      CUSTOMER: [
        'Order services and track orders',
        'View and review mission results',
        'Make payments and receive deliverables',
      ],
    },
    users: 'users',
    loadError: 'Could not load the count',
    retry: 'Retry',
    descriptions: {
      ADMIN: 'Full control over the system, accounts and configuration.',
      STAFF:
        'Performs assigned flight, payload, inspection, maintenance or support duties.',
      MANAGER: 'Coordinates orders, missions and resources.',
      CUSTOMER: 'Orders services and follows monitoring results.',
    } as Record<string, string>,
  },
})
