import { defineMessages } from '../../../shared/i18n'
export const inspectionCorrectionMessages = defineMessages({
  vi: {
    title: 'Yêu cầu bổ sung kết quả',
    subtitle:
      'Inspector nghiệm thu và công bố kết quả trực tiếp cho khách hàng.',
    inspectorRole: 'Nghiệm thu kết quả',
    dualRoleGuide:
      'Bạn có quyền thực hiện cả bổ sung và nghiệm thu trong nhiệm vụ này. Ghi nhận yêu cầu, bổ sung dữ liệu rồi gửi lại để kiểm tra; mỗi bước vẫn được lưu riêng.',
    reasonHint:
      'Mô tả phần còn thiếu, góc chụp cần bổ sung hoặc nội dung cần làm lại.',
    staffRole: 'Bổ sung kết quả',
    managerRole: 'Điều phối thực hiện',
    inspectorGuide:
      'Ghi nhận các mục cần bổ sung. Khi dữ liệu được cập nhật, kiểm tra lại và xác nhận đạt trước khi công bố cho khách hàng.',
    staffGuide:
      'Bổ sung ảnh/video và cập nhật đúng các mục bên dưới, sau đó gửi lại cho Inspector kiểm tra.',
    managerGuide:
      'Theo dõi yêu cầu của Inspector và lập kế hoạch bay bổ sung nếu cần. Inspector chịu trách nhiệm nghiệm thu; phản hồi sau bàn giao của khách hàng do Manager xử lý.',
    requestedStep: 'Yêu cầu bổ sung',
    submittedStep: 'Kiểm tra lại',
    resolvedStep: 'Xác nhận đạt',
    waitingStaff: 'Đang chờ bổ sung',
    waitingInspector: 'Sẵn sàng kiểm tra lại',
    resolvedHint:
      'Yêu cầu đã được Inspector xác nhận. Kết quả được công bố khi hoàn tất nghiệm thu nhiệm vụ.',
    itemCount: (count: number) => `${count} mục cần bổ sung`,
    cancel: 'Hủy soạn yêu cầu',
    planHint: 'Chỉ tạo chuyến bay mới khi không thể bổ sung từ dữ liệu đã có.',
    refresh: 'Làm mới',
    loading: 'Đang tải yêu cầu…',
    loadFailed:
      'Không tải được yêu cầu bổ sung. Hãy thử lại trước khi xác nhận kết quả.',
    failed: 'Không thể thực hiện thao tác. Hãy làm mới và thử lại.',
    notReady: 'Checklist hoặc Mission bổ sung chưa được nghiệm thu đầy đủ.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    resourceConflict:
      'Thiết bị hoặc nhân sự chưa sẵn sàng hoặc đang trùng lịch. Hãy kiểm tra lại phân công.',
    stale:
      'Dữ liệu đã thay đổi. Hãy làm mới, kiểm tra lại và gửi lại thao tác.',
    pending: 'Cần xử lý yêu cầu bổ sung trước khi xác nhận và công bố kết quả.',
    empty: 'Chưa có yêu cầu bổ sung.',
    newRequest: 'Tạo yêu cầu bổ sung',
    choose: 'Các checklist không đạt cần bổ sung',
    reason: 'Nội dung cần bổ sung',
    media: 'Media liên quan (không bắt buộc)',
    send: 'Ghi nhận yêu cầu bổ sung',
    note: 'Ghi chú xử lý',
    resubmit: 'Gửi lại để nghiệm thu',
    resolve: 'Xác nhận đã bổ sung đạt',
    return: 'Yêu cầu sửa tiếp',
    history: 'Lịch sử xử lý',
    create: 'Lập Mission bổ sung nội bộ',
    scope: 'Phạm vi Mission bổ sung',
    start: 'Bắt đầu — giờ Việt Nam',
    end: 'Kết thúc — giờ Việt Nam',
    plan: 'Tạo Mission bổ sung',
    openPlanning: 'Mở kế hoạch Mission bổ sung',
    configure: 'Phân công thiết bị và nhân sự',
    finalize: 'Chốt kế hoạch Mission bổ sung',
    supplement: 'Mission bổ sung',
    fieldNote:
      'Chỉ thực hiện lại các checklist trong yêu cầu. Mission gốc giữ nguyên lịch sử; Mission bổ sung có lịch bay và phân công riêng.',
    confirmPlan: 'Tôi đã kiểm tra checklist, lịch bay, thiết bị và nhân sự.',
    status: {
      OPEN: 'Chờ bổ sung dữ liệu',
      SUBMITTED: 'Chờ Inspector kiểm tra lại',
      RESOLVED: 'Đã xử lý',
    },
    action: {
      INTERNAL_MISSION_CREATED: 'Manager đã tạo Mission bổ sung',
      INTERNAL_PLAN_FINALIZED: 'Manager đã chốt kế hoạch bổ sung',
      REQUESTED: 'Inspector yêu cầu bổ sung',
      RESUBMITTED: 'Đã gửi lại dữ liệu bổ sung',
      RETURNED: 'Inspector yêu cầu sửa tiếp',
      RESOLVED: 'Inspector xác nhận đạt',
    },
    findings:
      'Tất cả checklist không đạt được tổng hợp bên dưới. Kiểm tra nội dung và ghi nhận yêu cầu để bắt đầu bổ sung.',
    completedBy: 'Được bổ sung và nghiệm thu bởi Mission',
    number: 'Yêu cầu',
  },
  en: {
    title: 'Result correction requests',
    subtitle:
      'The Inspector confirms and publishes results directly to the customer.',
    inspectorRole: 'Result inspection',
    dualRoleGuide:
      'You can both correct and inspect this Mission. Record the request, update the evidence, then submit it for review. Each step is recorded separately.',
    reasonHint:
      'Describe missing evidence, required camera angles or work that needs to be repeated.',
    staffRole: 'Result corrections',
    managerRole: 'Execution coordination',
    inspectorGuide:
      'Review the corrected items and evidence. Accept the corrections, then complete mission inspection to publish to the customer.',
    staffGuide:
      'Add media and update the requested items below, then resubmit to the Inspector.',
    managerGuide:
      'Track Inspector requests and plan supplemental flights when needed. The Inspector accepts results; the Manager handles customer feedback after publication.',
    requestedStep: 'Corrections requested',
    submittedStep: 'Reinspection',
    resolvedStep: 'Corrections accepted',
    waitingStaff: 'Awaiting corrections',
    waitingInspector: 'Ready for reinspection',
    resolvedHint:
      'The Inspector accepted this request. Results are published when mission inspection is complete.',
    itemCount: (count: number) =>
      `${count} ${count === 1 ? 'item' : 'items'} to correct`,
    cancel: 'Cancel request draft',
    planHint:
      'Create a new flight only when the existing data cannot resolve the request.',
    refresh: 'Refresh',
    loading: 'Loading requests…',
    loadFailed:
      'Unable to load correction requests. Retry before confirming the result.',
    failed: 'Unable to complete this action. Refresh and try again.',
    notReady:
      'The checklist or supplemental mission has not passed inspection yet.',
    forbidden: 'You do not have permission to perform this action.',
    resourceConflict:
      'Equipment or crew is unavailable or has a scheduling conflict. Review the assignments.',
    stale: 'The data changed. Refresh and review it before trying again.',
    pending:
      'Resolve the correction request before confirming and publishing the result.',
    empty: 'No correction requests.',
    newRequest: 'Request corrections',
    choose: 'Failed checklists requiring correction',
    reason: 'Required correction',
    media: 'Related media (optional)',
    send: 'Record correction request',
    note: 'Remediation note',
    resubmit: 'Resubmit for inspection',
    resolve: 'Accept the corrections',
    return: 'Request further corrections',
    history: 'Review history',
    create: 'Plan an internal supplemental mission',
    scope: 'Supplemental mission scope',
    start: 'Start — Vietnam time',
    end: 'End — Vietnam time',
    plan: 'Create supplemental mission',
    openPlanning: 'Open supplemental Mission plan',
    configure: 'Assign equipment and crew',
    finalize: 'Finalize supplemental mission plan',
    supplement: 'Supplemental mission',
    fieldNote:
      'Repeat only the requested checklist scope. The original history is retained; the supplemental mission has its own schedule and crew.',
    confirmPlan: 'I have reviewed the checklist, schedule, equipment and crew.',
    status: {
      OPEN: 'Awaiting corrections',
      SUBMITTED: 'Awaiting inspector review',
      RESOLVED: 'Resolved',
    },
    action: {
      INTERNAL_MISSION_CREATED: 'Manager created a supplemental mission',
      INTERNAL_PLAN_FINALIZED: 'Manager finalized the supplemental plan',
      REQUESTED: 'Inspector requested corrections',
      RESUBMITTED: 'Corrections resubmitted',
      RETURNED: 'Inspector requested further corrections',
      RESOLVED: 'Inspector accepted corrections',
    },
    findings:
      'All failed checklists are included below. Review and record the request to begin corrections.',
    completedBy: 'Corrected and inspected by mission',
    number: 'Request',
  },
})
