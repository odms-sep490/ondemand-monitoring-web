import { defineMessages } from '../../../../shared/i18n'

export const handoverPageMessages = defineMessages({
  vi: {
    commitments: [
      'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong mission.',
      'Tôi giữ thiết bị trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
      'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
      'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi thiết bị hạ cánh và tắt động cơ.',
    ],
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssigned: 'Chưa gán thiết bị',
    noDroneAssignedError: 'Chọn mission đã gán thiết bị trước khi tiếp tục',
    precheckRequiredError:
      'Vui lòng hoàn tất kiểm tra thiết bị trước bay trước khi bàn giao.',
    crewAcceptanceRequired:
      'Mission chỉ sẵn sàng bàn giao sau khi toàn bộ staff đã chấp nhận.',
    confirmFailed: 'Không xác nhận được cam kết',
    stepTitle: 'Bàn giao quyền điều khiển',
    commitmentTitle: 'Xác nhận bàn giao sau khi kiểm tra trước bay',
    ackLabel:
      'Tôi xác nhận thiết bị đã đạt kiểm tra trước bay và bàn giao cho phi công tiếp tục bay.',
    back: 'Quay lại',
    processing: 'Đang xử lý...',
    confirmHandover: 'Xác nhận bàn giao',
    confirmLockedNote:
      'Thiết bị phải đạt kiểm tra trước bay và bạn cần xác nhận đủ 4 cam kết. Sau khi bàn giao, nhân sự nghiệm thu sẽ bắt đầu nhiệm vụ.',
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
    crewAcceptanceRequired:
      'The mission is ready for handover only after every assigned staff member accepts.',
    confirmFailed: 'Could not confirm the commitments',
    stepTitle: 'Control handover',
    commitmentTitle: 'Post-preflight handover confirmation',
    ackLabel:
      'I confirm preflight passed and hand over the mission to the pilot',
    back: 'Back',
    processing: 'Processing...',
    confirmHandover: 'Confirm handover',
    confirmLockedNote:
      'Preflight must pass and all 4 commitments must be checked. The inspector starts the Mission after handover.',
    connectedAt:
      'Connected to GCS DJI-RC-PLUS-7A31 at 13:26:41 · telemetry active',
    connected: 'Connected',
  },
})
