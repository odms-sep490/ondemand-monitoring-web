import { defineMessages } from '../../../../shared/i18n'

export const preflightFailureMessages = defineMessages({
  vi: {
    preflightCheck: 'Kiểm tra trước bay',
    scenarios: {
      'all-pass': {
        title: 'Không phát hiện lỗi',
        desc: 'Tất cả các mục đều đạt.',
      },
      'battery-fail': {
        title: 'Pin không đủ',
        desc: 'Mức pin dưới ngưỡng tối thiểu 80%. Drone phải được sạc trước khi triển khai.',
      },
      'hardware-fail': {
        title: 'Phát hiện lỗi phần cứng',
        desc: 'Camera hoặc gimbal đang báo lỗi. Drone cần được bảo trì trước khi triển khai.',
      },
      'telemetry-stale': {
        title: 'Liên kết telemetry suy giảm',
        desc: 'Tín hiệu telemetry cũ hơn 5 giây. Đây là dấu hiệu của sự cố liên lạc, không phải lỗi vật lý — kiểm tra ăng-ten trạm mặt đất và đường truyền tín hiệu.',
      },
      'weather-warn': {
        title: 'Cảnh báo thời tiết',
        desc: 'Điều kiện ở mức giới hạn nhưng vẫn trong ngưỡng chấp nhận được. Xem lại cảnh báo và tiếp tục thận trọng hoặc hoãn lại.',
      },
    },
    communicationIssue: 'Sự cố liên lạc — không phải lỗi phần cứng',
    staleTelemetryBody:
      'Telemetry cũ nghĩa là trạm mặt đất không nhận được dữ liệu mới từ drone. Bản thân drone có thể vẫn hoạt động bình thường. Kiểm tra kết nối ăng-ten và đường truyền tín hiệu trước khi thay drone.',
    checkResults: 'Kết quả kiểm tra',
    failed: '✕ Không đạt',
    warning: '⚠ Cảnh báo',
    action: 'Hành động:',
    selectReplacement: 'Chọn drone thay thế',
    acknowledgeAndContinue: 'Xác nhận và tiếp tục',
    escalateToManager: 'Báo cáo lên quản lý',
  },
  en: {
    preflightCheck: 'Pre-flight check',
    scenarios: {
      'all-pass': {
        title: 'No failures detected',
        desc: 'All checks passed.',
      },
      'battery-fail': {
        title: 'Battery charge insufficient',
        desc: 'Battery level is below the minimum 80% threshold. The drone must be charged before deployment.',
      },
      'hardware-fail': {
        title: 'Hardware fault detected',
        desc: 'Camera or gimbal is reporting a fault. The drone requires maintenance before it can be deployed.',
      },
      'telemetry-stale': {
        title: 'Telemetry link degraded',
        desc: 'Telemetry signal is older than 5 seconds. This indicates a communication issue, not a physical fault — verify the ground station antenna and signal path.',
      },
      'weather-warn': {
        title: 'Weather advisory',
        desc: 'Conditions are marginal but within acceptable limits. Review the advisory and proceed with caution or postpone.',
      },
    },
    communicationIssue: 'Communication issue — not a hardware fault',
    staleTelemetryBody:
      'Stale telemetry means the ground station is not receiving fresh data from the drone. The drone itself may be operational. Check antenna connections and signal path before replacing the drone.',
    checkResults: 'Check results',
    failed: '✕ Failed',
    warning: '⚠ Warning',
    action: 'Action:',
    selectReplacement: 'Select replacement drone',
    acknowledgeAndContinue: 'Acknowledge and continue',
    escalateToManager: 'Escalate to manager',
  },
})
