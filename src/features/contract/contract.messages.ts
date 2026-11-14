import { defineMessages } from '../../shared/i18n'
export const contractMessages = defineMessages({
  vi: {
    dropHint: 'Kéo thả một tệp PDF vào đây hoặc chọn từ máy tính.',
    changeFile: 'Đổi tệp',
    readyToSend: 'Đã lưu hợp đồng. Hồ sơ sẵn sàng gửi khách hàng.',
    saveBeforeSend: 'Lưu hợp đồng PDF trước khi gửi hồ sơ.',
    title: 'Hợp đồng dịch vụ',
    preparedStatus: 'Hợp đồng đã chuẩn bị',
    managerSubtitle: 'Lưu bản PDF chính thức để khách hàng đọc, ký và gửi lại.',
    preAcceptSubtitle:
      'Đọc hợp đồng cùng báo giá trước khi chấp nhận. Sau đó gửi bản PDF đã ký tại đây.',
    subtitle: 'Ký bên ngoài hệ thống · Gửi bản PDF đã ký để quản lý xác nhận.',
    status: {
      NOT_REQUIRED: 'Áp dụng luồng trước đây',
      NOT_ISSUED: 'Chưa có tệp PDF',
      AWAITING_SIGNATURE: 'Chờ bản hợp đồng đã ký',
      PENDING_VERIFICATION: 'Chờ quản lý xác nhận',
      CHANGES_REQUESTED: 'Cần bổ sung hợp đồng',
      CONFIRMED: 'Hợp đồng đã được xác nhận',
      CANCELLED: 'Quy trình hợp đồng đã hủy',
    },
    loading: 'Đang tải hợp đồng…',
    refresh: 'Làm mới',
    acceptFirst:
      'Bạn có thể đọc và tải hợp đồng ngay. Chấp nhận báo giá để tiếp tục gửi bản đã ký.',
    prepareQuote: 'Gửi báo giá và hợp đồng',
    sendTogether: 'Gửi báo giá kèm hợp đồng',
    editQuote: 'Chỉnh sửa báo giá',
    preparedHint: 'Thêm hợp đồng PDF để gửi cùng báo giá cho khách hàng.',
    sentHint:
      'Đã gửi báo giá và hợp đồng. Chờ khách hàng chấp nhận và gửi bản đã ký.',
    sending: 'Đang gửi…',
    sent: 'Báo giá và hợp đồng đã được gửi.',
    quoteAmount: 'Giá trị báo giá',
    waitingIssue:
      'Quản lý đang chuẩn bị hợp đồng tương ứng với báo giá. Bạn chưa cần thanh toán cọc ở bước này.',
    managerIssue:
      'Tải lên PDF chính thức đã kiểm tra, đúng phạm vi và giá trị của phiên bản báo giá này. Bản phát hành được giữ nguyên trong lịch sử.',
    quote: (version: number) => `Gắn với báo giá phiên bản ${version}`,
    number: 'Số hợp đồng',
    file: 'Chọn PDF hợp đồng',
    signedFile: 'Chọn bản PDF đã ký',
    chooseFile: 'Chọn tệp PDF',
    noFile: 'Chưa chọn tệp',
    limit: 'PDF · Tối đa 10 MB · Không đặt mật khẩu',
    issue: 'Lưu hợp đồng PDF',
    submit: 'Gửi hợp đồng đã ký',
    replace: 'Thay bản hợp đồng đã ký',
    replaceOpen: 'Thay tệp đã gửi',
    currentSigned: 'Bản đã ký đang chờ xác nhận',
    cancelReplacement: 'Hủy thay tệp',
    supersededFile: 'Bản này đã được thay thế và không còn tải xuống được.',
    download: 'Tải hợp đồng chính thức',
    signedDownload: 'Tải bản đã ký',
    pending:
      'Đã nhận bản đã ký. Nếu gửi nhầm, bạn có thể thay bản mới trước khi quản lý xác nhận. Bạn vẫn có thể thanh toán cọc trong khi chờ xác minh.',
    declaration:
      'Tôi xác nhận tệp này là bản hợp đồng đã ký mà tôi muốn gửi để kiểm tra.',
    checked:
      'Tôi đã đối chiếu bản đã ký với hợp đồng chính thức và xác nhận nội dung phù hợp.',
    confirm: 'Xác nhận hợp đồng',
    changes: 'Yêu cầu bổ sung',
    reason: 'Lý do cần bổ sung',
    confirmed:
      'Hợp đồng đã được xác nhận. Khi đã đủ cọc, hệ thống có thể tiếp tục lập kế hoạch nhiệm vụ.',
    history: 'Lịch sử gửi và kiểm tra',
    submission: (n: number) => `Lần gửi ${n}`,
    submitted: 'Gửi lúc',
    reviewed: 'Kiểm tra lúc',
    submissionStatus: {
      PENDING: 'Chờ kiểm tra',
      SUPERSEDED: 'Đã được thay thế',
      CHANGES_REQUESTED: 'Cần bổ sung',
      CONFIRMED: 'Đã xác nhận',
    },
    fileInvalid: 'Hãy chọn PDF không rỗng, tối đa 10 MB.',
    numberInvalid:
      'Số hợp đồng cần 3–80 ký tự: chữ, số, dấu gạch ngang, gạch dưới hoặc dấu /.',
    failed: 'Không thể xử lý hợp đồng. Hãy làm mới và thử lại.',
    loadFailed:
      'Không thể tải thông tin hợp đồng. Hãy làm mới trước khi tiếp tục.',
    errors: {
      CONTRACT_NOT_FOUND:
        'Cần chuẩn bị hợp đồng PDF đúng phiên bản báo giá trước khi gửi hoặc chấp nhận.',
      CONTRACT_SUBMISSION_REPLACED:
        'Bản đã ký này vừa được thay thế. Hãy kiểm tra bản mới nhất trước khi xác nhận.',
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
        'Cần gửi bản hợp đồng đã ký trước khi thanh toán cọc.',
    } as Record<string, string>,
  },
  en: {
    dropHint: 'Drop one PDF here or choose a file from your computer.',
    changeFile: 'Change file',
    readyToSend: 'Contract saved. Ready to send to the customer.',
    saveBeforeSend: 'Save the PDF contract before sending.',
    title: 'Service contract',
    preparedStatus: 'Contract prepared',
    managerSubtitle:
      'Save the official PDF for the customer to read, sign and return.',
    preAcceptSubtitle:
      'Review the contract with the quote before accepting, then submit your signed PDF here.',
    subtitle:
      'Sign outside the system · Submit the signed PDF for manager verification.',
    status: {
      NOT_REQUIRED: 'Previous workflow applies',
      NOT_ISSUED: 'Awaiting contract issue',
      AWAITING_SIGNATURE: 'Awaiting signed contract',
      PENDING_VERIFICATION: 'Awaiting manager verification',
      CHANGES_REQUESTED: 'Changes requested',
      CONFIRMED: 'Contract confirmed',
      CANCELLED: 'Contract process cancelled',
    },
    loading: 'Loading contract…',
    refresh: 'Refresh',
    acceptFirst:
      'Read or download the contract now. Accept the quote to continue with the signed document.',
    prepareQuote: 'Send quote and contract',
    sendTogether: 'Send quote with contract',
    editQuote: 'Edit quote',
    preparedHint: 'Add the PDF contract to send with the customer’s quote.',
    sentHint:
      'Quote and contract sent. Awaiting customer acceptance and their signed document.',
    sending: 'Sending…',
    sent: 'The quote and contract have been sent.',
    quoteAmount: 'Quote total',
    waitingIssue:
      'The manager is preparing the contract for this quote. No deposit is due at this step.',
    managerIssue:
      'Upload the verified official PDF matching this quote version, scope and value. The issued document will remain in the history.',
    quote: (version: number) => `Bound to quote version ${version}`,
    number: 'Contract number',
    file: 'Select contract PDF',
    signedFile: 'Select signed PDF',
    chooseFile: 'Choose PDF file',
    noFile: 'No file selected',
    limit: 'PDF · Up to 10 MB · No password',
    issue: 'Save contract PDF',
    submit: 'Submit signed contract',
    replace: 'Replace signed contract',
    replaceOpen: 'Replace uploaded file',
    currentSigned: 'Signed copy awaiting verification',
    cancelReplacement: 'Cancel replacement',
    supersededFile:
      'This copy was replaced and is no longer available for download.',
    download: 'Download official contract',
    signedDownload: 'Download signed copy',
    pending:
      'Your signed contract was received. You may replace it before manager confirmation and pay the deposit while verification is pending. Mission planning remains locked.',
    declaration:
      'I confirm this file is the signed contract I wish to submit for review.',
    checked:
      'I have compared the signed copy with the official contract and confirm its contents match.',
    confirm: 'Confirm contract',
    changes: 'Request changes',
    reason: 'Reason for changes',
    confirmed:
      'The contract is confirmed. Planning can proceed once the deposit is paid.',
    history: 'Submission and review history',
    submission: (n: number) => `Submission ${n}`,
    submitted: 'Submitted at',
    reviewed: 'Reviewed at',
    submissionStatus: {
      PENDING: 'Pending review',
      SUPERSEDED: 'Replaced',
      CHANGES_REQUESTED: 'Changes requested',
      CONFIRMED: 'Confirmed',
    },
    fileInvalid: 'Select a non-empty PDF of at most 10 MB.',
    numberInvalid:
      'Use 3–80 characters: letters, numbers, hyphens, underscores or /.',
    failed: 'Unable to process the contract. Refresh and try again.',
    loadFailed:
      'Unable to load contract information. Refresh before continuing.',
    errors: {
      CONTRACT_NOT_FOUND:
        'Prepare the PDF contract for this quote version before sending or accepting it.',
      CONTRACT_SUBMISSION_REPLACED:
        'This signed copy was replaced. Review the latest copy before confirming.',
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
        'Submit the signed contract before paying the deposit.',
    } as Record<string, string>,
  },
})
