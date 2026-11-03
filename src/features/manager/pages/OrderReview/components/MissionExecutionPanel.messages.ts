import { defineMessages } from '../../../../../shared/i18n'

export const missionExecutionPanelMessages = defineMessages({
  vi: {
    execution: (code: string) => `Theo dõi thực hiện ${code}`,
    missionSummary: (code: string) => `Tiến độ thực hiện Mission ${code}`,
    executionProgress: 'Theo dõi tiến độ thực hiện',
    device: 'Thiết bị',
    deviceAssignedCount: (count: number) => `${count} thiết bị được phân công`,
    deviceStatusUnavailable: 'Chưa có dữ liệu trạng thái',
    staff: 'Nhân sự phụ trách',
    staffProgress: (accepted: number, total: number) =>
      `${accepted}/${total} nhân sự đã xác nhận`,
    notAssigned: 'Chưa được phân công',
    unknownStaff: 'Chưa có tên nhân sự',
    openMission: 'Mở chi tiết Mission',
  },
  en: {
    execution: (code: string) => `Track execution ${code}`,
    missionSummary: (code: string) => `Mission ${code} execution progress`,
    executionProgress: 'Execution progress',
    device: 'Equipment',
    deviceAssignedCount: (count: number) =>
      `${count} ${count === 1 ? 'device' : 'devices'} assigned`,
    deviceStatusUnavailable: 'Status unavailable',
    staff: 'Assigned staff',
    staffProgress: (accepted: number, total: number) =>
      `${accepted}/${total} staff confirmed`,
    notAssigned: 'Not assigned',
    unknownStaff: 'Staff name unavailable',
    openMission: 'Open Mission details',
  },
})
