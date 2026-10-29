import { defineMessages } from '../../../../shared/i18n'

export const missionResultActionsMessages = defineMessages({
  vi: {
    sectionLabel: 'Nghiệm thu và gửi kết quả',
    accepted: 'Mission đã được nghiệm thu.',
    pendingAcceptance: 'Mission đang chờ nghiệm thu.',
    approvedNote: 'Kết quả đã được Manager duyệt.',
    sentNote: 'Kết quả đã được gửi Manager và đang chờ duyệt.',
    approvedTag: 'Đã duyệt',
    waitingTag: 'Chờ duyệt',
    complete: 'Xác nhận hoàn thành Mission',
    submit: 'Gửi kết quả cho Manager',
    needComplete: 'Cần xác nhận hoàn thành Mission trước khi gửi kết quả.',
    busy: 'Đang xử lý…',
    confirming: 'Đang xác nhận checklist và quyền thao tác.',
    remaining: (n: number) => `Còn ${n} mục checklist chưa hoàn tất.`,
    needReason: 'Cần bổ sung lý do cho mục không thể xác minh.',
    integrity:
      'Checklist chưa được xác nhận. Vui lòng làm mới và kiểm tra lại.',
    mediaRejected:
      'Có media bằng chứng bị từ chối. Cần bổ sung bằng chứng hợp lệ.',
    mediaNotValidated: 'Media bằng chứng chưa xác thực thành công.',
    notReady:
      'Checklist chưa sẵn sàng hoặc chưa đủ bằng chứng hợp lệ. Kiểm tra các mục và media đã gắn.',
    err401: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    err403: 'Bạn không có quyền thực hiện thao tác này.',
    errStatus:
      'Trạng thái Mission đã thay đổi. Dữ liệu mới đang được cập nhật.',
    errLocked:
      'Kết quả đã được gửi hoặc duyệt. Dữ liệu mới đang được cập nhật.',
    errEvidenceType:
      'Một hoặc nhiều mục có media sai loại. Thay bằng đúng loại ảnh/video theo yêu cầu của từng mục.',
    errEvidenceCount:
      'Chưa đủ bằng chứng hợp lệ theo số lượng yêu cầu. Kiểm tra tiến độ từng mục và bổ sung phần còn thiếu.',
    errChecklist: 'Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.',
    errGeneric:
      'Không thể thực hiện thao tác. Dữ liệu mới đang được cập nhật; vui lòng kiểm tra và thử lại.',
  },
  en: {
    sectionLabel: 'Acceptance and result submission',
    accepted: 'The mission has been accepted.',
    pendingAcceptance: 'The mission is awaiting acceptance.',
    approvedNote: 'The result was approved by the Manager.',
    sentNote: 'The result was sent to the Manager and awaits approval.',
    approvedTag: 'Approved',
    waitingTag: 'Awaiting approval',
    complete: 'Confirm mission completion',
    submit: 'Submit result to Manager',
    needComplete: 'Confirm mission completion before submitting the result.',
    busy: 'Processing…',
    confirming: 'Confirming the checklist and your permissions.',
    remaining: (n: number) => `${n} checklist item(s) still incomplete.`,
    needReason: 'Add a reason for the item that cannot be verified.',
    integrity: 'The checklist is not confirmed. Refresh and check again.',
    mediaRejected: 'Some evidence media was rejected. Add valid evidence.',
    mediaNotValidated: 'Evidence media has not been validated yet.',
    notReady:
      'The checklist is not ready or lacks valid evidence. Review the items and attached media.',
    err401: 'Your session expired. Please sign in again.',
    err403: 'You are not allowed to do this.',
    errStatus: 'The mission status changed. Fresh data is loading.',
    errLocked:
      'The result was already submitted or approved. Fresh data is loading.',
    errEvidenceType:
      'One or more items have media of the wrong type. Replace it with the photo/video type each item requires.',
    errEvidenceCount:
      'Not enough valid evidence for the required count. Check each item and add what is missing.',
    errChecklist: 'The checklist is incomplete or lacks valid evidence.',
    errGeneric:
      'Could not complete the action. Fresh data is loading; please check and try again.',
  },
})
