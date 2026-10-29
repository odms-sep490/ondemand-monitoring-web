import { defineMessages } from '../../../../shared/i18n'

export const managerOverviewMessages = defineMessages({
  vi: {
    title: 'Tổng quan vận hành',
    managerLine: 'Manager',
    stats: {
      operatorsOnline: 'Người vận hành trực tuyến',
      activeFlights: 'Đang bay',
      pendingApprovals: 'Chờ phê duyệt',
      missionsToday: 'Nhiệm vụ hôm nay',
    },
    pendingApprovalsAction: 'Chờ phê duyệt — cần hành động',
    submitted: (time: string) => `Đã gửi ${time}`,
    reject: 'Từ chối',
    approve: 'Phê duyệt',
    missionScheduleToday: 'Lịch trình nhiệm vụ — hôm nay',
    tableHeaders: {
      time: 'Giờ',
      mission: 'Nhiệm vụ',
      operator: 'Operator',
      status: 'Trạng thái',
    },
    unassigned: 'Chưa phân công',
    scheduleState: {
      in_flight: 'Đang bay',
      preflight: 'Trước bay',
      scheduled: 'Đã lên lịch',
    },
    teamStatus: 'Trạng thái đội ngũ',
    teamState: {
      active: 'Đang thực hiện nhiệm vụ',
      available: 'Sẵn sàng',
      preflight: 'Trước bay',
      offline: 'Ngoại tuyến',
    },
  },
  en: {
    title: 'Operations overview',
    managerLine: 'Manager',
    stats: {
      operatorsOnline: 'Operators online',
      activeFlights: 'Active flights',
      pendingApprovals: 'Pending approvals',
      missionsToday: 'Missions today',
    },
    pendingApprovalsAction: 'Pending approvals — action required',
    submitted: (time: string) => `Submitted ${time}`,
    reject: 'Reject',
    approve: 'Approve',
    missionScheduleToday: 'Mission schedule — today',
    tableHeaders: {
      time: 'Time',
      mission: 'Mission',
      operator: 'Operator',
      status: 'Status',
    },
    unassigned: 'Unassigned',
    scheduleState: {
      in_flight: 'In flight',
      preflight: 'Pre-flight',
      scheduled: 'Scheduled',
    },
    teamStatus: 'Team status',
    teamState: {
      active: 'In mission',
      available: 'Available',
      preflight: 'Pre-flight',
      offline: 'Offline',
    },
  },
})
