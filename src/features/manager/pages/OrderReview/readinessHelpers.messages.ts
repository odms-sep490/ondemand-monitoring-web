import { defineMessages } from '../../../../shared/i18n'

export const readinessHelpersMessages = defineMessages({
  vi: {
    result: {
      PASS: 'Đạt',
      WARN: 'Cần xem xét',
      FAIL: 'Không đạt',
      PENDING: 'Chưa xét',
    },
    recommendation: {
      COMPLETE_REVIEW: 'Hoàn tất các mục quản lý cần xác nhận',
      REQUEST_INFO_OR_REJECT:
        'Có tiêu chí bắt buộc không đạt: yêu cầu bổ sung hoặc từ chối',
      APPROVE_WITH_NOTES: 'Có thể duyệt, nhưng cần liên hệ xác minh',
      APPROVE: 'Đủ điều kiện duyệt',
    },
    riskLevel: { PASS: 'Thấp', WARN: 'Trung bình', FAIL: 'Cao' },
    siteAccess: {
      PASS: 'Đã liên hệ, đồng ý',
      WARN: 'Đã liên hệ, đồng ý',
      FAIL: 'Chưa liên hệ được / không đồng ý',
    },
    siteAccessFailNote:
      'Lý do (bắt buộc): vd. đã gọi nhiều lần không liên lạc được, hoặc chủ đất từ chối',
  },
  en: {
    result: {
      PASS: 'Pass',
      WARN: 'Needs review',
      FAIL: 'Fail',
      PENDING: 'Not reviewed',
    },
    recommendation: {
      COMPLETE_REVIEW: 'Complete the items the manager must confirm',
      REQUEST_INFO_OR_REJECT:
        'A mandatory criterion failed: request more information or reject',
      APPROVE_WITH_NOTES: 'Can be approved, but verification contact is needed',
      APPROVE: 'Eligible for approval',
    },
    riskLevel: { PASS: 'Low', WARN: 'Medium', FAIL: 'High' },
    siteAccess: {
      PASS: 'Contacted, agreed',
      WARN: 'Contacted, agreed',
      FAIL: 'Could not reach / did not agree',
    },
    siteAccessFailNote:
      'Reason (required): e.g. called several times with no answer, or the landowner refused',
  },
})
