import { defineMessages } from '../../shared/i18n'
export const contractMessages = defineMessages({
  vi: {
    title: 'Hợp đồng dịch vụ',
    subtitle: 'Ký bên ngoài hệ thống · Gửi bản PDF đã ký để quản lý xác nhận.',
    status: {
      NOT_REQUIRED: 'Áp dụng luồng trước đây',
      NOT_ISSUED: 'Chờ phát hành hợp đồng',
      AWAITING_SIGNATURE: 'Chờ bản hợp đồng đã ký',
      PENDING_VERIFICATION: 'Chờ quản lý xác nhận',
      CHANGES_REQUESTED: 'Cần bổ sung hợp đồng',
      CONFIRMED: 'Hợp đồng đã được xác nhận',
    },
    loading: 'Đang tải hợp đồng…',
    refresh: 'Làm mới',
    waitingIssue:
      'Quản lý sẽ phát hành hợp đồng theo báo giá bạn đã chấp nhận. Bạn chưa cần thanh toán cọc ở bước này.',
    managerIssue:
      'Tải lên PDF chính thức đã kiểm tra, đúng phạm vi và giá trị của báo giá đã được khách chấp nhận. Bản phát hành được giữ nguyên trong lịch sử.',
    quote: (version: number) => `Gắn với báo giá phiên bản ${version}`,
    number: 'Số hợp đồng',
    file: 'Chọn PDF hợp đồng',
    signedFile: 'Chọn bản PDF đã ký',
    chooseFile: 'Chọn tệp PDF',
    noFile: 'Chưa chọn tệp',
    limit: 'PDF · Tối đa 10 MB · Không đặt mật khẩu',
    issue: 'Phát hành hợp đồng',
    submit: 'Gửi hợp đồng đã ký',
    download: 'Tải hợp đồng chính thức',
    signedDownload: 'Tải bản đã ký',
    pending:
      'Đã nhận bản hợp đồng của bạn. Vui lòng chờ quản lý kiểm tra; chưa thể thanh toán cọc.',
    declaration:
      'Tôi xác nhận tệp này là bản hợp đồng đã ký mà tôi muốn gửi để kiểm tra.',
    checked:
      'Tôi đã đối chiếu bản đã ký với hợp đồng chính thức và xác nhận nội dung phù hợp.',
    confirm: 'Xác nhận hợp đồng',
    changes: 'Yêu cầu bổ sung',
    reason: 'Lý do cần bổ sung',
    confirmed:
      'Hợp đồng đã được quản lý xác nhận. Bạn có thể tiếp tục thanh toán cọc trong thời hạn hiển thị.',
    history: 'Lịch sử gửi và kiểm tra',
    submission: (n: number) => `Lần gửi ${n}`,
    submitted: 'Gửi lúc',
    reviewed: 'Kiểm tra lúc',
    submissionStatus: {
      PENDING: 'Chờ kiểm tra',
      CHANGES_REQUESTED: 'Cần bổ sung',
      CONFIRMED: 'Đã xác nhận',
    },
    fileInvalid: 'Hãy chọn PDF không rỗng, tối đa 10 MB.',
    numberInvalid:
      'Số hợp đồng cần 3–80 ký tự: chữ, số, dấu gạch ngang, gạch dưới hoặc dấu /.',
    failed: 'Không thể xử lý hợp đồng. Hãy làm mới và thử lại.',
    loadFailed:
      'Không thể tải hợp đồng. Thanh toán cọc vẫn bị khóa cho đến khi có xác nhận hợp lệ.',
    errors: {
      CONTRACT_VERSION_CONFLICT:
        'Dữ liệu đã thay đổi. Hãy làm mới và kiểm tra lại trước khi tiếp tục.',
      CONTRACT_STATE_CONFLICT:
        'Thao tác không phù hợp với trạng thái hợp đồng hiện tại. Hãy làm mới.',
      CONTRACT_FILE_INVALID:
        'PDF không hợp lệ, bị đặt mật khẩu hoặc vượt giới hạn. Hãy kiểm tra lại tệp.',
      CONTRACT_STORAGE_UNAVAILABLE:
        'Chưa thể truy cập kho lưu trữ hợp đồng. Hãy thử lại sau.',
      ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác với hợp đồng này.',
      CONTRACT_NOT_CONFIRMED:
        'Cần quản lý xác nhận hợp đồng trước khi thanh toán cọc.',
    } as Record<string, string>,
  },
  en: {
    title: 'Service contract',
    subtitle:
      'Sign outside the system · Submit the signed PDF for manager verification.',
    status: {
      NOT_REQUIRED: 'Previous workflow applies',
      NOT_ISSUED: 'Awaiting contract issue',
      AWAITING_SIGNATURE: 'Awaiting signed contract',
      PENDING_VERIFICATION: 'Awaiting manager verification',
      CHANGES_REQUESTED: 'Changes requested',
      CONFIRMED: 'Contract confirmed',
    },
    loading: 'Loading contract…',
    refresh: 'Refresh',
    waitingIssue:
      'The manager will issue a contract for your accepted quote. No deposit is due at this step.',
    managerIssue:
      'Upload the verified official PDF matching the accepted quote scope and value. The issued document will remain in the history.',
    quote: (version: number) => `Bound to quote version ${version}`,
    number: 'Contract number',
    file: 'Select contract PDF',
    signedFile: 'Select signed PDF',
    chooseFile: 'Choose PDF file',
    noFile: 'No file selected',
    limit: 'PDF · Up to 10 MB · No password',
    issue: 'Issue contract',
    submit: 'Submit signed contract',
    download: 'Download official contract',
    signedDownload: 'Download signed copy',
    pending:
      'Your signed contract was received. Please wait for manager verification; the deposit is not available yet.',
    declaration:
      'I confirm this file is the signed contract I wish to submit for review.',
    checked:
      'I have compared the signed copy with the official contract and confirm its contents match.',
    confirm: 'Confirm contract',
    changes: 'Request changes',
    reason: 'Reason for changes',
    confirmed:
      'The manager has confirmed the contract. You may now pay the deposit within the displayed deadline.',
    history: 'Submission and review history',
    submission: (n: number) => `Submission ${n}`,
    submitted: 'Submitted at',
    reviewed: 'Reviewed at',
    submissionStatus: {
      PENDING: 'Pending review',
      CHANGES_REQUESTED: 'Changes requested',
      CONFIRMED: 'Confirmed',
    },
    fileInvalid: 'Select a non-empty PDF of at most 10 MB.',
    numberInvalid:
      'Use 3–80 characters: letters, numbers, hyphens, underscores or /.',
    failed: 'Unable to process the contract. Refresh and try again.',
    loadFailed:
      'Unable to load the contract. The deposit remains locked until verification is confirmed.',
    errors: {
      CONTRACT_VERSION_CONFLICT:
        'The contract changed. Refresh and review it before continuing.',
      CONTRACT_STATE_CONFLICT:
        'This action is not available in the current contract state. Refresh the contract.',
      CONTRACT_FILE_INVALID:
        'The PDF is invalid, password-protected or exceeds the limit. Check the file.',
      CONTRACT_STORAGE_UNAVAILABLE:
        'Contract storage is unavailable. Please try again later.',
      ACCESS_DENIED: 'You are not authorized to access this contract.',
      CONTRACT_NOT_CONFIRMED:
        'The manager must confirm the contract before the deposit can be paid.',
    } as Record<string, string>,
  },
})
