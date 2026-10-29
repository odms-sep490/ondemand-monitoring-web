import { defineMessages } from '../../../shared/i18n'

export const missionStatusBadgeMessages = defineMessages({
  vi: {
    mission: {
      WAITING_DEPOSIT: 'Chờ xác nhận tiền cọc',
      READY: 'Nhiệm vụ đã xác nhận, đang chuẩn bị resource',
      WAITING_OPERATOR_ACCEPTANCE: 'Chờ người vận hành tiếp nhận',
      SCHEDULED: 'Đã lên lịch (Scheduled)',
      CONNECTED: 'GCS App Connected',
      PREFLIGHT_CHECKING: 'Đang kiểm tra trước chuyến bay',
      READY_TO_FLY: 'Sẵn sàng cất cánh (Ready)',
      IN_FLIGHT: 'Đang bay (In-Flight)',
      RETURNING: 'Đang hạ cánh / về trạm',
      COMPLETED: 'Nhiệm vụ hoàn thành',
      FAILED_PREFLIGHT: 'Lỗi kiểm tra trước chuyến bay / Chờ duyệt lại',
      CANCELLED: 'Đã hủy / Thất bại',
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
      WAITING_DEPOSIT: 'Waiting for deposit',
      READY: 'Confirmed, preparing resources',
      WAITING_OPERATOR_ACCEPTANCE: 'Waiting for operator acceptance',
      SCHEDULED: 'Scheduled',
      CONNECTED: 'GCS App connected',
      PREFLIGHT_CHECKING: 'Running pre-flight check',
      READY_TO_FLY: 'Ready to fly',
      IN_FLIGHT: 'In-flight',
      RETURNING: 'Returning to base',
      COMPLETED: 'Mission completed',
      FAILED_PREFLIGHT: 'Pre-flight failed / pending re-approval',
      CANCELLED: 'Cancelled / failed',
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
