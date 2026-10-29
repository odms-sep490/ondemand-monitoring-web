import { defineMessages } from '../../../../shared/i18n'

export const missionActionGuardMessages = defineMessages({
  vi: {
    checkingEyebrow: 'Đang kiểm tra',
    checkingTitle: 'Đang kiểm tra quyền nhiệm vụ',
    checkingDesc:
      'Hệ thống đang xác nhận phân công của bạn trước khi mở thao tác này.',
    readyEyebrow: 'Sẵn sàng bay',
    readyTitle: 'Đang mở buồng lái',
    readyDesc:
      'Người vận hành đã hoàn tất kiểm tra và bàn giao. Pilot có thể tiếp tục bay trong buồng lái.',
    errorMessage:
      'Không thể xác nhận quyền nhiệm vụ. Vui lòng kiểm tra lại hoặc đăng nhập lại.',
    pilotMessage:
      'Bước này dành cho người vận hành kết nối thiết bị, preflight và bàn giao. Pilot tiếp tục ở buồng lái sau khi người vận hành bàn giao.',
    deniedMessage:
      'Bạn chưa được phân công hoặc chưa có quyền thực hiện thao tác này.',
    deniedEyebrow: 'Chưa thể thao tác',
    deniedTitle: 'Bạn chưa có quyền mở bước này',
    openCockpit: 'Mở buồng lái',
    backToMission: 'Quay lại nhiệm vụ',
    retry: 'Kiểm tra lại',
  },
  en: {
    checkingEyebrow: 'Checking',
    checkingTitle: 'Checking mission permissions',
    checkingDesc:
      'The system is confirming your assignment before opening this action.',
    readyEyebrow: 'Ready to fly',
    readyTitle: 'Opening the cockpit',
    readyDesc:
      'The operator completed checks and handover. The pilot can continue in the cockpit.',
    errorMessage: 'Unable to confirm Mission access. Retry or sign in again.',
    pilotMessage:
      'This step is for the operator to connect the device, run preflight, and hand over. The pilot continues in the cockpit after handover.',
    deniedMessage:
      'Your accepted mission assignment does not permit this action.',
    deniedEyebrow: 'Action unavailable',
    deniedTitle: 'You cannot open this step yet',
    openCockpit: 'Open cockpit',
    backToMission: 'Back to mission',
    retry: 'Retry',
  },
})
