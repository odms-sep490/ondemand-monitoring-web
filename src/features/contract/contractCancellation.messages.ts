import { defineMessages } from '../../shared/i18n'
export const contractCancellationMessages = defineMessages({
  vi: {
    title: 'Xử lý hủy hợp đồng',
    open: 'Hủy quy trình hợp đồng',
    intro:
      'Chỉ dùng khi hai bên không tiếp tục được. Việc yêu cầu bổ sung bản ký không tự động hủy đơn hoặc giữ cọc.',
    reason: 'Nguyên nhân hủy',
    party: 'Bên chịu trách nhiệm',
    basis: 'Căn cứ và điều khoản áp dụng',
    parties: {
      UNRESOLVED: 'Chưa xác định · Chờ xử lý',
      SYSTEM: 'Phía hệ thống',
      CUSTOMER: 'Phía khách hàng',
    },
    acknowledgement:
      'Tôi đã đối chiếu căn cứ xác định trách nhiệm khách hàng và điều khoản xử lý tiền cọc.',
    customerWarning:
      'Quyết định giữ cọc phải có căn cứ cụ thể; không tự áp dụng vì thiếu trang, sai tệp hoặc thiếu chữ ký.',
    systemWarning:
      'Nếu đã nhận cọc, hệ thống sẽ tạo yêu cầu hoàn tiền để Admin xử lý theo quy trình hiện có.',
    unknownWarning:
      'Chưa kết luận hoàn tiền hay giữ cọc. Đơn được dừng và chờ ghi nhận quyết định.',
    submit: 'Xác nhận hủy quy trình',
    decide: 'Ghi nhận quyết định',
    save: 'Lưu quyết định',
    close: 'Đóng',
    paid: 'Tiền cọc đã ghi nhận',
    requested: 'Ghi nhận lúc',
    decisionAt: 'Quyết định lúc',
    refresh: 'Làm mới',
    status: {
      REVIEW_REQUIRED: 'Chờ xác định trách nhiệm',
      REFUND_REQUESTED: 'Đã tạo yêu cầu hoàn tiền',
      DEPOSIT_RETAINED: 'Đã quyết định giữ cọc',
      NO_PAYMENT_DUE: 'Đã hủy · Không có khoản cọc cần xử lý',
    },
    refundHint:
      'Yêu cầu đã được chuyển sang quy trình hoàn tiền. Chỉ được xem là đã hoàn khi Admin xác nhận chuyển tiền thành công.',
    loadFailed:
      'Không tải được trạng thái xử lý hủy. Hãy làm mới trước khi quyết định.',
    failed: 'Không thể xử lý yêu cầu hủy. Hãy làm mới và thử lại.',
    errors: {
      CONTRACT_CANCELLATION_PENDING_PAYMENT:
        'Có giao dịch thanh toán đang chờ kết quả. Cần đối soát trước khi hủy.',
      CONTRACT_FINANCIAL_REVIEW_REQUIRED:
        'Số tiền hoặc giao dịch cần được kiểm tra trước khi quyết định. Không tự giữ khoản trả dư.',
      CONTRACT_CANCELLATION_MISSION_EXISTS:
        'Đơn đã có nhiệm vụ. Hãy dùng luồng hủy vận hành phù hợp.',
      CONTRACT_LIABILITY_BASIS_REQUIRED:
        'Cần xác nhận đã kiểm tra trách nhiệm khách hàng và căn cứ giữ cọc.',
      CONTRACT_STATE_CONFLICT:
        'Trạng thái đã thay đổi hoặc không đủ điều kiện. Hãy làm mới.',
      CONCURRENT_UPDATE:
        'Dữ liệu vừa thay đổi. Hãy kiểm tra lại trước khi gửi.',
      ACCESS_DENIED: 'Bạn không có quyền xử lý hủy hợp đồng.',
    },
  },
  en: {
    title: 'Contract cancellation',
    open: 'Cancel the contract process',
    intro:
      'Use only when the parties cannot proceed. A request to correct a signed file does not automatically cancel the order or forfeit the deposit.',
    reason: 'Cancellation reason',
    party: 'Responsible party',
    basis: 'Basis and applicable contract terms',
    parties: {
      UNRESOLVED: 'Undetermined · Pending review',
      SYSTEM: 'Service provider',
      CUSTOMER: 'Customer',
    },
    acknowledgement:
      'I have checked the basis for customer responsibility and the applicable deposit terms.',
    customerWarning:
      'Retention requires a specific basis. Missing pages, wrong files or missing signatures do not automatically forfeit a deposit.',
    systemWarning:
      'If a deposit was received, a refund request will be created for the existing Admin workflow.',
    unknownWarning:
      'No refund or retention decision yet. The order stops while the case awaits review.',
    submit: 'Confirm process cancellation',
    decide: 'Record a decision',
    save: 'Save decision',
    close: 'Close',
    paid: 'Verified deposit received',
    requested: 'Recorded at',
    decisionAt: 'Decision at',
    refresh: 'Refresh',
    status: {
      REVIEW_REQUIRED: 'Responsibility review pending',
      REFUND_REQUESTED: 'Refund requested',
      DEPOSIT_RETAINED: 'Deposit retention recorded',
      NO_PAYMENT_DUE: 'Cancelled · No deposit to settle',
    },
    refundHint:
      'The existing refund workflow will process this request. It is refunded only after Admin confirms a successful transfer.',
    loadFailed:
      'Unable to load cancellation status. Refresh before making a decision.',
    failed: 'Unable to process the cancellation. Refresh and try again.',
    errors: {
      CONTRACT_CANCELLATION_PENDING_PAYMENT:
        'A payment is still pending. Reconcile it before cancelling.',
      CONTRACT_FINANCIAL_REVIEW_REQUIRED:
        'Payment records require review before a decision. Do not retain overpayments automatically.',
      CONTRACT_CANCELLATION_MISSION_EXISTS:
        'This order already has Missions. Use the appropriate operational cancellation workflow.',
      CONTRACT_LIABILITY_BASIS_REQUIRED:
        'Confirm that customer responsibility and the deposit terms were reviewed.',
      CONTRACT_STATE_CONFLICT:
        'The state changed or is not eligible. Refresh before continuing.',
      CONCURRENT_UPDATE:
        'The data changed. Review the latest state before retrying.',
      ACCESS_DENIED: 'You cannot manage contract cancellation.',
    },
  },
})
