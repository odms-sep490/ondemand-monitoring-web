import type {
  CriterionResult,
  ReadinessRecommendation,
} from '../../types/readiness'
import type { Answer } from './readinessTypes'

export const resultLabel: Record<CriterionResult, string> = {
  PASS: 'Đạt',
  WARN: 'Cần xem xét',
  FAIL: 'Không đạt',
  PENDING: 'Chưa xét',
}

export const recommendationText: Record<ReadinessRecommendation, string> = {
  COMPLETE_REVIEW: 'Hoàn tất các mục manager cần xác nhận',
  REQUEST_INFO_OR_REJECT:
    'Có tiêu chí bắt buộc không đạt: yêu cầu bổ sung hoặc từ chối',
  APPROVE_WITH_NOTES: 'Có thể duyệt, nhưng cần liên hệ xác minh',
  APPROVE: 'Đủ điều kiện duyệt',
}

export const answerOptions: Answer[] = ['PASS', 'FAIL']

export const riskLevelOptions: Answer[] = ['PASS', 'WARN', 'FAIL']

export const contextualAnswerLabels: Record<string, Record<Answer, string>> = {
  RISK_LEVEL: {
    PASS: 'Thấp',
    WARN: 'Trung bình',
    FAIL: 'Cao',
  },
  SITE_ACCESS: {
    PASS: 'Đã liên hệ, đồng ý',
    WARN: 'Đã liên hệ, đồng ý',
    FAIL: 'Chưa liên hệ được / không đồng ý',
  },
}

export const failNotePlaceholders: Record<string, string> = {
  SITE_ACCESS:
    'Lý do (bắt buộc): vd. đã gọi nhiều lần không liên lạc được, hoặc chủ đất từ chối',
}

export const criterionDescriptionOverrides: Record<string, string> = {}

export const criterionTitleOverrides: Record<string, string> = {}
