import type { CriterionResult } from '../../types/readiness'

export type Answer = Exclude<CriterionResult, 'PENDING'>

export type FailureAction = 'NEED_INFO' | 'REJECTED'

export type SupplementRequest = {
  id: string
  label: string
  scope: 'LOCATION' | 'ADDITIONAL_INFORMATION'
}
