import { defineMessages } from '../../../../shared/i18n'

export const operatorWorkspaceMessages = defineMessages({
  vi: {
    fallback: {
      operatorName: 'Drone operator',
      operatorId: 'Không rõ',
    },
    failReasons: {
      preflightHardware: 'Lỗi phần cứng khi kiểm tra trước bay',
      emergencyStop: 'Dừng khẩn cấp — operator hủy nhiệm vụ',
    },
    errors: {
      cannotLoadMissions: 'Không thể tải danh sách nhiệm vụ được giao',
      cannotLoadMissionDetails: 'Không thể tải chi tiết nhiệm vụ',
      missionAcceptanceFailed: 'Nhận nhiệm vụ thất bại',
      missionRejectionFailed: 'Từ chối nhiệm vụ thất bại',
      missionStartFailed: 'Bắt đầu nhiệm vụ thất bại',
      missionDroneChanged:
        'Drone được phân công đã thay đổi. Tải lại nhiệm vụ trước khi kiểm tra trước bay.',
      telemetryTimeout:
        'Chờ dữ liệu telemetry mới từ drone quá thời gian. Kiểm tra Telemetry Sender và thử lại.',
      backendPreflightFailed: 'Kiểm tra trước bay ở backend không đạt',
      preflightRegistrationFailed: 'Ghi nhận kiểm tra trước bay thất bại',
      rtbUpdateFailed: 'Cập nhật trạng thái quay về căn cứ thất bại',
      missionFailureUpdateFailed:
        'Cập nhật trạng thái nhiệm vụ thất bại thất bại',
      postflightStartFailed: 'Bắt đầu kiểm tra sau bay thất bại',
      postflightCompletionFailed: 'Hoàn tất kiểm tra sau bay thất bại',
      postflightFaultFailed: 'Báo cáo sự cố sau bay thất bại',
    },
  },
  en: {
    fallback: {
      operatorName: 'Drone operator',
      operatorId: 'Unknown',
    },
    failReasons: {
      preflightHardware: 'Pre-flight hardware failure',
      emergencyStop: 'Emergency stop — operator abort',
    },
    errors: {
      cannotLoadMissions: 'Cannot load assigned missions',
      cannotLoadMissionDetails: 'Cannot load mission details',
      missionAcceptanceFailed: 'Mission acceptance failed',
      missionRejectionFailed: 'Mission rejection failed',
      missionStartFailed: 'Mission start failed',
      missionDroneChanged:
        'Mission drone assignment changed. Reload the mission before preflight.',
      telemetryTimeout:
        'Waiting for fresh drone telemetry timed out. Check Telemetry Sender and retry preflight.',
      backendPreflightFailed: 'Backend preflight did not pass',
      preflightRegistrationFailed: 'Preflight registration failed',
      rtbUpdateFailed: 'Return-to-base update failed',
      missionFailureUpdateFailed: 'Mission failure update failed',
      postflightStartFailed: 'Postflight start failed',
      postflightCompletionFailed: 'Postflight completion failed',
      postflightFaultFailed: 'Postflight fault reporting failed',
    },
  },
})
