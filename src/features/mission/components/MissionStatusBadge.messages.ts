import { defineMessages } from '../../../shared/i18n'

export const missionStatusBadgeMessages = defineMessages({
  vi: {
    mission: {
      PENDING_PAYMENT: 'Chờ khách hàng thanh toán',
      PENDING_CONFIRMATION: 'Chờ phi hành đoàn xác nhận',
      PLANNING: 'Đang chuẩn bị trước bay',
      READY: 'Sẵn sàng chờ nghiệm thu',
      SCHEDULED: 'Đang chuẩn bị trước bay',
      IN_PROGRESS: 'Đang thực hiện',
      AWAITING_REVIEW: 'Đã gửi Manager, chờ duyệt',
      PENDING_REVIEW: 'Đã gửi Manager, chờ duyệt',
      COMPLETED: 'Nhiệm vụ hoàn thành',
      FAILED: 'Nhiệm vụ thất bại',
      CANCELLED: 'Đã hủy',
    },
    device: {
      AVAILABLE: 'AVAILABLE (Sẵn sàng)',
      PREFLIGHT: 'PREFLIGHT (Kiểm tra)',
      ACTIVE_MISSION: 'ACTIVE MISSION (Đang bay)',
      IDLE_CHARGING: 'CHARGING (Sạc pin)',
      MAINTENANCE: 'MAINTENANCE (Bảo trì)',
    },
  },
  en: {
    mission: {
      PENDING_PAYMENT: 'Waiting for customer payment',
      PENDING_CONFIRMATION: 'Waiting for crew acceptance',
      PLANNING: 'Preparing for preflight',
      READY: 'Ready for inspector start',
      SCHEDULED: 'Preparing for preflight',
      IN_PROGRESS: 'In progress',
      AWAITING_REVIEW: 'Pending manager approval',
      PENDING_REVIEW: 'Pending manager approval',
      COMPLETED: 'Mission completed',
      FAILED: 'Mission failed',
      CANCELLED: 'Cancelled',
    },
    device: {
      AVAILABLE: 'AVAILABLE (Ready)',
      PREFLIGHT: 'PREFLIGHT (Checking)',
      ACTIVE_MISSION: 'ACTIVE MISSION (Flying)',
      IDLE_CHARGING: 'CHARGING',
      MAINTENANCE: 'MAINTENANCE',
    },
  },
})
