import { defineMessages } from '../../../../shared/i18n'

export const acceptRejectMessages = defineMessages({
  vi: {
    missionDetail: 'Chi tiết nhiệm vụ',
    missionAssignment: 'Phân công nhiệm vụ',
    description: 'Xem lại yêu cầu nhiệm vụ và xác nhận chấp nhận hoặc từ chối.',
    fields: {
      customer: 'Khách hàng',
      location: 'Vị trí',
      scheduled: 'Lịch trình',
      duration: 'Thời lượng',
      drone: 'Drone',
    },
    durationValue: (minutes: number) => `~${minutes} phút`,
    confirmLabel:
      'Tôi đã xem lại yêu cầu nhiệm vụ và xác nhận sẵn sàng vận hành nhiệm vụ này với tư cách người vận hành được phân công.',
    rejectMission: 'Từ chối nhiệm vụ',
    acceptMission: 'Chấp nhận nhiệm vụ',
    reasonForRejection: 'Lý do từ chối',
    rejectionReasons: [
      'Thiết bị không phù hợp với loại nhiệm vụ này',
      'Điều kiện thời tiết không an toàn',
      'Xung đột lịch với nhiệm vụ đang hoạt động',
      'Thông số nhiệm vụ yêu cầu chứng chỉ chuyên môn',
      'Drone cần bảo trì trước khi triển khai tiếp theo',
      'Thời gian bay không đủ cho phạm vi nhiệm vụ',
      'Lý do khác',
    ],
    cancel: 'Hủy',
    confirmRejection: 'Xác nhận từ chối',
  },
  en: {
    missionDetail: 'Mission detail',
    missionAssignment: 'Mission assignment',
    description:
      'Review the mission requirements and confirm your acceptance or rejection.',
    fields: {
      customer: 'Customer',
      location: 'Location',
      scheduled: 'Scheduled',
      duration: 'Duration',
      drone: 'Drone',
    },
    durationValue: (minutes: number) => `~${minutes} min`,
    confirmLabel:
      'I have reviewed the mission requirements and confirm I am ready to operate this mission as the assigned drone operator.',
    rejectMission: 'Reject mission',
    acceptMission: 'Accept mission',
    reasonForRejection: 'Reason for rejection',
    rejectionReasons: [
      'Equipment not suitable for this mission type',
      'Weather conditions are unsafe',
      'Scheduling conflict with active mission',
      'Mission parameters require specialist certification',
      'Drone requires maintenance before next deployment',
      'Insufficient flight time for mission scope',
      'Other reason',
    ],
    cancel: 'Cancel',
    confirmRejection: 'Confirm rejection',
  },
})
