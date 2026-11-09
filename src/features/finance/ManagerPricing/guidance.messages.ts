import { defineMessages } from '../../../shared/i18n'
export const guidanceMessages = defineMessages({
  vi: {
    invalid:
      'Hướng dẫn không hợp lệ. Kiểm tra các trường và giới hạn nội dung.',
    quoteStale:
      'Hướng dẫn báo giá đã thay đổi hoặc chưa được chốt. Vui lòng yêu cầu quản lý cập nhật và phát hành lại báo giá trước khi chấp nhận.',
    title: 'Soạn hướng dẫn',
    editorIntro:
      'Làm rõ cách thực hiện và kết quả cần bàn giao cho yêu cầu bổ sung.',
    requirement: 'Yêu cầu bổ sung',
    completion: (count: number) => `${count}/3 mục đã điền`,
    footerHint: 'Có thể lưu nháp và hoàn thiện sau.',
    descriptionPlaceholder:
      'Bổ sung phạm vi, vị trí hoặc lưu ý chung cho công việc…',
    executionStepsHint: 'Trình tự để đội thực hiện làm đúng yêu cầu.',
    inputRequirementsHint:
      'Thông tin và điều kiện cần chuẩn bị trước khi thực hiện.',
    expectedOutputsHint: 'Kết quả cụ thể để kiểm tra và nghiệm thu.',
    executionStepsPlaceholder:
      'Ví dụ: Chụp toàn cảnh mái, sau đó chụp cận vị trí cần kiểm tra.',
    inputRequirementsPlaceholder:
      'Ví dụ: Vị trí cần kiểm tra và người liên hệ tại hiện trường.',
    expectedOutputsPlaceholder:
      'Ví dụ: Ảnh toàn cảnh và ảnh cận cảnh có đánh dấu vị trí.',
    missing: 'Chưa có hướng dẫn',
    draft: 'Bản nháp',
    ready: 'Đã hoàn thiện',
    description: 'Mô tả bổ sung (tùy chọn)',
    executionSteps: 'Các bước thực hiện',
    inputRequirements: 'Đầu vào cần có',
    expectedOutputs: 'Đầu ra cần nộp',
    add: 'Thêm dòng',
    remove: 'Xóa dòng',
    up: 'Di chuyển lên',
    down: 'Di chuyển xuống',
    save: 'Lưu nháp',
    confirm: 'Xác nhận hướng dẫn',
    cancel: 'Hủy',
    close: 'Đóng',
    required: 'Nhập ít nhất một dòng trước khi xác nhận.',
    limits: 'Tối đa 20 dòng, mỗi dòng 500 ký tự.',
    descriptionLimit: 'Mô tả tối đa 4.000 ký tự.',
    media: (images: number, videos: number) =>
      `Khách hàng yêu cầu: ${images} ảnh · ${videos} video`,
    invalidates:
      'Thay đổi hướng dẫn sẽ làm báo giá chưa được chấp nhận mất hiệu lực. Bạn cần tạo và phê duyệt báo giá mới.',
    discard: 'Bỏ các thay đổi chưa lưu?',
    discardAction: 'Bỏ thay đổi',
    keep: 'Tiếp tục soạn',
    conflict:
      'Dữ liệu đã thay đổi. Nội dung bạn nhập được giữ lại. Tải lại dữ liệu mới nhất và rà soát trước khi lưu tiếp.',
    reload: 'Tải lại dữ liệu mới nhất',
    reloaded:
      'Đã tải lại phiên bản mới nhất; hãy rà soát bản nháp đang giữ trước khi lưu.',
    unavailable:
      'Không thể chỉnh sửa hướng dẫn này. Danh sách kiểm tra có thể đã được thay thế hoặc đã khóa.',
    failed: 'Không thể lưu hướng dẫn. Vui lòng thử lại.',
    blocked: 'Hướng dẫn đã khóa hoặc bạn không có quyền chỉnh sửa.',
    pending:
      'Hoàn thiện và xác nhận hướng dẫn yêu cầu bổ sung trước khi phát hành báo giá:',
    quoteTitle: 'Hướng dẫn thuộc báo giá này',
    empty: 'Chưa có hướng dẫn chi tiết',
    quoteMissing:
      'Báo giá chưa có hướng dẫn chi tiết. Vui lòng yêu cầu quản lý bổ sung hướng dẫn và phát hành lại báo giá trước khi chấp nhận.',
    quoteItem: (index: number) => `Công việc ${index}`,
  },
  en: {
    invalid: 'Guidance is invalid. Check the fields and content limits.',
    quoteStale:
      'The quote guidance has changed or is not finalized. Ask the Manager to update and reissue the quote before accepting.',
    title: 'Edit guidance',
    editorIntro:
      'Define how the additional work is performed and what must be delivered.',
    requirement: 'Additional requirement',
    completion: (count: number) => `${count}/3 sections filled`,
    footerHint: 'Save a draft to continue later.',
    descriptionPlaceholder:
      'Add scope, location or general notes for this task…',
    executionStepsHint:
      'The sequence the team should follow to complete the task.',
    inputRequirementsHint: 'Information and conditions needed before starting.',
    expectedOutputsHint: 'Specific deliverables to check during acceptance.',
    executionStepsPlaceholder:
      'Example: Capture the entire roof, then close-ups of the inspection area.',
    inputRequirementsPlaceholder:
      'Example: Inspection location and an on-site contact.',
    expectedOutputsPlaceholder:
      'Example: Overview and close-up images with marked locations.',
    missing: 'No guidance',
    draft: 'Draft',
    ready: 'Ready',
    description: 'Additional description (optional)',
    executionSteps: 'Execution steps',
    inputRequirements: 'Required inputs',
    expectedOutputs: 'Expected outputs',
    add: 'Add row',
    remove: 'Remove row',
    up: 'Move up',
    down: 'Move down',
    save: 'Save draft',
    confirm: 'Confirm guidance',
    cancel: 'Cancel',
    close: 'Close',
    required: 'Enter at least one row before confirming.',
    limits: 'Up to 20 rows, 500 characters per row.',
    descriptionLimit: 'Description must be at most 4,000 characters.',
    media: (images: number, videos: number) =>
      `Customer requested: ${images} images · ${videos} videos`,
    invalidates:
      'Changing guidance invalidates the unaccepted quote. Create and approve a new quote afterward.',
    discard: 'Discard unsaved changes?',
    discardAction: 'Discard changes',
    keep: 'Keep editing',
    conflict:
      'The data has changed. Your text is preserved. Reload the latest data and review it before saving again.',
    reload: 'Reload latest data',
    reloaded:
      'Latest version loaded; review your preserved draft before saving.',
    unavailable:
      'This guidance cannot be edited. The checklist may have been replaced or locked.',
    failed: 'Unable to save guidance. Please try again.',
    blocked: 'Guidance is locked or you do not have permission to edit it.',
    pending: 'Complete and confirm custom guidance before issuing the quote:',
    quoteTitle: 'Guidance included in this quote',
    empty: 'No detailed guidance available',
    quoteMissing:
      'This quote has no detailed guidance. Ask the Manager to complete the guidance and reissue the quote before accepting.',
    quoteItem: (index: number) => `Task ${index}`,
  },
})
