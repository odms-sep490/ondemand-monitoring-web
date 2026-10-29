import { defineMessages } from '../../../../shared/i18n'

export const runtimePreflightCheckMessages = defineMessages({
  vi: {
    checkNames: {
      GAZEBO: 'Mô phỏng Gazebo',
      PX4: 'Bộ điều khiển bay PX4',
      MAVSDK: 'Kết nối MAVSDK',
      PX4_CONTROL: 'Điều khiển PX4',
      LOCAL_POSITION: 'Vị trí cục bộ',
      MAVSDK_HEALTH: 'Tình trạng MAVSDK',
      BATTERY: 'Pin',
      LIDAR: 'LiDAR',
      CAMERA: 'Camera hướng xuống',
      BACKEND: 'Kết nối hệ thống',
      MEDIA: 'Tải lên media',
      MODULES: 'Kiểm tra module',
    },
    pending: 'Đang chờ',
    waitingForController: 'Đang chờ API flight controller',
    backendPreflightFailed:
      'Kiểm tra trước bay ở hệ thống thất bại. Vui lòng thử lại.',
    preflightApiError: (status: number) => `API kiểm tra trước bay ${status}`,
    waitingForControllerApi:
      'Đang chờ API kiểm tra trước bay của flight controller. Bạn có thể mở Start Drone Stack bất cứ lúc nào; màn hình này sẽ tự động tiếp tục.',
    preflightStatusError: (status: number) =>
      `Trạng thái kiểm tra trước bay ${status}`,
    statusUnavailable:
      'Trạng thái kiểm tra trước bay tạm thời không khả dụng. Đang tự động kết nối lại...',
    title: 'Kiểm tra trước bay',
    description:
      'Đang tự động kiểm tra mức độ sẵn sàng của hệ thống trước khi bay.',
    statusOk: 'OK',
    statusWarn: 'CẢNH BÁO',
    statusFail: 'KHÔNG ĐẠT',
    statusChecking: 'Đang kiểm tra',
    statusPending: 'Đang chờ',
    completed: '✓ ĐÃ HOÀN TẤT KIỂM TRA TRƯỚC BAY',
    failedBanner: '× KIỂM TRA TRƯỚC BAY THẤT BẠI',
    checking: '◌ ĐANG KIỂM TRA TRƯỚC BAY',
    readyBody:
      'Tất cả hệ thống quan trọng đã sẵn sàng. Bạn có thể vào màn hình người vận hành.',
    failedBody:
      'Một hệ thống quan trọng chưa sẵn sàng. Khắc phục và thử lại các mục thất bại.',
    checkingBody:
      'Vui lòng chờ trong khi hệ thống kiểm tra toàn bộ thành phần.',
    critical: 'Bắt buộc',
    optional: 'Tùy chọn',
    retryFailedChecks: 'Thử lại các mục thất bại',
    goToOperator: '✓ OK - Vào màn hình người vận hành',
  },
  en: {
    checkNames: {
      GAZEBO: 'Gazebo Simulation',
      PX4: 'PX4 Flight Controller',
      MAVSDK: 'MAVSDK Connection',
      PX4_CONTROL: 'PX4 Control',
      LOCAL_POSITION: 'Local Position',
      MAVSDK_HEALTH: 'MAVSDK Health',
      BATTERY: 'Battery',
      LIDAR: 'LiDAR',
      CAMERA: 'Downward Camera',
      BACKEND: 'Backend Connection',
      MEDIA: 'Media Upload',
      MODULES: 'Module Check',
    },
    pending: 'Pending',
    waitingForController: 'Waiting for flight controller API',
    backendPreflightFailed: 'Backend preflight failed. Please retry.',
    preflightApiError: (status: number) => `Preflight API ${status}`,
    waitingForControllerApi:
      'Waiting for flight controller preflight API. Start Drone Stack can be opened anytime; this screen will continue automatically.',
    preflightStatusError: (status: number) => `Preflight status ${status}`,
    statusUnavailable:
      'Preflight status is temporarily unavailable. Reconnecting automatically...',
    title: 'Preflight Check',
    description: 'Automatically checking system readiness before flight.',
    statusOk: 'OK',
    statusWarn: 'WARN',
    statusFail: 'FAIL',
    statusChecking: 'Checking',
    statusPending: 'Pending',
    completed: '✓ PREFLIGHT CHECK COMPLETED',
    failedBanner: '× PREFLIGHT CHECK FAILED',
    checking: '◌ PREFLIGHT CHECKING',
    readyBody:
      'All critical systems are ready. You can enter the Drone Operator screen.',
    failedBody:
      'A critical system is not ready. Fix it and retry failed checks.',
    checkingBody: 'Please wait while the system checks all components.',
    critical: 'Critical',
    optional: 'Optional',
    retryFailedChecks: 'Retry Failed Checks',
    goToOperator: '✓ OK - Go to Drone Operator',
  },
})
