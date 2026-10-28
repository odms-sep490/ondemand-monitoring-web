import { defineMessages } from '../../../../shared/i18n'

export const missionCreatePageMessages = defineMessages({
  vi: {
    pageSubtitle:
      'Chọn giờ bay thực tế cho nhiệm vụ rồi chuyển sang bước gán nguồn lực',
    orderSummary: 'Tóm tắt đơn hàng',
    serviceLabel: 'Dịch vụ',
    customerLabel: 'Khách hàng',
    locationLabel: 'Địa điểm',
    radiusLabel: 'Bán kính giám sát',
    mediaLabel: 'Yêu cầu ảnh/video',
    durationLabel: (text: string) => `Thời lượng dự kiến: ${text}`,
    durationHours: (h: number, m: number) =>
      h > 0 ? (m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`) : `${m} phút`,
    actionHint:
      'Sau khi tạo nhiệm vụ, hệ thống chuyển sang bước Gán nguồn lực để chọn nhân sự và thiết bị.',
    backToOrders: 'Về danh sách đơn hàng',
    creating: 'Đang tạo nhiệm vụ…',
    loading: 'Đang tải…',
    loadError: 'Không tải được đơn để tạo nhiệm vụ',
    backToQueue: 'Về hàng đợi',
    planFailedTitle: 'Không tạo được kế hoạch bay',
    planFailedBody:
      'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.',
    retry: 'Thử lại',
    manualWaypointEntry: 'Nhập điểm bay thủ công',
    validationRequired: 'Thời gian bắt đầu/kết thúc là bắt buộc.',
    validationInvalidRange: 'Giờ kết thúc phải sau giờ cất cánh.',
    planGenerationFailed:
      'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.',
    createFailed: 'Tạo nhiệm vụ thất bại, vui lòng thử lại.',
    title: 'Tạo nhiệm vụ',
    fromOrder: (code: string, service: string, customer: string) =>
      `Từ đơn ${code} · ${service} · ${customer}`,
    customerTimeWindow: 'Khoảng thời gian khách yêu cầu',
    customerDeadlineValue: (date: string, timeName: string) =>
      `${date} · ${timeName}`,
    customerTimeWindowHint:
      'Đây là khung thời gian khách mong muốn, chỉ để nhân sự tham khảo khi xếp lịch.',
    weatherForecastTitle: 'Dự báo thời tiết theo khoảng khách yêu cầu',
    weatherForecastHint:
      'Hiển thị từng ngày trong khoảng khách chọn để nhân sự cân nhắc trước khi xếp lịch bay thực tế.',
    weatherForecastTime: (time: string) => `Mốc giờ kiểm tra: ${time}`,
    weatherNoLocation: 'Đơn chưa có toạ độ nên chưa xem được dự báo.',
    weatherNoDates: 'Đơn chưa có khoảng ngày hợp lệ để xem dự báo.',
    weatherLoading: 'Đang kiểm tra thời tiết...',
    weatherUnavailable: 'Chưa có dự báo cho ngày này.',
    weatherError: 'Không tải được dự báo.',
    weatherUnknown: 'Chưa rõ thời tiết',
    weatherRainLabel: 'Khả năng mưa',
    weatherWindLabel: 'Gió',
    weatherHumidity: (value: string) => `Độ ẩm ${value}`,
    weatherTemperatureLabel: 'Nhiệt độ',
    weatherHumidityLabel: 'Độ ẩm',
    fillFromCustomer: 'Điền theo khung giờ khách chọn',
    scheduleSummary: (from: string, to: string) =>
      `Lịch đã chọn: ${from} → ${to}`,
    weatherChecking: 'Đang kiểm tra',
    weatherNotReady: 'Chưa có dữ liệu',
    weatherSuitability: {
      GOOD: 'Thuận lợi',
      CAUTION: 'Cân nhắc',
      POOR: 'Không thuận lợi',
    } as Record<string, string>,
    flightSchedule: 'Lịch bay thực tế do nhân sự chọn',
    flightScheduleHint:
      'Chọn giờ bay cụ thể cho nhiệm vụ. Hệ thống không tự lấy thời gian từ đơn hàng.',
    start: 'Giờ cất cánh',
    end: 'Giờ kết thúc dự kiến',
    flightPlan: 'Kế hoạch bay',
    planTypeLabel: 'Kiểu bay',
    radius: 'Bán kính (m)',
    altitude: 'Độ cao (m)',
    speed: 'Tốc độ (m/s)',
    estimatedDuration: (mins: number, tPath: number, tCapture: number) =>
      `Ước tính thời lượng: ${mins} phút (bay ${tPath}s · chụp ${tCapture}s)`,
    pathPreviewAria: 'Xem trước đường bay',
    waypoint: (count: number) => `Điểm bay (${count})`,
    addWaypoint: 'Thêm điểm bay',
    removeWaypointAria: (seq: number) => `Xoá điểm bay ${seq}`,
    createMission: 'Tạo nhiệm vụ',
    weatherCheckTitle: 'Kiểm tra thời tiết theo lịch bay',
    weatherCheckHint:
      'Chọn một ngày và giờ bất kỳ để kiểm tra trước khi quyết định lịch bay.',
    weatherCheckDate: 'Ngày muốn kiểm tra',
    weatherCheckTime: 'Giờ muốn kiểm tra',
  },
  en: {
    pageSubtitle:
      'Pick the actual flight time, then continue to resource assignment',
    orderSummary: 'Order summary',
    serviceLabel: 'Service',
    customerLabel: 'Customer',
    locationLabel: 'Location',
    radiusLabel: 'Monitoring radius',
    mediaLabel: 'Media requirements',
    durationLabel: (text: string) => `Estimated duration: ${text}`,
    durationHours: (h: number, m: number) =>
      h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`,
    actionHint:
      'After the mission is created, the system moves to Assign resources to choose staff and devices.',
    backToOrders: 'Back to orders',
    creating: 'Creating mission…',
    loading: 'Loading…',
    loadError: 'Could not load the order to create a mission',
    backToQueue: 'Back to queue',
    planFailedTitle: 'Could not generate a flight plan',
    planFailedBody:
      'The flight-path service returned an error for this area. You can enter waypoints manually.',
    retry: 'Retry',
    manualWaypointEntry: 'Enter waypoints manually',
    validationRequired: 'Start/end time is required.',
    validationInvalidRange: 'Finish time must be after takeoff time.',
    planGenerationFailed:
      'The flight-path service returned an error for this area. You can enter waypoints manually.',
    createFailed: 'Could not create the mission, try again.',
    title: 'Create mission',
    fromOrder: (code: string, service: string, customer: string) =>
      `From order ${code} · ${service} · ${customer}`,
    customerTimeWindow: 'Customer requested window',
    customerDeadlineValue: (date: string, timeName: string) =>
      `${date} · ${timeName}`,
    customerTimeWindowHint:
      'This is the customer deadline/requested window, shown only as planning context for staff.',
    weatherForecastTitle: 'Weather forecast for the requested window',
    weatherForecastHint:
      'Shows every day in the customer-selected range so staff can choose the actual flight schedule.',
    weatherForecastTime: (time: string) => `Check time: ${time}`,
    weatherNoLocation:
      'This order has no coordinates, so forecast is unavailable.',
    weatherNoDates: 'This order has no valid date range for forecast.',
    weatherLoading: 'Checking weather...',
    weatherUnavailable: 'No forecast for this date yet.',
    weatherError: 'Could not load forecast.',
    weatherUnknown: 'Unknown weather',
    weatherRainLabel: 'Chance of rain',
    weatherWindLabel: 'Wind',
    weatherHumidity: (value: string) => `Humidity ${value}`,
    weatherTemperatureLabel: 'Temperature',
    weatherHumidityLabel: 'Humidity',
    fillFromCustomer: "Fill from the customer's time slot",
    scheduleSummary: (from: string, to: string) =>
      `Selected schedule: ${from} → ${to}`,
    weatherChecking: 'Checking',
    weatherNotReady: 'No data',
    weatherSuitability: {
      GOOD: 'Good',
      CAUTION: 'Caution',
      POOR: 'Poor',
    } as Record<string, string>,
    flightSchedule: 'Actual flight schedule selected by staff',
    flightScheduleHint:
      'Choose the concrete mission flight time. The system does not copy the order time automatically.',
    start: 'Takeoff time',
    end: 'Estimated finish time',
    flightPlan: 'Kế hoạch bay',
    planTypeLabel: 'Flight pattern',
    radius: 'Radius (m)',
    altitude: 'Altitude (m)',
    speed: 'Speed (m/s)',
    estimatedDuration: (mins: number, tPath: number, tCapture: number) =>
      `Estimated duration: ${mins} min (T_path ${tPath}s · T_capture ${tCapture}s)`,
    pathPreviewAria: 'Flight path preview',
    waypoint: (count: number) => `Waypoints (${count})`,
    addWaypoint: 'Add waypoint',
    removeWaypointAria: (seq: number) => `Remove waypoint ${seq}`,
    createMission: 'Create mission',
    weatherCheckTitle: 'Check weather for the flight schedule',
    weatherCheckHint:
      'Pick any date and time to check before deciding the flight schedule.',
    weatherCheckDate: 'Date to check',
    weatherCheckTime: 'Time to check',
  },
})
