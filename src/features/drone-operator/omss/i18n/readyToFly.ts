import { defineMessages } from '../../../../shared/i18n'

export const readyToFlyMessages = defineMessages({
  vi: {
    title: 'Sẵn sàng bay',
    description:
      'Mọi yêu cầu kiểm tra trước bay đã được đáp ứng. Xem lại và bắt đầu nhiệm vụ.',
    waitingForInspector:
      'Precheck và bàn giao đã hoàn tất. Đang chờ staff nghiệm thu bắt đầu Mission.',
    readyToFly: 'Sẵn sàng bay',
    checks: {
      missionAccepted: 'Đã chấp nhận nhiệm vụ',
      droneConnected: 'Drone đã kết nối',
      preflightPassed: 'Đã vượt qua kiểm tra trước bay',
      handoverCompleted: 'Đã hoàn tất bàn giao',
    },
    fields: {
      mission: 'Nhiệm vụ',
      drone: 'Drone',
      location: 'Vị trí',
      battery: 'Pin',
    },
    confirmLabel:
      'Tôi xác nhận mọi yêu cầu kiểm tra trước bay đã được đáp ứng và sẵn sàng bắt đầu nhiệm vụ.',
    abort: 'Hủy',
    startMission: 'Bắt đầu nhiệm vụ',
  },
  en: {
    title: 'Ready to fly',
    description:
      'All pre-flight requirements have been met. Review and start the mission.',
    waitingForInspector:
      'Preflight and handover are complete. Waiting for the inspector to start the mission.',
    readyToFly: 'Ready to fly',
    checks: {
      missionAccepted: 'Mission accepted',
      droneConnected: 'Drone connected',
      preflightPassed: 'Pre-flight passed',
      handoverCompleted: 'Handover completed',
    },
    fields: {
      mission: 'Mission',
      drone: 'Drone',
      location: 'Location',
      battery: 'Battery',
    },
    confirmLabel:
      'I confirm all pre-flight requirements are met and I am ready to begin the mission.',
    abort: 'Abort',
    startMission: 'Start mission',
  },
})
