import { defineMessages } from '../../../../shared/i18n'

export const preflightPageMessages = defineMessages({
  vi: {
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssigned: 'Chưa gán thiết bị',
    noDroneAssignedError: 'Mission chưa được gán thiết bị',
    backendPreflightFailed: 'Kết quả kiểm tra trước bay từ hệ thống chưa đạt',
    confirmPrecheckFailed: 'Không xác nhận được kết quả kiểm tra trước bay',
    loadMissionFailed: 'Không tải được mission',
    confirmingTelemetry:
      'Đang xác nhận dữ liệu thiết bị và kết quả kiểm tra trước bay…',
    stepTitle: 'Danh sách kiểm tra trước bay',
    itemsPassed: 'mục đạt',
    passReady: 'PASS · đủ điều kiện cất cánh',
    passDescription:
      'Tất cả hạng mục kiểm tra trước bay bắt buộc phải đạt trước khi nhiệm vụ sẵn sàng cất cánh.',
    airspacePermissionDenied:
      'Khu vực bay chưa được cấp phép. Vui lòng kiểm tra quyền bay trước khi tiếp tục.',
    preflightCheckFailed:
      'Kiểm tra trước bay chưa hoàn tất. Vui lòng kiểm tra quyền bay và thử lại.',
    failBlocked: (items: string) => `FAIL · CHẶN BAY · Không đạt: ${items}`,
    runningPrecheck: (progress: number) =>
      `Đang kiểm tra thiết bị trước bay... ${progress}%`,
    pressTriggerHint: 'Bấm “Bắt đầu kiểm tra” để kiểm tra thiết bị.',
    switchingToReady: 'Đang cập nhật trạng thái thiết bị...',
    continueToHandover: 'Tiếp tục tới bàn giao',
    triggeringAgain: 'Đang kiểm...',
    triggerAgain: 'Kiểm tra lại',
    triggerPrecheck: 'Bắt đầu kiểm tra',
    requestDroneReplacement: 'Gửi yêu cầu đổi drone',
    requestingDroneReplacement: 'Đang gửi yêu cầu...',
    droneReplacementRequestSent: 'Đã gửi yêu cầu đổi drone cho quản lý.',
    droneReplacementRequestSentShort: 'Đã gửi yêu cầu',
    droneReplacementRequestFailed: 'Không gửi được yêu cầu đổi drone.',
    weatherTitle: 'Thời tiết bay',
    weatherNotChecked: 'CHƯA GHI NHẬN',
    weatherSummary: (
      wind: string,
      gust: string,
      rain: string,
      visibility: string,
    ) =>
      `Gió ${wind} m/s · Giật ${gust} m/s · Mưa ${rain} mm/h · Tầm nhìn ${visibility} km`,
    weatherHint:
      'Hệ thống có thể lấy thời tiết hiện tại theo tọa độ mission; operator đối chiếu ngoài đời rồi xác nhận biên bản.',
    weatherSuggest: 'Lấy thời tiết hiện tại',
    weatherSuggesting: 'Đang lấy thời tiết...',
    weatherForecastApplied: 'Đã lấy thời tiết hiện tại theo tọa độ mission',
    weatherForecastUnavailable:
      'Chưa lấy được gợi ý thời tiết theo tọa độ. Operator có thể nhập từ nguồn quan trắc khác.',
    weatherCoordinateHint: (lat: string, lon: string) =>
      `Tọa độ mission: ${lat}, ${lon}. Dữ liệu hiện tại chỉ hỗ trợ quyết định, không thay thế xác nhận của operator.`,
    weatherNoCoordinates:
      'Mission chưa có latitude/longitude nên không thể lấy gợi ý tự động.',
    weatherSaving: 'Đang lưu...',
    weatherUpdate: 'Cập nhật biên bản',
    weatherRecord: 'Ghi nhận thời tiết',
    weatherSource: 'Nguồn kiểm tra',
    weatherSourcePlaceholder: 'VD: Windy, AccuWeather, trạm khí tượng...',
    weatherObservedAt: 'Thời điểm xem',
    weatherWind: 'Gió',
    weatherGust: 'Gió giật',
    weatherRain: 'Mưa',
    weatherVisibility: 'Tầm nhìn',
    weatherTemperature: 'Nhiệt độ',
    weatherHumidity: 'Độ ẩm',
    weatherDecision: 'Kết luận của operator',
    weatherDecisionPass: 'An toàn để bay',
    weatherDecisionWarn: 'Cảnh báo, vẫn cho phép bay',
    weatherDecisionFail: 'Không an toàn, chặn bay',
    weatherNotes: 'Ghi chú căn cứ',
    weatherNotesPlaceholder:
      'VD: trời quang, gió ổn định; đã đối chiếu khu vực bay...',
    weatherManualSafe: 'Thời tiết ngoài đời phù hợp để bay.',
    weatherManualCaution:
      'Có yếu tố cần chú ý, operator xác nhận vẫn bay được.',
    weatherManualUnsafe: 'Thời tiết ngoài đời không an toàn để bay.',
    weatherManualMissing:
      'Nhập đầy đủ nguồn kiểm tra, thời điểm và các chỉ số thời tiết trước khi lưu.',
    itemFail: 'Không đạt',
    itemPass: 'Đạt',
    itemChecking: 'Đang kiểm',
    itemPending: 'Chờ kiểm',
    fetchCurrentBattery: 'Lấy pin hiện tại',
    failureReasonPlaceholder: 'Nhập lý do không đạt',
    confirmFailure: 'Xác nhận',
    triggerFailed:
      'Không thể bắt đầu kiểm tra thiết bị. Hãy mở Drone Stack rồi thử lại.',
    weatherApiFailed:
      'Không lưu được biên bản thời tiết. Kiểm tra dữ liệu rồi thử lại.',
    precheckConnectionLost:
      'Mất kết nối khi kiểm tra thiết bị. Bấm “Kiểm tra lại” để thử lần nữa.',
    confirmingBackendPrecheck: 'Đang xác nhận kết quả kiểm tra trước bay…',
    backendSwitchedReady: 'Thiết bị đã đạt trạng thái READY_TO_FLY.',
    backendPreflightUnconfirmed:
      'Không xác nhận được kết quả kiểm tra trước bay.',
    statusNoTrigger: 'Chưa bắt đầu kiểm tra trước bay',
    statusWarnNoBlock: 'Cảnh báo nhưng không chặn bay',
    statusChecking: 'Đang kiểm tra',
    statusWaiting: 'Đang chờ',
  },
  en: {
    noMissionSelected: 'No mission selected',
    noDroneAssigned: 'No device assigned',
    noDroneAssignedError: 'Mission has no device assigned',
    backendPreflightFailed: 'Backend preflight failed',
    confirmPrecheckFailed: 'Could not confirm the precheck',
    loadMissionFailed: 'Could not load the mission',
    confirmingTelemetry: 'Confirming telemetry and precheck…',
    stepTitle: 'Preflight checklist',
    itemsPassed: 'items passed',
    passReady: 'PASS · cleared for takeoff',
    passDescription:
      'Every required pre-flight item must pass before the mission can be marked ready to fly.',
    airspacePermissionDenied:
      'Flight permission is missing for this area. Check the airspace permit before continuing.',
    preflightCheckFailed:
      'The pre-flight check could not be completed. Check flight permissions and try again.',
    failBlocked: (items: string) => `FAIL · FLIGHT BLOCKED · Failed: ${items}`,
    runningPrecheck: (progress: number) => `Running precheck... ${progress}%`,
    pressTriggerHint: 'Press "Trigger precheck" to call the device check API.',
    switchingToReady: 'Updating the device status...',
    continueToHandover: 'Continue to handover',
    triggeringAgain: 'Triggering...',
    triggerAgain: 'Trigger precheck again',
    triggerPrecheck: 'Trigger precheck',
    requestDroneReplacement: 'Request a drone replacement',
    requestingDroneReplacement: 'Sending request...',
    droneReplacementRequestSent:
      'Drone replacement request sent to the manager.',
    droneReplacementRequestSentShort: 'Request sent',
    droneReplacementRequestFailed:
      'Could not send the drone replacement request.',
    weatherTitle: 'Flight weather',
    weatherNotChecked: 'NOT RECORDED',
    weatherSummary: (
      wind: string,
      gust: string,
      rain: string,
      visibility: string,
    ) =>
      `Wind ${wind} m/s · Gust ${gust} m/s · Rain ${rain} mm/h · Visibility ${visibility} km`,
    weatherHint:
      'The system can fetch current weather from mission coordinates; the operator cross-checks and confirms the log.',
    weatherSuggest: 'Fetch current weather',
    weatherSuggesting: 'Fetching weather...',
    weatherForecastApplied:
      'Current weather loaded from the mission coordinates',
    weatherForecastUnavailable:
      'Could not fetch a coordinate-based weather suggestion. The operator can enter another observed source.',
    weatherCoordinateHint: (lat: string, lon: string) =>
      `Mission coordinates: ${lat}, ${lon}. This current weather supports the decision and does not replace operator confirmation.`,
    weatherNoCoordinates:
      'This mission has no latitude/longitude, so automatic suggestion is unavailable.',
    weatherSaving: 'Saving...',
    weatherUpdate: 'Update weather log',
    weatherRecord: 'Record weather',
    weatherSource: 'Source checked',
    weatherSourcePlaceholder: 'Ex: Windy, AccuWeather, weather station...',
    weatherObservedAt: 'Observed at',
    weatherWind: 'Wind',
    weatherGust: 'Gust',
    weatherRain: 'Rain',
    weatherVisibility: 'Visibility',
    weatherTemperature: 'Temperature',
    weatherHumidity: 'Humidity',
    weatherDecision: 'Operator decision',
    weatherDecisionPass: 'Safe to fly',
    weatherDecisionWarn: 'Caution, allow flight',
    weatherDecisionFail: 'Unsafe, block flight',
    weatherNotes: 'Evidence notes',
    weatherNotesPlaceholder:
      'Ex: clear sky, stable wind; cross-checked near the flight area...',
    weatherManualSafe: 'Real-world weather is suitable for flight.',
    weatherManualCaution:
      'Weather needs attention; operator confirms flight is still allowed.',
    weatherManualUnsafe: 'Real-world weather is unsafe for flight.',
    weatherManualMissing:
      'Enter the source, observed time, and all weather values before saving.',
    itemFail: 'Failed',
    itemPass: 'Passed',
    itemChecking: 'Checking',
    itemPending: 'Pending',
    fetchCurrentBattery: 'Get current battery',
    failureReasonPlaceholder: 'Enter the failure reason',
    confirmFailure: 'Confirm',
    triggerFailed:
      'Could not call the trigger precheck API. Open Drone Stack and trigger again.',
    weatherApiFailed:
      'Could not save the weather log. Check the data and try again.',
    precheckConnectionLost:
      'Lost connection to the precheck API. Press "Trigger precheck" to run it again.',
    confirmingBackendPrecheck: 'Confirming the precheck with the backend...',
    backendSwitchedReady: 'The device reached READY_TO_FLY.',
    backendPreflightUnconfirmed: 'Could not confirm the backend preflight.',
    statusNoTrigger: 'Precheck not triggered yet',
    statusWarnNoBlock: 'Warning, but does not block the flight',
    statusChecking: 'Checking',
    statusWaiting: 'Waiting',
  },
})
