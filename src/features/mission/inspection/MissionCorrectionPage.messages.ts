import { defineMessages } from '../../../shared/i18n'
export const missionCorrectionPageMessages = defineMessages({
  vi: {
    decisionNoteHint:
      'Ghi nhận kết quả kiểm tra và lý do xác nhận đạt hoặc yêu cầu sửa tiếp.',
    latestFinding: 'Ghi chú kiểm tra lại mới nhất',
    ready: 'Sẵn sàng',
    needsWork: 'Cần kiểm tra',
    title: 'Bổ sung hồ sơ nghiệm thu',
    inspectorTitle: 'Kiểm tra lại hồ sơ bổ sung',
    back: 'Chi tiết nhiệm vụ',
    backToInspection: 'Nghiệm thu nhiệm vụ',
    refresh: 'Làm mới',
    loading: 'Đang tải yêu cầu bổ sung…',
    loadFailed: 'Chưa tải được yêu cầu và quyền xử lý. Hãy thử lại.',
    noRequest: 'Nhiệm vụ chưa có yêu cầu bổ sung.',
    overview: 'Xem yêu cầu',
    media: 'Bổ sung tệp',
    evidence: 'Chỉnh bằng chứng',
    submit: 'Gửi lại',
    optional: 'Không bắt buộc',
    guide:
      'Dùng dữ liệu từ chuyến bay đã thực hiện. Chỉ sửa các mục Inspector yêu cầu; không cần mở lại chuyến bay.',
    requested: 'Các mục cần bổ sung',
    reason: 'Yêu cầu của người nghiệm thu',
    existing: 'Đã có tệp phù hợp — chỉnh bằng chứng',
    addFiles: 'Cần tải thêm tệp gốc',
    mediaHint:
      'Bỏ qua bước này nếu thư viện đã có tệp phù hợp. Tệp mới phải được xác thực trước khi gửi lại hồ sơ.',
    evidenceHint:
      'Gỡ liên kết tệp không phù hợp và gắn tệp thay thế vào từng mục được yêu cầu. Chưa chọn tệp bàn giao cho khách hàng ở bước này.',
    reviewHint:
      'Đánh giá lại các mục đã bổ sung và chọn bằng chứng đạt để bàn giao. Xác nhận yêu cầu sau khi kiểm tra xong.',
    nextEvidence: 'Tiếp tục chỉnh bằng chứng',
    nextSubmit: 'Kiểm tra và gửi lại',
    previous: 'Quay lại',
    note: 'Nội dung đã bổ sung',
    noteHint: 'Nêu các tệp/bằng chứng đã thay và cách xử lý yêu cầu.',
    resend: 'Gửi lại để nghiệm thu',
    waiting: 'Đã gửi lại — chờ người nghiệm thu kiểm tra',
    waitingHint:
      'Hồ sơ đang được khóa chỉnh sửa. Không cần thực hiện lại kiểm tra sau bay.',
    waitingCrew: 'Đang chờ người thực hiện bổ sung hồ sơ theo yêu cầu.',
    blocked:
      'Cần hoàn tất và xác thực các bằng chứng của từng mục trước khi gửi lại.',
    assessmentBlocked:
      'Đánh giá đạt và chọn đủ bằng chứng bàn giao cho các mục được yêu cầu trước khi xác nhận.',
    details: 'Không có dữ liệu phù hợp?',
    escalateHint:
      'Nếu tệp gốc không thể đáp ứng yêu cầu, ghi lý do bên trên để chuyển sang nhiệm vụ bay bổ sung do Quản lý lập kế hoạch.',
    escalate: 'Yêu cầu bay bổ sung',
    flight:
      'Yêu cầu đã chuyển sang bay bổ sung. Tiếp tục theo kế hoạch nhiệm vụ riêng.',
    decisionNote: 'Ghi chú kiểm tra lại',
    accept: 'Xác nhận bổ sung đạt',
    return: 'Yêu cầu sửa tiếp',
    resolved: 'Hồ sơ bổ sung đã được xác nhận đạt',
    resolvedHint:
      'Tiếp tục nghiệm thu nhiệm vụ trước khi công bố kết quả cho khách hàng.',
    inspection: 'Tiếp tục nghiệm thu nhiệm vụ',
    history: 'Lịch sử xử lý',
    failed: 'Chưa thực hiện được thao tác. Kiểm tra dữ liệu rồi thử lại.',
    stale: 'Hồ sơ đã thay đổi. Làm mới và kiểm tra lại trước khi xác nhận.',
    denied: 'Bạn không có quyền xử lý bước này.',
    reporter: 'Người thực hiện',
    inspector: 'Người nghiệm thu',
    count: (n: number) => `${n} mục cần bổ sung`,
  },
  en: {
    decisionNoteHint:
      'Record the review outcome and why the corrections are accepted or returned.',
    latestFinding: 'Latest reinspection feedback',
    ready: 'Ready',
    needsWork: 'Needs attention',
    title: 'Evidence correction workspace',
    inspectorTitle: 'Review corrected evidence',
    back: 'Mission details',
    backToInspection: 'Mission inspection',
    refresh: 'Refresh',
    loading: 'Loading the correction request…',
    loadFailed: 'Unable to load the request and permissions. Please retry.',
    noRequest: 'This Mission has no correction requests.',
    overview: 'Review request',
    media: 'Add files',
    evidence: 'Update evidence',
    submit: 'Resubmit',
    optional: 'Optional',
    guide:
      'Use data from the completed flight. Update only the requested items; the original flight stays closed.',
    requested: 'Items requiring corrections',
    reason: 'Inspector finding',
    existing: 'Use existing files — update evidence',
    addFiles: 'Upload additional original files',
    mediaHint:
      'Skip this step when suitable files are already in the library. New files must pass validation before resubmission.',
    evidenceHint:
      'Detach unsuitable evidence and attach replacement files to each requested item. Customer delivery selection happens during inspection.',
    reviewHint:
      'Reassess the corrected items and select accepted delivery evidence. Confirm the request after reviewing all items.',
    nextEvidence: 'Continue to evidence',
    nextSubmit: 'Review and resubmit',
    previous: 'Back',
    note: 'Corrections made',
    noteHint:
      'Describe the replaced files/evidence and how the findings were addressed.',
    resend: 'Resubmit for inspection',
    waiting: 'Resubmitted — awaiting Inspector review',
    waitingHint:
      'The dossier is locked for review. Postflight checks do not need to be repeated.',
    waitingCrew:
      'Waiting for the flight crew to correct the requested evidence.',
    blocked:
      'Complete and validate the evidence for every requested item before resubmitting.',
    assessmentBlocked:
      'Accept each requested item and select sufficient delivery evidence before confirming.',
    details: 'No suitable source data?',
    escalateHint:
      'If original files cannot resolve the findings, explain why above and request a supplemental flight for the Manager to plan.',
    escalate: 'Request supplemental flight',
    flight:
      'This request now requires a supplemental flight. Continue through its separate Mission plan.',
    decisionNote: 'Reinspection note',
    accept: 'Accept corrections',
    return: 'Request further corrections',
    resolved: 'Corrections accepted',
    resolvedHint:
      'Continue Mission inspection before publishing results to the customer.',
    inspection: 'Continue Mission inspection',
    history: 'Correction history',
    failed: 'Unable to complete this action. Review the data and retry.',
    stale: 'The dossier changed. Refresh and review it before confirming.',
    denied: 'You do not have permission to perform this step.',
    reporter: 'Flight crew',
    inspector: 'Inspector',
    count: (n: number) => `${n} items to correct`,
  },
})
