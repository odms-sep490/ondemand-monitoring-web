import type {
  CriterionResult,
  ReadinessRecommendation,
} from '../../types/readiness'
import type { Answer } from './readinessTypes'
import { getLanguage } from '../../../../shared/i18n'
import { readinessHelpersMessages } from './readinessHelpers.messages'

const rm = () => readinessHelpersMessages[getLanguage()]

export const resultLabel: Record<CriterionResult, string> = {
  get PASS() {
    return rm().result.PASS
  },
  get WARN() {
    return rm().result.WARN
  },
  get FAIL() {
    return rm().result.FAIL
  },
  get PENDING() {
    return rm().result.PENDING
  },
}

export const recommendationText: Record<ReadinessRecommendation, string> = {
  get COMPLETE_REVIEW() {
    return rm().recommendation.COMPLETE_REVIEW
  },
  get REQUEST_INFO_OR_REJECT() {
    return rm().recommendation.REQUEST_INFO_OR_REJECT
  },
  get APPROVE_WITH_NOTES() {
    return rm().recommendation.APPROVE_WITH_NOTES
  },
  get APPROVE() {
    return rm().recommendation.APPROVE
  },
}

export const answerOptions: Answer[] = ['PASS', 'FAIL']

export const riskLevelOptions: Answer[] = ['PASS', 'WARN', 'FAIL']

export const contextualAnswerLabels: Record<string, Record<Answer, string>> = {
  get RISK_LEVEL() {
    return rm().riskLevel
  },
  get SITE_ACCESS() {
    return rm().siteAccess
  },
}

export const failNotePlaceholders: Record<string, string> = {
  get SITE_ACCESS() {
    return rm().siteAccessFailNote
  },
}

export const criterionDescriptionOverrides: Record<string, string> = {}

export const criterionTitleOverrides: Record<string, string> = {}
