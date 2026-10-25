import { defineMessages } from '../../../../shared/i18n'

export const maintenancePageMessages = defineMessages({
  vi: {
    headerTitle: 'Bảo trì & Khôi phục thiết bị',
    headerSubtitle:
      'Quản lý Ticket sự cố được phân công, cập nhật báo cáo khắc phục và chuyển trạng thái thiết bị về AVAILABLE.',
    needsAction: 'Cần xử lý',
    totalTickets: 'Tổng Ticket',
    close: 'Đóng',
    tabMine: (count: number) => `Đã gán cho tôi (${count})`,
    tabAllActive: (count: number) => `Tất cả Ticket đang mở (${count})`,
    tabResolved: (count: number) => `Đã hoàn tất (${count})`,
    emptyTitle: 'Không có ticket bảo trì',
    emptyBody:
      'Toàn bộ thiết bị đang hoạt động bình thường hoặc chưa có công việc được phân công.',
    defaultIssue: 'Sự cố kỹ thuật',
    droneLabel: 'Thiết bị:',
    technicianLabel: 'Kỹ thuật viên:',
    unassigned: 'Chưa phân công',
    reportLabel: 'Báo cáo:',
    resolved: 'Đã xử lý xong',
    updateAndRestore: 'Cập nhật & Khôi phục thiết bị',
    notesRequiredError: 'Vui lòng nhập chi tiết công việc sửa chữa/khắc phục.',
    resolveSuccess: (ticketCode: string, deviceId: string, status: string) =>
      `Đã hoàn tất bảo trì cho Ticket ${ticketCode}. Thiết bị ${deviceId} đã chuyển về ${status}!`,
    resolveFailed: 'Không thể lưu thông tin bảo trì',
    modalTitle: 'Cập nhật Báo cáo Sửa chữa',
    modalTicketPrefix: 'Ticket:',
    modalDronePrefix: 'Thiết bị:',
    notesLabel: 'Ghi chú & Chi tiết khắc phục sự cố *',
    notesPlaceholder:
      'Mô tả công việc kiểm tra, thay thế thiết bị hoặc thử nghiệm đã hoàn thành...',
    droneStatusLabel: 'Trạng thái thiết bị sau sửa chữa *',
    droneStatusOptions: {
      AVAILABLE: 'AVAILABLE — Sẵn sàng làm nhiệm vụ bay',
      IDLE_CHARGING: 'IDLE_CHARGING — Đưa vào trạm sạc pin',
      MAINTENANCE: 'MAINTENANCE — Tiếp tục bảo trì',
    },
    cancel: 'Hủy',
    processing: 'Đang xử lý...',
    confirmRestore: 'Xác nhận khôi phục thiết bị',
  },
  en: {
    headerTitle: 'Maintenance & Device Recovery',
    headerSubtitle:
      'Manage assigned incident tickets, update repair reports, and move the device back to AVAILABLE.',
    needsAction: 'Needs action',
    totalTickets: 'Total tickets',
    close: 'Close',
    tabMine: (count: number) => `Assigned to me (${count})`,
    tabAllActive: (count: number) => `All open tickets (${count})`,
    tabResolved: (count: number) => `Resolved (${count})`,
    emptyTitle: 'No maintenance tickets',
    emptyBody:
      'All devices are operating normally, or no work has been assigned yet.',
    defaultIssue: 'Technical issue',
    droneLabel: 'Device:',
    technicianLabel: 'Technician:',
    unassigned: 'Unassigned',
    reportLabel: 'Report:',
    resolved: 'Resolved',
    updateAndRestore: 'Update & restore device',
    notesRequiredError: 'Please enter details of the repair/fix work.',
    resolveSuccess: (ticketCode: string, deviceId: string, status: string) =>
      `Maintenance completed for ticket ${ticketCode}. Device ${deviceId} moved to ${status}!`,
    resolveFailed: 'Could not save the maintenance information',
    modalTitle: 'Update Repair Report',
    modalTicketPrefix: 'Ticket:',
    modalDronePrefix: 'Device:',
    notesLabel: 'Repair details / notes *',
    notesPlaceholder:
      'Describe the inspection, part replacement, or tests completed...',
    droneStatusLabel: 'Device status after repair *',
    droneStatusOptions: {
      AVAILABLE: 'AVAILABLE — Ready for missions',
      IDLE_CHARGING: 'IDLE_CHARGING — Move to charging station',
      MAINTENANCE: 'MAINTENANCE — Keep under maintenance',
    },
    cancel: 'Cancel',
    processing: 'Processing...',
    confirmRestore: 'Confirm device restore',
  },
})
