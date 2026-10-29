import { defineMessages } from '../../../../shared/i18n'

export const postflightPageMessages = defineMessages({
  vi: {
    categories: {
      structure: {
        title: 'Cấu trúc & Khung vỏ',
        items: {
          physical_condition_ok: {
            label: 'Tình trạng vật lý & Khung vỏ',
            detail:
              'Cánh quạt, chân đáp, khung thân, gimbal camera không nứt gãy',
          },
        },
      },
      power: {
        title: 'Hệ thống động lực & Nguồn',
        items: {
          motor_ok: {
            label: 'Động cơ & Esc',
            detail: 'Âm thanh quay đều, không quá nhiệt, không kẹt vật thể',
          },
          battery_ok: {
            label: 'Pin & Tiếp điểm điện',
            detail: 'Không phồng rộp, nhiệt độ an toàn, tiếp điểm sạch',
          },
        },
      },
      sensors: {
        title: 'Cảm biến & Payload',
        items: {
          camera_ok: {
            label: 'Camera & Cảm biến giám sát',
            detail:
              'Ống kính sạch, ghi hình truyền tải ổn định suốt chuyến bay',
          },
        },
      },
      gcs: {
        title: 'Định vị & Liên lạc GCS',
        items: {
          gps_ok: {
            label: 'Hệ thống định vị GPS / RTK',
            detail: 'Khóa vệ tinh chính xác, không mất tọa độ trong chuyến bay',
          },
          communication_ok: {
            label: 'Liên lạc Telemetry & Video Link',
            detail: 'Đường truyền GCS ổn định, không mất kết nối bất thường',
          },
        },
      },
    },
    noMissionId: 'Không xác định được ID nhiệm vụ',
    assessAllRequired: (total: number) =>
      `Vui lòng kiểm tra và chọn ĐẠT/KHÔNG ĐẠT đủ cả ${total} mục.`,
    saveFailed:
      'Không thể lưu báo cáo kiểm tra sau chuyến bay. Vui lòng kiểm tra kết nối Server.',
    noteWriteFailed: 'Không ghi được ghi chú bảo trì',
    incidentDetailsPrefix: '[Chi tiết sự cố]:',
    missionNotFoundTitle: 'Không tìm thấy thông tin nhiệm vụ',
    missionNotFoundDesc: 'Vui lòng chọn nhiệm vụ cần thực hiện Postcheck.',
    completedStepTitle: 'Hoàn tất kiểm tra sau bay',
    defaultMissionLabel: 'Nhiệm vụ',
    successTitle: 'Postcheck đã hoàn tất',
    ticketCreatedTitle: 'Đã hoàn tất Postcheck & Khởi tạo Yêu cầu Bảo trì',
    missionCodeLabel: 'Mã nhiệm vụ:',
    deviceLabel: 'Thiết bị:',
    missionStatusLabel: 'Trạng thái nhiệm vụ',
    missionStatusValue: 'Chờ nghiệm thu tải lên media',
    physicalCheckLabel: 'Kiểm tra vật lý sau bay',
    physicalCheckAllPass: '100% ĐẠT',
    physicalCheckSomeFail: (count: number) =>
      `PHÁT HIỆN BẤT THƯỜNG (${count} mục)`,
    droneStatusLabel: (deviceId: string) => `Trạng thái thiết bị (${deviceId})`,
    droneStatusAvailable: '🟢 AVAILABLE (Sẵn sàng bay)',
    droneStatusMaintenance: '🟡 MAINTENANCE (Tự động mở yêu cầu bảo trì)',
    maintenanceTicketLabel: 'Yêu cầu bảo trì hệ thống',
    maintenanceTicketValue: 'TKT-POSTFLIGHT-XXXX (Đã tạo thành công)',
    backToMissionList: 'Về danh sách nhiệm vụ',
    stepTitle: 'Kiểm tra sau chuyến bay',
    selectMission: 'Chọn nhiệm vụ:',
    landingBattery: 'Pin hạ cánh',
    altitude: 'Độ cao',
    speed: 'Tốc độ',
    heading: 'Heading',
    assessmentProgress: 'Tiến độ đánh giá',
    itemsAssessed: (count: number, total: number) =>
      `${count} / ${total} mục đã kiểm tra`,
    someFailed: (count: number) => `${count} KHÔNG ĐẠT`,
    allPassed: '100% ĐẠT',
    passAll: '✓ Đánh giá tất cả ĐẠT',
    pass: '✓ ĐẠT',
    fail: '✕ KHÔNG ĐẠT',
    notesLabel: '📝 Ghi chú kiểm tra sau bay (Notes)',
    notesPlaceholder:
      'Ghi chú thêm về hiện trạng thiết bị, điều kiện môi trường hoặc phát sinh trong chuyến bay...',
    foundFailures: (count: number) => `🚨 Phát hiện ${count} mục KHÔNG ĐẠT`,
    autoTicketNotePrefix: 'Hệ thống sẽ',
    autoTicketNoteBold: 'tự động khởi tạo yêu cầu bảo trì (trạng thái: OPEN)',
    autoTicketNoteMid: 'cho thiết bị',
    autoTicketNoteSuffix: 'ngay khi bạn gửi báo cáo.',
    detailsAdded: '✓ Đã bổ sung chi tiết',
    addMaintenanceDetails: '✏️ Bổ sung mô tả bảo trì',
    allPassNotePrefix:
      '🟢 Tất cả các hạng mục đạt tiêu chuẩn. Thiết bị sẽ được chuyển trạng thái',
    allPassNoteBold: 'SẴN SÀNG (AVAILABLE)',
    allPassNoteSuffix: 'cho chuyến bay tiếp theo.',
    submitting: 'Đang gửi báo cáo...',
    submitAndCreateTicket: 'Gửi báo cáo & Tạo yêu cầu bảo trì',
    completeFlight: 'Hoàn tất postcheck',
    failedItemsDescription: (items: string) =>
      `Mục không đạt kiểm tra sau bay: ${items}`,
  },
  en: {
    categories: {
      structure: {
        title: 'Structure & Airframe',
        items: {
          physical_condition_ok: {
            label: 'Physical condition & airframe',
            detail:
              'Propellers, landing gear, frame, camera gimbal free of cracks or damage',
          },
        },
      },
      power: {
        title: 'Propulsion & power system',
        items: {
          motor_ok: {
            label: 'Motors & ESCs',
            detail: 'Spins evenly, no overheating, no jammed debris',
          },
          battery_ok: {
            label: 'Battery & electrical contacts',
            detail: 'No swelling, safe temperature, clean contacts',
          },
        },
      },
      sensors: {
        title: 'Sensors & payload',
        items: {
          camera_ok: {
            label: 'Camera & monitoring sensors',
            detail:
              'Clean lens, stable recording and streaming throughout the flight',
          },
        },
      },
      gcs: {
        title: 'Positioning & GCS link',
        items: {
          gps_ok: {
            label: 'GPS / RTK positioning system',
            detail:
              'Accurate satellite lock, no position loss during the flight',
          },
          communication_ok: {
            label: 'Telemetry & video link',
            detail: 'Stable GCS link, no unexpected disconnects',
          },
        },
      },
    },
    noMissionId: 'Could not determine the mission ID',
    assessAllRequired: (total: number) =>
      `Please inspect and mark PASS/FAIL for all ${total} items.`,
    saveFailed:
      'Could not save the postflight report. Please check the server connection.',
    noteWriteFailed: 'Could not save the maintenance note',
    incidentDetailsPrefix: '[Incident details]:',
    missionNotFoundTitle: 'Mission information not found',
    missionNotFoundDesc: 'Please select the mission to run the postcheck for.',
    completedStepTitle: 'Postflight check completed',
    defaultMissionLabel: 'Mission',
    successTitle: 'Postcheck completed',
    ticketCreatedTitle: 'Postcheck completed & maintenance request created',
    missionCodeLabel: 'Mission code:',
    deviceLabel: 'Device:',
    missionStatusLabel: 'Mission status',
    missionStatusValue: 'Waiting for media review upload',
    physicalCheckLabel: 'Post-flight physical check',
    physicalCheckAllPass: '100% PASSED',
    physicalCheckSomeFail: (count: number) => `ISSUES FOUND (${count} items)`,
    droneStatusLabel: (deviceId: string) => `Device status (${deviceId})`,
    droneStatusAvailable: '🟢 AVAILABLE (Ready to fly)',
    droneStatusMaintenance: '🟡 MAINTENANCE (Maintenance ticket auto-opened)',
    maintenanceTicketLabel: 'Backend maintenance ticket',
    maintenanceTicketValue: 'TKT-POSTFLIGHT-XXXX (Created successfully)',
    backToMissionList: 'Back to mission list',
    stepTitle: 'Postflight check — post-flight inspection',
    selectMission: 'Select mission:',
    landingBattery: 'Landing battery',
    altitude: 'Altitude',
    speed: 'Speed',
    heading: 'Heading',
    assessmentProgress: 'Assessment progress',
    itemsAssessed: (count: number, total: number) =>
      `${count} / ${total} items checked`,
    someFailed: (count: number) => `${count} FAILED`,
    allPassed: '100% PASSED',
    passAll: '✓ Mark all as PASS',
    pass: '✓ PASS',
    fail: '✕ FAIL',
    notesLabel: '📝 Post-flight inspection notes',
    notesPlaceholder:
      'Add notes about the device condition, environment, or anything that happened during the flight...',
    foundFailures: (count: number) => `🚨 ${count} item(s) FAILED`,
    autoTicketNotePrefix: 'The backend will',
    autoTicketNoteBold:
      'automatically open a maintenance ticket (status: OPEN)',
    autoTicketNoteMid: 'for device',
    autoTicketNoteSuffix: 'as soon as you submit the report.',
    detailsAdded: '✓ Details added',
    addMaintenanceDetails: '✏️ Add maintenance details',
    allPassNotePrefix: '🟢 All items meet standard. The device will move to',
    allPassNoteBold: 'AVAILABLE',
    allPassNoteSuffix: 'status for the next mission.',
    submitting: 'Submitting report...',
    submitAndCreateTicket: 'Submit report & create maintenance ticket',
    completeFlight: 'Complete postcheck',
    failedItemsDescription: (items: string) =>
      `Failed post-flight check items: ${items}`,
  },
})
