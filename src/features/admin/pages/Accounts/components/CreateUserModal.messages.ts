import { defineMessages } from '../../../../../shared/i18n'

export const createUserModalMessages = defineMessages({
  vi: {
    title: 'Tạo tài khoản',
    subtitle:
      'Hệ thống gửi lời mời qua email. Quản trị viên không cần nhập mật khẩu.',
    fullName: 'Họ và tên',
    fullNamePlaceholder: 'VD: Nguyễn Văn A',
    email: 'Email',
    emailPlaceholder: 'name@company.vn',
    role: 'Vai trò',
    roleDescriptions: {
      ADMIN: 'Quản trị người dùng, danh mục và cấu hình hệ thống.',
      MANAGER: 'Duyệt đơn, điều phối nhiệm vụ, giao kết quả.',
      STAFF: 'Thực hiện công việc theo hồ sơ và phân công trong nhiệm vụ.',
    } as Record<string, string>,
    required: 'Bắt buộc',
    invalidEmail: 'Email không hợp lệ',
    genericError: 'Có lỗi xảy ra.',
    sending: 'Đang gửi...',
    submit: 'Tạo & gửi lời mời',
    cancel: 'Hủy',
  },
  en: {
    title: 'Create account',
    subtitle:
      'The system sends an invitation by email. Admins do not need to enter a password.',
    fullName: 'Full name',
    fullNamePlaceholder: 'E.g. John Smith',
    email: 'Email',
    emailPlaceholder: 'name@company.vn',
    role: 'Role',
    roleDescriptions: {
      ADMIN: 'Manage users, catalog and system configuration.',
      MANAGER: 'Review requests, coordinate missions and deliver results.',
      STAFF:
        'Carry out work according to their profile and mission assignments.',
    } as Record<string, string>,
    required: 'Required',
    invalidEmail: 'Invalid email',
    genericError: 'Something went wrong.',
    sending: 'Sending...',
    submit: 'Create & send invitation',
    cancel: 'Cancel',
  },
})
