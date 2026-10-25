import { planningPresentationMessages } from '../../components/common/planningPresentation.messages'
import { missionCreatePageMessages } from './MissionCreatePage.messages'
import { missionsApi } from '../../api/missionsApi'
import { managerHref } from '../../routes'
import { ApiError } from '../../../../shared/api/httpClient'
import { planningApi } from '../../api/planningApi'
import { planningError } from '../../lib/planningErrors'
import type { SubmitState } from './createMissionTypes'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type { Dispatch, SetStateAction } from 'react'

export function useCreateMissionSubmit({
  submit,
  planQuery,
  replacementQuery,
  replacesMissionId,
  orderId,
  scopeLabel,
  selectedChecklistIds,
  hasChecklistItems = false,
  setSubmit,
  planningT,
  scheduledStart,
  scheduledEnd,
  t,
  planRevision,
  onCreated,
  setNavigateTo,
  setPlanRevision,
}: {
  submit: SubmitState
  planQuery: UseApiQueryState<ExecutionPlan>
  replacementQuery: UseApiQueryState<MissionResponse | null>
  replacesMissionId: string | undefined
  orderId: string
  scopeLabel: string
  selectedChecklistIds: string[]
  hasChecklistItems?: boolean
  setSubmit: Dispatch<SetStateAction<SubmitState>>
  planningT: (typeof planningPresentationMessages)['vi']
  scheduledStart: string
  scheduledEnd: string
  t: (typeof missionCreatePageMessages)['vi']
  planRevision: number
  onCreated: ((missionId: string) => void) | undefined
  setNavigateTo: Dispatch<SetStateAction<string | null>>
  setPlanRevision: Dispatch<SetStateAction<number>>
}) {
  async function handleSubmit() {
    if (
      submit.kind === 'submitting' ||
      planQuery.loading ||
      planQuery.error ||
      (planQuery.data?.planStatus !== 'DRAFT' &&
        !(replacesMissionId && planQuery.data?.planStatus === 'FINALIZED')) ||
      replacementQuery.loading ||
      replacementQuery.error ||
      (replacesMissionId &&
        (replacementQuery.data?.status !== 'CANCELLED' ||
          replacementQuery.data.orderId !== orderId))
    )
      return
    if (!scopeLabel.trim()) {
      setSubmit({ kind: 'validationFailed', message: planningT.scopeRequired })
      return
    }
    if (!scheduledStart || !scheduledEnd) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationRequired,
      })
      return
    }
    const startDate = new Date(scheduledStart)
    const endDate = new Date(scheduledEnd)
    if (endDate <= startDate) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationInvalidRange,
      })
      return
    }
    if (hasChecklistItems && selectedChecklistIds.length === 0) {
      setSubmit({
        kind: 'validationFailed',
        message: 'Vui lòng chọn ít nhất một hạng mục checklist cho Mission.',
      })
      return
    }
    setSubmit({ kind: 'submitting' })
    try {
      const intent = {
        scopeLabel: scopeLabel.trim(),
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate.toISOString(),
        checklistIds: selectedChecklistIds,
      }
      const mission = replacesMissionId
        ? await missionsApi.replaceMission(replacesMissionId, intent)
        : await missionsApi.createMission(orderId, intent)
      if (onCreated) onCreated(mission.id)
      else setNavigateTo(managerHref({ screen: 'orderReview', orderId }))
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code === 'EXECUTION_PLAN_REVISION_CONFLICT'
      ) {
        try {
          const current = await planningApi.getExecutionPlan(orderId)
          setPlanRevision(current.revision)
          planQuery.reload()
        } catch {
          /* Keep the unresolved command/key; the user can reload and retry. */
        }
      }
      if (err instanceof ApiError && err.status === 422) {
        setSubmit({
          kind: 'planFailed',
          message: t.planGenerationFailed,
        })
        return
      }
      setSubmit({
        kind: 'validationFailed',
        message: planningError(err),
      })
    }
  }
  return { handleSubmit }
}
