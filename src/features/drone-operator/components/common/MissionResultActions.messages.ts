import { defineMessages } from '../../../../shared/i18n'
export const missionResultActionsMessages = defineMessages({
  vi: {
    verifying: 'Đang xác nhận checklist và quyền thao tác.',
    remaining: (count: number) => `Còn ${count} mục checklist chưa hoàn tất.`,
    unableReason: 'Cần bổ sung lý do cho mục không thể xác minh.',
    integrity:
      'Checklist chưa được xác nhận. Vui lòng làm mới và kiểm tra lại.',
    rejectedMedia:
      'Có media bằng chứng bị từ chối. Cần bổ sung bằng chứng hợp lệ.',
    unvalidated: 'Media bằng chứng chưa xác thực thành công.',
    notReady:
      'Cần nghiệm thu đạt yêu cầu và chọn đủ media gửi khách hàng cho từng mục checklist.',
    awaiting: 'Hồ sơ đang chờ xác nhận nghiệm thu.',
    completed: 'Mission đã hoàn thành.',
    afterFlight:
      'Kiểm tra sau bay đã hoàn tất. Xác nhận hoàn thành để tiếp tục nghiệm thu.',
    review:
      'Rà soát nghiệm thu và chọn đủ media gửi khách hàng trước khi xác nhận.',
    waiting: 'Kiểm tra sau bay đã hoàn tất, nhiệm vụ đang chờ nghiệm thu.',
    confirmed: 'Kết quả đã được xác nhận nghiệm thu.',
    automaticPublication:
      'Hệ thống tự gửi kết quả của nhiệm vụ này ngay sau khi bạn xác nhận nghiệm thu.',
    approved: 'Đã nghiệm thu',
    pending: 'Chờ nghiệm thu',
    complete: 'Xác nhận hoàn thành Mission',
    confirm: 'Xác nhận nghiệm thu',
    busy: 'Đang xử lý…',
    section: 'Nghiệm thu kết quả',
    completeFirst: 'Cần hoàn thành Mission trước khi xác nhận nghiệm thu.',
  },
  en: {
    verifying: 'Checking checklist data and permissions.',
    remaining: (count: number) => `${count} checklist item(s) are incomplete.`,
    unableReason: 'Provide a reason for items that cannot be verified.',
    integrity:
      'The checklist is not confirmed. Reload and review the latest data.',
    rejectedMedia: 'Some evidence was rejected. Add eligible evidence.',
    unvalidated: 'Evidence validation is incomplete.',
    notReady:
      'Accept the work and select the required customer media for every checklist item.',
    awaiting: 'The result is awaiting inspection confirmation.',
    completed: 'Mission completed.',
    afterFlight:
      'Postcheck is complete. Confirm mission completion to continue inspection.',
    review:
      'Review the work and select the required customer media before confirming inspection.',
    waiting: 'Postcheck is complete. The mission is awaiting inspection.',
    confirmed: 'Inspection confirmed for this mission.',
    automaticPublication:
      'Results are sent automatically after this mission is confirmed by the inspector.',
    approved: 'Inspection confirmed',
    pending: 'Awaiting inspection',
    complete: 'Confirm mission completion',
    confirm: 'Confirm inspection',
    busy: 'Processing…',
    section: 'Result inspection',
    completeFirst: 'Complete the mission before confirming inspection.',
  },
})
