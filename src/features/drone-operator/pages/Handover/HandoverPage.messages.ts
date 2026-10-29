import { defineMessages } from '../../../../shared/i18n'

export const handoverPageMessages = defineMessages({
  vi: {
    commitments: [
      'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong nhiệm vụ.',
      'Tôi giữ thiết bị trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
      'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
      'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi thiết bị hạ cánh và tắt động cơ.',
    ],
    noMissionSelected: 'Chưa chọn nhiệm vụ',
    noDroneAssigned: 'Chưa gán thiết bị',
    noDroneAssignedError: 'Chọn nhiệm vụ đã gán thiết bị trước khi tiếp tục',
    precheckRequiredError:
      'Vui lòng chạy precheck thành công trước khi bàn giao',
    confirmFailed: 'Không xác nhận được cam kết',
    stepTitle: 'Bàn giao quyền điều khiển',
    commitmentTitle: 'Xác nhận bàn giao sau preflight',
    ackLabel:
      'Tôi xác nhận preflight đã đạt và bàn giao cho pilot tiếp tục bay',
    back: 'Quay lại',
    processing: 'Đang xử lý...',
    confirmHandover: 'Xác nhận bàn giao',
    confirmLockedNote:
      'Nút xác nhận bị khoá đến khi bạn tick đủ 4 cam kết. Nếu bạn kiêm pilot, hệ thống sẽ chuyển thẳng sang buồng lái sau khi xác nhận.',
    connectedAt:
      'Đã kết nối GCS DJI-RC-PLUS-7A31 lúc 13:26:41 · telemetry hoạt động',
    connected: 'Đã kết nối',
  },
  en: {
    commitments: [
      'I have checked the flight area: no people or vehicles in the safety zone, and I comply with every no-fly zone flagged in the mission.',
      'I will keep the device in visual line of sight where possible, stay under 120 m altitude, and stay within the 500 m monitoring radius.',
      'I am ready to trigger RTL or LAND immediately on a low-battery warning, telemetry loss, or bad weather.',
      'I take responsibility for operational safety from confirmation until the device lands and the motors are off.',
    ],
    noMissionSelected: 'No mission selected',
    noDroneAssigned: 'No device assigned',
    noDroneAssignedError:
      'Select a mission with an assigned device before continuing',
    precheckRequiredError:
      'Please run the precheck successfully before the handover',
    confirmFailed: 'Could not confirm the commitments',
    stepTitle: 'Control handover',
    commitmentTitle: 'Post-preflight handover confirmation',
    ackLabel:
      'I confirm preflight passed and hand over the mission to the pilot',
    back: 'Back',
    processing: 'Processing...',
    confirmHandover: 'Confirm handover',
    confirmLockedNote:
      'The confirm button stays locked until all 4 commitments are checked. If you also have the pilot role, you will go straight to the cockpit after confirmation.',
    connectedAt:
      'Connected to GCS DJI-RC-PLUS-7A31 at 13:26:41 · telemetry active',
    connected: 'Connected',
  },
})
