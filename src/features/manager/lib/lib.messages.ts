import { defineMessages } from '../../../shared/i18n'

export const managerLibMessages = defineMessages({
  vi: {
    age: {
      orderOverdue: (hours: number, overdueHours: number) =>
        `${hours} giờ · quá ${overdueHours}h`,
      orderHours: (hours: number) => `${hours} giờ`,
      hoursMinutes: (hours: number, minutes: number) =>
        `${hours} giờ ${minutes} phút`,
      minutesOnly: (minutes: number) => `${minutes} phút`,
      late: (label: string) => `Trễ ${label}`,
      remaining: (label: string) => `Còn ${label}`,
      ticketOpen: (days: number) => `Mở ${days} ngày`,
      minutesAgo: (n: number) => `${n} phút trước`,
      hoursAgo: (n: number) => `${n} giờ trước`,
      daysAgo: (n: number) => `${n} ngày trước`,
      flyingMinutes: (n: number) => `Bay ${n} phút`,
      flyingHoursMinutes: (hours: number, minutes: number) =>
        `Bay ${hours} giờ ${minutes} phút`,
    },
    weekdays: [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ],
    ceiling: {
      noFly: (altitude: number, ceiling: number) =>
        `Độ cao ${altitude} m vượt trần cấm bay ${ceiling} m.`,
      service: (altitude: number, ceiling: number) =>
        `Độ cao ${altitude} m vượt trần khai thác thông thường ${ceiling} m.`,
    },
    readiness: {
      missingStaff: 'Thiếu nhân sự',
      noDevice: 'Chưa gán thiết bị',
      awaitingConfirm: 'Chờ xác nhận phân công',
      assigned: 'Đã phân công nguồn lực',
    },
    timeslots: {
      MORNING: 'Buổi sáng',
      AFTERNOON: 'Buổi chiều',
      EVENING: 'Buổi tối',
      NIGHT: 'Ban đêm',
    } as Record<string, string>,
    mediaTypes: {
      IMAGE: 'Ảnh',
      PHOTO: 'Ảnh',
      VIDEO: 'Video',
      LIVESTREAM: 'Phát trực tiếp',
      STREAMING: 'Phát trực tiếp',
      THERMAL: 'Ảnh nhiệt',
    } as Record<string, string>,
    ticket: {
      issueTypes: {
        MOTOR_VIBRATION: 'Rung động cơ',
        PROPELLER_REPLACE: 'Thay cánh quạt',
        BATTERY_SWELL: 'Pin phồng',
        BATTERY_DEGRADED: 'Pin suy giảm',
        GIMBAL_CALIBRATION: 'Hiệu chuẩn gimbal',
        CAMERA_GIMBAL: 'Camera / gimbal',
        CAMERA_LENS_SCRATCH: 'Xước kính camera',
        IMU_DRIFT: 'Lệch cảm biến IMU',
        SIGNAL_LOSS: 'Mất tín hiệu',
        PHYSICAL_DAMAGE: 'Hư hỏng vật lý',
        OTHER: 'Khác',
      } as Record<string, string>,
      statusWords: {
        MAINTENANCE: 'bảo trì',
        OUT_OF_SERVICE: 'ngừng hoạt động',
        AVAILABLE: 'sẵn sàng',
        OFFLINE: 'ngoại tuyến',
      } as Record<string, string>,
      inspection: {
        a1: 'Thân máy',
        a2: 'Càng/khung',
        p1: 'Động cơ',
        p2: 'Cánh quạt',
        e1: 'Pin',
        e2: 'Camera',
        e3: 'GPS',
        e4: 'Pin hạ cánh',
        d1: 'Liên lạc',
      } as Record<string, string>,
      title: (device: string) => `Bảo trì sau bay – ${device}`,
      deviceNeeds: (device: string) =>
        `Thiết bị ${device} cần được bảo trì sau chuyến bay.`,
      needs: 'Cần bảo trì sau chuyến bay.',
      failed: (items: string) => `Hạng mục không đạt: ${items}.`,
      passed: (items: string) => `Hạng mục đạt: ${items}.`,
      note: (note: string) => `Ghi chú: ${note}`,
    },
    planning: {
      blockers: {
        ORDER_NOT_APPROVED: 'Đơn hàng chưa ở trạng thái cho phép chốt kế hoạch.',
        INVOICE_NOT_PAYABLE:
          'Khách hàng cần chấp nhận báo giá trước khi tạo nhiệm vụ.',
        FINAL_PAYMENT_REQUIRED:
          'Khách hàng cần thanh toán đủ trước khi nhận bản gốc.',
        DELIVERABLE_NOT_RELEASED: 'Bản gốc chưa được bàn giao cho khách hàng.',
        NO_EFFECTIVE_MISSIONS:
          'Thêm ít nhất một nhiệm vụ vào kế hoạch trước khi chốt.',
        CHECKLIST_ASSIGNMENT_NOT_FINALIZED:
          'Phân công danh mục kiểm tra chưa được chốt.',
        CHECKLIST_EXECUTION_INTEGRITY_INVALID:
          'Phân công danh mục kiểm tra cần được kiểm tra lại trước khi chốt.',
        MULTI_MISSION_LEGACY_ORDER_NOT_MIGRATED:
          'Kế hoạch cũ cần được kiểm tra trước khi tiếp tục.',
        INVALID_REQUEST:
          'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
        ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
        UNAUTHORIZED: 'Vui lòng đăng nhập lại để tiếp tục.',
        EXECUTION_PLAN_REVISION_CONFLICT:
          'Kế hoạch đã được thay đổi ở phiên bản khác. Vui lòng tải lại dữ liệu.',
        CHECKLIST_COVERAGE_INCOMPLETE:
          'Còn danh mục kiểm tra chưa được phân công. Kiểm tra các yêu cầu trước khi chốt kế hoạch.',
        MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
          'Nhiệm vụ chưa đủ điều kiện hủy. Cần hoàn tất xác nhận an toàn và đóng phiên vận hành trước khi hủy.',
        MISSION_SAFE_STOP_NOT_READY:
          'Nhiệm vụ chưa ở trạng thái an toàn để tiếp tục. Làm mới trạng thái hoặc chờ nhân sự vận hành.',
        MISSION_SAFE_STOP_FAILED:
          'Dừng an toàn chưa hoàn tất. Làm mới trạng thái và liên hệ nhân sự vận hành.',
        MISSION_RESULT_ALREADY_APPROVED:
          'Kết quả đã được duyệt; không thể hủy lịch sử nhiệm vụ này.',
        RESOURCE_TIME_CONFLICT:
          'Tài nguyên bị trùng lịch. Chọn tài nguyên hoặc thời gian khác và tải lại danh sách khả dụng.',
        RESOURCE_ALREADY_RESERVED:
          'Tài nguyên đã được giữ. Tải lại danh sách khả dụng và chọn tài nguyên khác.',
        SCHEDULE_CONFLICT:
          'Lịch tài nguyên xung đột. Tải lại danh sách khả dụng và chọn lịch khác.',
        EXECUTION_PLAN_NOT_DRAFT:
          'Kế hoạch/nhiệm vụ đã chốt. Cần điều chỉnh kế hoạch trước khi tiếp tục lập kế hoạch.',
      } as Record<string, string>,
      fallback:
        'Chưa thể thực hiện thao tác. Vui lòng tải lại dữ liệu hoặc liên hệ hỗ trợ.',
      finalizeFailed: 'Không thể chốt kế hoạch. Vui lòng thử lại.',
      offline: 'Không thể kết nối. Giữ nguyên dữ liệu và thử lại sau.',
    },
    api: {
      itemsUnit: ' mục',
      unknownSize: 'Không rõ dung lượng',
      orderNotApproved: 'Đơn không còn ở trạng thái đã duyệt.',
      mediaNotFound: 'Không tìm thấy ảnh/video.',
    },
  },
  en: {
    age: {
      orderOverdue: (hours: number, overdueHours: number) =>
        `${hours}h · over ${overdueHours}h`,
      orderHours: (hours: number) => `${hours}h`,
      hoursMinutes: (hours: number, minutes: number) =>
        `${hours}h ${minutes}m`,
      minutesOnly: (minutes: number) => `${minutes}m`,
      late: (label: string) => `${label} late`,
      remaining: (label: string) => `In ${label}`,
      ticketOpen: (days: number) => `Open ${days} days`,
      minutesAgo: (n: number) => `${n} min ago`,
      hoursAgo: (n: number) => `${n}h ago`,
      daysAgo: (n: number) => `${n}d ago`,
      flyingMinutes: (n: number) => `Flying ${n} min`,
      flyingHoursMinutes: (hours: number, minutes: number) =>
        `Flying ${hours}h ${minutes}m`,
    },
    weekdays: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    ceiling: {
      noFly: (altitude: number, ceiling: number) =>
        `Altitude ${altitude} m exceeds the no-fly ceiling ${ceiling} m.`,
      service: (altitude: number, ceiling: number) =>
        `Altitude ${altitude} m exceeds the normal operating ceiling ${ceiling} m.`,
    },
    readiness: {
      missingStaff: 'Missing staff',
      noDevice: 'No device assigned',
      awaitingConfirm: 'Awaiting assignment confirmation',
      assigned: 'Resources assigned',
    },
    timeslots: {
      MORNING: 'Morning',
      AFTERNOON: 'Afternoon',
      EVENING: 'Evening',
      NIGHT: 'Night',
    },
    mediaTypes: {
      IMAGE: 'Image',
      PHOTO: 'Image',
      VIDEO: 'Video',
      LIVESTREAM: 'Live stream',
      STREAMING: 'Live stream',
      THERMAL: 'Thermal image',
    },
    ticket: {
      issueTypes: {
        MOTOR_VIBRATION: 'Motor vibration',
        PROPELLER_REPLACE: 'Propeller replacement',
        BATTERY_SWELL: 'Swollen battery',
        BATTERY_DEGRADED: 'Degraded battery',
        GIMBAL_CALIBRATION: 'Gimbal calibration',
        CAMERA_GIMBAL: 'Camera / gimbal',
        CAMERA_LENS_SCRATCH: 'Scratched camera lens',
        IMU_DRIFT: 'IMU drift',
        SIGNAL_LOSS: 'Signal loss',
        PHYSICAL_DAMAGE: 'Physical damage',
        OTHER: 'Other',
      } as Record<string, string>,
      statusWords: {
        MAINTENANCE: 'maintenance',
        OUT_OF_SERVICE: 'out of service',
        AVAILABLE: 'available',
        OFFLINE: 'offline',
      } as Record<string, string>,
      inspection: {
        a1: 'Airframe',
        a2: 'Landing gear/frame',
        p1: 'Motors',
        p2: 'Propellers',
        e1: 'Battery',
        e2: 'Camera',
        e3: 'GPS',
        e4: 'Landing battery',
        d1: 'Communication',
      },
      title: (device: string) => `Post-flight maintenance – ${device}`,
      deviceNeeds: (device: string) =>
        `Device ${device} needs post-flight maintenance.`,
      needs: 'Post-flight maintenance required.',
      failed: (items: string) => `Failed items: ${items}.`,
      passed: (items: string) => `Passed items: ${items}.`,
      note: (note: string) => `Note: ${note}`,
    },
    planning: {
      blockers: {
        ORDER_NOT_APPROVED: 'The order is not in a state that allows finalizing the plan.',
        INVOICE_NOT_PAYABLE:
          'The customer must accept the quote before a Mission can be created.',
        FINAL_PAYMENT_REQUIRED:
          'The customer must pay in full before receiving the original files.',
        DELIVERABLE_NOT_RELEASED:
          'The original files have not been handed over to the customer.',
        NO_EFFECTIVE_MISSIONS:
          'Add at least one Mission to the plan before finalizing.',
        CHECKLIST_ASSIGNMENT_NOT_FINALIZED:
          'The checklist assignment has not been finalized.',
        CHECKLIST_EXECUTION_INTEGRITY_INVALID:
          'The checklist assignment needs to be rechecked before finalizing.',
        MULTI_MISSION_LEGACY_ORDER_NOT_MIGRATED:
          'The legacy plan needs to be reviewed before continuing.',
        INVALID_REQUEST: 'The information is invalid. Please check and try again.',
        ACCESS_DENIED: 'You do not have permission to perform this action.',
        UNAUTHORIZED: 'Please sign in again to continue.',
        EXECUTION_PLAN_REVISION_CONFLICT:
          'The plan was changed in another session. Please reload the data.',
        CHECKLIST_COVERAGE_INCOMPLETE:
          'Some checklists are not assigned yet. Review the requirements before finalizing the plan.',
        MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
          'The Mission cannot be cancelled yet. Complete the safety confirmation and close the operation session before cancelling.',
        MISSION_SAFE_STOP_NOT_READY:
          'The Mission is not in a safe state to continue. Refresh the status or wait for the operations crew.',
        MISSION_SAFE_STOP_FAILED:
          'Safe stop did not complete. Refresh the status and contact the operations crew.',
        MISSION_RESULT_ALREADY_APPROVED:
          'The result has already been approved; this Mission history cannot be cancelled.',
        RESOURCE_TIME_CONFLICT:
          'The resource has a scheduling conflict. Choose another resource or time and reload the available list.',
        RESOURCE_ALREADY_RESERVED:
          'The resource is already reserved. Reload the available list and choose another resource.',
        SCHEDULE_CONFLICT:
          'The resource schedule conflicts. Reload the available list and choose another slot.',
        EXECUTION_PLAN_NOT_DRAFT:
          'The plan/Mission is finalized. Adjust the plan before continuing to plan.',
      },
      fallback:
        'The action could not be completed. Please reload the data or contact support.',
      finalizeFailed: 'Could not finalize the plan. Please try again.',
      offline: 'Cannot connect. Your data is kept; try again later.',
    },
    api: {
      itemsUnit: ' items',
      unknownSize: 'Unknown size',
      orderNotApproved: 'The order is no longer in the approved state.',
      mediaNotFound: 'Media not found.',
    },
  },
})
