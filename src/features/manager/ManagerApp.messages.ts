import { defineMessages } from '../../shared/i18n'

export const managerAppMessages = defineMessages({
  vi: {
    breadcrumb: {
      dashboard: 'Bảng điều khiển',
      orderQueue: 'Đơn hàng & Nhiệm vụ',
      orderReview: 'Đơn hàng & Nhiệm vụ',
      missionCreate: 'Đơn hàng & Nhiệm vụ',
      missionDispatch: 'Nhiệm vụ',
      schedule: 'Lịch nhiệm vụ',
      missions: 'Nhiệm vụ',
      drones: 'Đội drone',
      maintenance: 'Bảo trì',
      notFound: 'Không tìm thấy',
    },
    notFoundTitle: 'Không tìm thấy màn hình',
    notFoundDescription: 'Đường dẫn này không tồn tại trong khu vực Quản lý.',
    backToDashboard: 'Về bảng điều khiển',
  },
  en: {
    breadcrumb: {
      dashboard: 'Dashboard',
      orderQueue: 'Order review',
      orderReview: 'Order review',
      missionCreate: 'Mission',
      missionDispatch: 'Mission',
      schedule: 'Mission schedule',
      missions: 'Missions',
      drones: 'Drone fleet',
      maintenance: 'Maintenance',
      notFound: 'Not found',
    },
    notFoundTitle: 'Screen not found',
    notFoundDescription: 'This path does not exist in the Staff area.',
    backToDashboard: 'Back to Dashboard',
  },
})
