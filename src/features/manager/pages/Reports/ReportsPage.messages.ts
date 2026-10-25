import { defineMessages } from '../../../../shared/i18n'

export const reportsPageMessages = defineMessages({
  vi: {
    pageTitle: 'Báo cáo vận hành',
    pageSubtitle: 'Số liệu tổng hợp từ mission, đơn hàng và đội drone',
    loadError: 'Không tạo được báo cáo',
    emptyTitle: 'Không có dữ liệu trong khoảng đã chọn',
    emptyDescription:
      'Hãy mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc dịch vụ, drone, phi công.',
    filters: {
      period: 'Khoảng thời gian',
      periodOptions: [
        '8 tuần gần nhất',
        '30 ngày qua',
        'Quý 3/2026',
        'Tuỳ chọn...',
      ],
      service: 'Dịch vụ',
      allServices: 'Tất cả dịch vụ',
      drone: 'Drone',
      allDrones: 'Tất cả drone',
      pilot: 'Phi công',
      allPilots: 'Tất cả phi công',
      reset: 'Đặt lại',
      exportCsv: 'Xuất CSV',
    },
    csvHeaders: ['Tuần', 'Tỉ lệ thành công (%)', 'TB duyệt đơn (h)'],
    csvFilenamePrefix: 'bao-cao-van-hanh',
    kpis: {
      successRate: 'Tỉ lệ mission thành công',
      successRateSub: (delta: number) => `+${delta} điểm so với kỳ trước`,
      missionsFlown: 'Mission đã bay',
      missionsFlownSub: (completed: number, failed: number) =>
        `${completed} COMPLETED · ${failed} FAILED`,
      avgApprovalTime: 'Thời gian duyệt đơn TB',
      avgApprovalTimeValue: (hours: number) => `${hours} giờ`,
      avgApprovalTimeSub: (deltaHours: number, weekLabel: string) =>
        `${deltaHours} giờ so với ${weekLabel}`,
      avgFleetUtilization: 'Utilization TB toàn đội',
    },
    charts: {
      successRateByWeek: 'Tỉ lệ mission thành công theo tuần',
      successRateFootnote:
        'COMPLETED / (COMPLETED + FAILED) theo mission.scheduled_start',
      serviceDistribution: 'Phân bổ đơn theo dịch vụ',
      droneUtilization: 'Utilization từng drone',
      droneUtilizationFootnote: 'Giờ bay / giờ khả dụng trong kỳ',
      avgApprovalTime: 'Thời gian duyệt đơn trung bình',
      avgApprovalTimeFootnote:
        'order_approval.decided_at − order.submitted_at (giờ)',
      topFailureReasons: 'Top lý do thất bại',
      topFailureReasonsFootnote: (failedMissions: number) =>
        `mission.failure_reason · ${failedMissions} mission FAILED trong kỳ`,
      donutUnit: 'đơn',
    },
  },
  en: {
    pageTitle: 'Operations reports',
    pageSubtitle:
      'Aggregated figures from missions, orders, and the drone fleet',
    loadError: 'Could not generate the report',
    emptyTitle: 'No data in the selected range',
    emptyDescription:
      'Widen the time range, or remove some of the service, drone, or pilot filters.',
    filters: {
      period: 'Time range',
      periodOptions: ['Last 8 weeks', 'Last 30 days', 'Q3 2026', 'Custom...'],
      service: 'Service',
      allServices: 'All services',
      drone: 'Drone',
      allDrones: 'All drones',
      pilot: 'Pilot',
      allPilots: 'All pilots',
      reset: 'Reset',
      exportCsv: 'Export CSV',
    },
    csvHeaders: ['Week', 'Success rate (%)', 'Avg approval time (h)'],
    csvFilenamePrefix: 'operations-report',
    kpis: {
      successRate: 'Mission success rate',
      successRateSub: (delta: number) => `+${delta} points vs. previous period`,
      missionsFlown: 'Missions flown',
      missionsFlownSub: (completed: number, failed: number) =>
        `${completed} COMPLETED · ${failed} FAILED`,
      avgApprovalTime: 'Avg order approval time',
      avgApprovalTimeValue: (hours: number) => `${hours}h`,
      avgApprovalTimeSub: (deltaHours: number, weekLabel: string) =>
        `${deltaHours}h vs. ${weekLabel}`,
      avgFleetUtilization: 'Avg fleet utilization',
    },
    charts: {
      successRateByWeek: 'Mission success rate by week',
      successRateFootnote:
        'COMPLETED / (COMPLETED + FAILED) by mission.scheduled_start',
      serviceDistribution: 'Orders by service',
      droneUtilization: 'Utilization per drone',
      droneUtilizationFootnote: 'Flight hours / available hours in period',
      avgApprovalTime: 'Average order approval time',
      avgApprovalTimeFootnote:
        'order_approval.decided_at − order.submitted_at (hours)',
      topFailureReasons: 'Top failure reasons',
      topFailureReasonsFootnote: (failedMissions: number) =>
        `mission.failure_reason · ${failedMissions} FAILED missions in period`,
      donutUnit: 'orders',
    },
  },
})
