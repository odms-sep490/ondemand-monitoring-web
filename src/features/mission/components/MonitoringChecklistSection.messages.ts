import { defineMessages } from '../../../shared/i18n'

export const monitoringChecklistMessages = defineMessages({
  vi: {
    statuses: {
      PENDING: 'Chưa thực hiện',
      IN_PROGRESS: 'Đang thực hiện',
      COMPLETED: 'Đã thực hiện',
      UNABLE_TO_VERIFY: 'Không thể xác minh',
    },
    evidenceType: {
      IMAGE: 'Chỉ ảnh',
      VIDEO: 'Chỉ video',
      IMAGE_AND_VIDEO: 'Ảnh và video',
      LEGACY: 'Ảnh hoặc video (cũ)',
    },
    assessments: {
      NOT_ASSESSED: 'Chưa đánh giá',
      COMPLIANT: 'Đạt yêu cầu',
      NON_COMPLIANT: 'Không đạt yêu cầu',
    },
    resultStatuses: {
      DRAFT: 'Nháp, chưa gửi quản lý',
      PENDING_MANAGER_APPROVAL: 'Đã gửi quản lý',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Bị từ chối, có thể chỉnh sửa và gửi lại khi có quyền',
    },
    errors: {
      permissionsUnavailable:
        'Chưa xác minh được quyền thao tác. Vui lòng làm mới hoặc đăng nhập lại.',
      parentMismatch:
        'Mục checklist không thuộc nhiệm vụ này. Vui lòng tải lại đúng nhiệm vụ.',
      concurrent:
        'Dữ liệu đã thay đổi. Chỉnh sửa của bạn chưa được lưu. Tải dữ liệu mới và kiểm tra lại trước khi lưu.',
      unauthorized: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
      forbidden: 'Bạn không có quyền thực hiện thao tác này.',
      notFound: 'Không tìm thấy nhiệm vụ hoặc mục checklist. Vui lòng tải lại.',
      locked:
        'Checklist đã khóa để duyệt kết quả. Vui lòng tải lại trạng thái.',
      transitionInvalid:
        'Chuyển trạng thái không hợp lệ. Vui lòng tải lại dữ liệu.',
      missionStatusInvalid:
        'Trạng thái nhiệm vụ đã thay đổi. Vui lòng tải lại.',
      evidenceTypeNotEligible:
        'Một hoặc nhiều mục cần loại tệp khác. Chọn và gắn đúng loại ảnh/video theo yêu cầu từng mục, sau đó thử lại.',
      insufficientEvidence:
        'Chưa đủ bằng chứng hợp lệ. Kiểm tra số lượng hiện tại và yêu cầu từng mục, sau đó bổ sung phần còn thiếu.',
      notReady:
        'Checklist chưa sẵn sàng gửi kết quả. Vui lòng kiểm tra các mục còn lại.',
      conflict:
        'Dữ liệu đã thay đổi hoặc thao tác chưa đủ điều kiện. Vui lòng tải lại.',
      generic: 'Không thể tải hoặc lưu checklist. Vui lòng thử lại.',
      reasonRequired: 'Vui lòng nhập lý do không thể xác minh.',
      tooLong: 'Ghi nhận tối đa 2000 ký tự; lý do tối đa 1000 ký tự.',
    },
    ariaChecklist: 'Checklist giám sát',
    ariaResult: 'Kết quả checklist',
    compactTitle: 'Checklist nghiệm thu',
    progressTitle: 'Tiến độ hoàn tất checklist',
    doneCount: (done: number, total: number) =>
      `${done} / ${total} mục hoàn tất`,
    attachedCount: (n: number) => `${n} bằng chứng đã gắn`,
    loading: 'Đang tải checklist…',
    loadingWithResult: 'Đang tải checklist và trạng thái kết quả…',
    retry: 'Thử lại checklist',
    rejected: 'Kết quả bị từ chối',
    legacy: 'Nhiệm vụ cũ: không có bản ghi checklist giám sát lịch sử.',
    legacyLong:
      'Nhiệm vụ cũ: không có bản ghi checklist giám sát lịch sử. Không suy diễn yêu cầu từ dịch vụ hiện tại.',
    none: 'Không có mục checklist giám sát.',
    readOnlyLocked: 'Chỉ đọc: kết quả đang chờ duyệt hoặc đã được duyệt.',
    readOnlyNoPermission:
      'Chỉ đọc: bạn không có quyền cập nhật hoặc trạng thái chưa được xác minh.',
    notReadyServer:
      'Dữ liệu checklist chưa đủ điều kiện theo hệ thống. Hãy làm mới; nếu vẫn chưa sẵn sàng, liên hệ quản trị viên.',
    evidenceWord: 'bằng chứng',
    missingCount: (n: number) => `còn thiếu ${n}`,
    needExactType: 'cần đúng loại tệp',
    chipTodo: 'Cần làm',
    chipMissing: 'Thiếu bằng chứng',
    chipUnable: 'Không xác minh',
    updatedAt: (time: string) => `Cập nhật ${time}`,
    updatedAtColon: (time: string) => `Cập nhật: ${time}`,
    previewTitle: 'Checklist chưa thể cập nhật',
    previewBody:
      'Bạn đang xem trước nội dung. Sau khi chấp nhận nhiệm vụ, bạn có thể cập nhật tiến độ và bằng chứng.',
    minEvidence: 'Bằng chứng tối thiểu',
    heading: 'Kết quả checklist',
    headingHint: 'Các mục cần thực hiện và bằng chứng cho nhiệm vụ này.',
    reloadTitle: 'Lấy dữ liệu checklist mới nhất',
    reload: 'Tải lại',
    ready: 'Sẵn sàng gửi kết quả',
    notReady: 'Chưa sẵn sàng gửi kết quả',
    terminalSummary: (done: number, total: number, left: number) =>
      `${done} / ${total} mục ở trạng thái kết thúc · ${left} mục chưa hoàn tất`,
    resultStatusLabel: 'Trạng thái kết quả',
    managerNote: 'Nhận xét của quản lý',
    hintEditable: 'Bạn có thể cập nhật checklist.',
    hintLocked:
      'Checklist chưa thể cập nhật. Bạn có thể cập nhật tiến độ và bằng chứng khi nhiệm vụ bước vào giai đoạn thực hiện.',
    fieldStatus: 'Trạng thái',
    fieldAssessment: 'Đánh giá',
    fieldNote: 'Ghi chú',
    noNote: 'Chưa có ghi chú',
    unableReason: 'Lý do không thể xác minh',
    edit: 'Chỉnh sửa',
    execStatus: 'Trạng thái thực hiện',
    assessLabel: 'Đánh giá nghiệm thu',
    assessHelp: 'Đánh giá không đạt không tự động làm nhiệm vụ thất bại.',
    assessHelpLong:
      'Không đạt yêu cầu không đồng nghĩa nhiệm vụ thất bại. Chưa đánh giá là lựa chọn hợp lệ.',
    observation: 'Ghi nhận thực hiện',
    observationPlaceholder: 'Thêm ghi chú nếu cần...',
    useFresh: 'Dùng dữ liệu mới (bỏ chỉnh sửa chưa lưu)',
    cancel: 'Hủy',
    save: 'Lưu',
    observationShort: 'Ghi nhận',
    updateItem: 'Cập nhật mục',
    saveItem: 'Lưu mục',
    cancelEdit: 'Hủy chỉnh sửa',
  },
  en: {
    statuses: {
      PENDING: 'Not started',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      UNABLE_TO_VERIFY: 'Unable to verify',
    },
    evidenceType: {
      IMAGE: 'Photos only',
      VIDEO: 'Videos only',
      IMAGE_AND_VIDEO: 'Photos and videos',
      LEGACY: 'Photo or video (legacy)',
    },
    assessments: {
      NOT_ASSESSED: 'Not assessed',
      COMPLIANT: 'Compliant',
      NON_COMPLIANT: 'Non-compliant',
    },
    resultStatuses: {
      DRAFT: 'Draft, not sent to the manager',
      PENDING_MANAGER_APPROVAL: 'Sent to the manager',
      APPROVED: 'Approved',
      REJECTED: 'Rejected, can be edited and resubmitted when permitted',
    },
    errors: {
      permissionsUnavailable:
        'Unable to verify your permissions. Refresh or sign in again.',
      parentMismatch:
        'This checklist item does not belong to this mission. Reload the correct mission.',
      concurrent:
        'The data has changed and your edit was not saved. Load the latest data and review it before saving.',
      unauthorized: 'Your session has expired. Please sign in again.',
      forbidden: 'You do not have permission to do this.',
      notFound: 'Mission or checklist item not found. Please reload.',
      locked: 'The checklist is locked for result review. Reload the status.',
      transitionInvalid: 'Invalid status change. Please reload the data.',
      missionStatusInvalid: 'The mission status has changed. Please reload.',
      evidenceTypeNotEligible:
        'One or more items need a different file type. Attach the photo or video type each item requires, then try again.',
      insufficientEvidence:
        'Not enough valid evidence. Check the current counts and each item requirement, then add what is missing.',
      notReady:
        'The checklist is not ready to submit. Please review the remaining items.',
      conflict:
        'The data has changed or the action is not allowed yet. Please reload.',
      generic: 'Unable to load or save the checklist. Please try again.',
      reasonRequired: 'Enter the reason it cannot be verified.',
      tooLong:
        'Observation is limited to 2000 characters and the reason to 1000.',
    },
    ariaChecklist: 'Monitoring checklist',
    ariaResult: 'Checklist result',
    compactTitle: 'Acceptance checklist',
    progressTitle: 'Checklist completion progress',
    doneCount: (done: number, total: number) => `${done} / ${total} items done`,
    attachedCount: (n: number) => `${n} evidence files attached`,
    loading: 'Loading checklist…',
    loadingWithResult: 'Loading checklist and result status…',
    retry: 'Retry checklist',
    rejected: 'Result rejected',
    legacy: 'Legacy mission: no historical monitoring checklist snapshot.',
    legacyLong:
      'Legacy mission: no historical monitoring checklist snapshot. Requirements are not inferred from the current service.',
    none: 'No monitoring checklist items.',
    readOnlyLocked: 'Read only: the result is pending review or approved.',
    readOnlyNoPermission:
      'Read only: you cannot update this checklist or your permissions are not verified.',
    notReadyServer:
      'The checklist data does not yet meet the server requirements. Refresh; if it is still not ready, contact an administrator.',
    evidenceWord: 'evidence',
    missingCount: (n: number) => `${n} missing`,
    needExactType: 'exact file type required',
    chipTodo: 'To do',
    chipMissing: 'Evidence missing',
    chipUnable: 'Unverified',
    updatedAt: (time: string) => `Updated ${time}`,
    updatedAtColon: (time: string) => `Updated: ${time}`,
    previewTitle: 'Checklist cannot be updated yet',
    previewBody:
      'You are previewing the content. After you accept the mission, you can update progress and evidence.',
    minEvidence: 'Minimum evidence',
    heading: 'Checklist result',
    headingHint: 'Items to complete and evidence for this mission.',
    reloadTitle: 'Fetch the latest checklist data',
    reload: 'Reload',
    ready: 'Ready to submit the result',
    notReady: 'Not ready to submit the result',
    terminalSummary: (done: number, total: number, left: number) =>
      `${done} / ${total} items finished · ${left} items not completed`,
    resultStatusLabel: 'Result status',
    managerNote: 'Manager note',
    hintEditable: 'You can update the checklist.',
    hintLocked:
      'The checklist cannot be updated yet. You can update progress and evidence once the mission is in the execution phase.',
    fieldStatus: 'Status',
    fieldAssessment: 'Assessment',
    fieldNote: 'Note',
    noNote: 'No note yet',
    unableReason: 'Reason it cannot be verified',
    edit: 'Edit',
    execStatus: 'Execution status',
    assessLabel: 'Acceptance assessment',
    assessHelp:
      'A non-compliant assessment does not automatically fail the mission.',
    assessHelpLong:
      'Non-compliant does not mean the mission failed. Not assessed is a valid choice.',
    observation: 'Execution notes',
    observationPlaceholder: 'Add a note if needed...',
    useFresh: 'Use the latest data (discard unsaved edits)',
    cancel: 'Cancel',
    save: 'Save',
    observationShort: 'Notes',
    updateItem: 'Update item',
    saveItem: 'Save item',
    cancelEdit: 'Cancel editing',
  },
})
