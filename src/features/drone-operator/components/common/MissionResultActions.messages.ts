import { defineMessages } from '../../../../shared/i18n'
export const missionResultActionsMessages = defineMessages({
  vi: {
    verifying: 'Đang xác nhận danh mục kiểm tra và quyền thao tác.',
    remaining: (count: number) => `Còn ${count} mục danh mục kiểm tra chưa hoàn tất.`,
    unableReason: 'Cần bổ sung lý do cho mục không thể xác minh.',
    integrity:
      'Danh mục kiểm tra chưa được xác nhận. Vui lòng làm mới và kiểm tra lại.',
    rejectedMedia:
      'Có ảnh/video bằng chứng bị từ chối. Cần bổ sung bằng chứng hợp lệ.',
    unvalidated: 'Ảnh/video bằng chứng chưa xác thực thành công.',
    notReady:
      'Cần nghiệm thu đạt yêu cầu và chọn đủ ảnh/video gửi khách hàng cho từng mục checklist.',
    awaiting: 'Hồ sơ đang chờ xác nhận nghiệm thu.',
    completed: 'Nhiệm vụ đã hoàn thành.',
    afterFlight:
      'Kiểm tra sau bay đã hoàn tất. Xác nhận hoàn thành để tiếp tục nghiệm thu.',
    review:
      'Rà soát nghiệm thu và chọn đủ ảnh/video gửi khách hàng trước khi xác nhận.',
    waiting: 'Kiểm tra sau bay đã hoàn tất, nhiệm vụ đang chờ nghiệm thu.',
    confirmed: 'Kết quả đã được xác nhận nghiệm thu.',
    automaticPublication:
      'Hệ thống tự gửi kết quả của nhiệm vụ này ngay sau khi bạn xác nhận nghiệm thu.',
    approved: 'Đã nghiệm thu',
    pending: 'Chờ nghiệm thu',
    complete: 'Xác nhận hoàn thành nhiệm vụ',
    confirm: 'Xác nhận nghiệm thu',
    busy: 'Đang xử lý…',
    section: 'Nghiệm thu kết quả',
    completeFirst: 'Cần hoàn thành nhiệm vụ trước khi xác nhận nghiệm thu.',
    error401: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    error403: 'Bạn không có quyền thực hiện thao tác này.',
    errorStatusInvalid:
      'Trạng thái Mission đã thay đổi. Dữ liệu mới đang được cập nhật.',
    errorLocked:
      'Kết quả đã được gửi hoặc duyệt. Dữ liệu mới đang được cập nhật.',
    errorWrongType:
      'Một hoặc nhiều mục có media sai loại. Thay bằng đúng loại ảnh/video theo yêu cầu của từng mục.',
    errorInsufficient:
      'Chưa đủ bằng chứng hợp lệ theo số lượng yêu cầu. Kiểm tra tiến độ từng mục và bổ sung phần còn thiếu.',
    errorNotReady: 'Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.',
    errorFallback:
      'Không thể thực hiện thao tác. Dữ liệu mới đang được cập nhật; vui lòng kiểm tra và thử lại.',
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
    error401: 'Your session has expired. Please sign in again.',
    error403: 'You do not have permission to perform this action.',
    errorStatusInvalid:
      'The Mission status changed. Latest data is being refreshed.',
    errorLocked:
      'The result has already been submitted or approved. Latest data is being refreshed.',
    errorWrongType:
      'One or more items have media of the wrong type. Replace them with the required image/video type.',
    errorInsufficient:
      'Insufficient valid evidence for the required quantity. Check each item and add the missing evidence.',
    errorNotReady:
      'The checklist is incomplete or does not have enough valid evidence.',
    errorFallback:
      'Unable to complete this action. Latest data is being refreshed; please review and try again.',
  },
})
