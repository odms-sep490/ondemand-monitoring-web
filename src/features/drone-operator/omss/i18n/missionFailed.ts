import { defineMessages } from '../../../../shared/i18n'

export const missionFailedMessages = defineMessages({
  vi: {
    missionFailed: 'Nhiệm vụ thất bại',
    incidentRecord: 'Hồ sơ sự cố',
    fields: {
      mission: 'Nhiệm vụ',
      failureReason: 'Lý do thất bại',
      drone: 'Drone',
      droneStatus: 'Trạng thái drone',
      operator: 'Operator',
      timestamp: 'Thời gian',
    },
    currentOperator: 'Người vận hành hiện tại',
    requiredActions: 'Hành động cần thực hiện',
    actions: [
      'Lý do thất bại đã được ghi nhận vào nhiệm vụ',
      'Xác nhận tình trạng vật lý và an toàn của drone',
      'Tải lên mọi media đã ghi được của nhiệm vụ',
      'Chờ quản lý xem xét và quyết định phân công lại',
    ],
    incidentNarrative: 'Diễn biến sự cố',
    incidentNarrativeAria: 'Diễn biến sự cố đã ghi nhận',
    backToMissions: 'Quay lại danh sách nhiệm vụ',
    incidentRecorded: 'Đã ghi nhận sự cố',
  },
  en: {
    missionFailed: 'Mission failed',
    incidentRecord: 'Incident record',
    fields: {
      mission: 'Mission',
      failureReason: 'Failure reason',
      drone: 'Drone',
      droneStatus: 'Drone status',
      operator: 'Operator',
      timestamp: 'Timestamp',
    },
    currentOperator: 'Current operator',
    requiredActions: 'Required actions',
    actions: [
      'Failure reason has been recorded in the mission',
      'Confirm drone physical condition and safety',
      'Upload any available mission media',
      'Await manager review and re-assignment decision',
    ],
    incidentNarrative: 'Incident narrative',
    incidentNarrativeAria: 'Recorded incident narrative',
    backToMissions: 'Back to missions',
    incidentRecorded: 'Incident recorded',
  },
})
