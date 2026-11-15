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
import type { Dispatch, SetStateAction } from 'react'
import { useToast } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { managerFeedbackMessages } from '../../feedback.messages'
import { useRef } from 'react'
import type { ResultRevisionCase } from '../../../delivery/api'
import { canCreateRework } from '../../../delivery/reworkPolicy'

export function useCreateMissionSubmit({
  submit,
  planQuery,
  orderId,
  scopeLabel,
  selectedChecklistIds,
  hasChecklistItems = false,
  setSubmit,
  planningT,
  scheduledStart,
  scheduledEnd,
  t,
  onCreated,
  setNavigateTo,
  setPlanRevision,
  reworkCase,
}: {
  submit: SubmitState
  planQuery: UseApiQueryState<ExecutionPlan>
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
  reworkCase?: ResultRevisionCase
}) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const reworkRequest = useRef<{ fingerprint: string; id: string } | null>(null)
  async function handleSubmit() {
    if (
      submit.kind === 'submitting' ||
      planQuery.loading ||
      planQuery.error ||
      !['DRAFT', 'FINALIZED'].includes(planQuery.data?.planStatus ?? '')
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
    if (
      !Number.isFinite(startDate.getTime()) ||
      !Number.isFinite(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationInvalidRange,
      })
      return
    }
    if (reworkCase && startDate <= new Date()) {
      setSubmit({ kind: 'validationFailed', message: t.reworkFutureRequired })
      return
    }
    const reworkItems = reworkCase?.items.filter(
      (item) =>
        canCreateRework(item) &&
        selectedChecklistIds.includes(item.orderChecklistItemId),
    )
    if (
      reworkCase &&
      (!reworkItems?.length ||
        reworkItems.length !== selectedChecklistIds.length)
    ) {
      setSubmit({ kind: 'validationFailed', message: t.reworkUnavailable })
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
      let mission: { id: string }
      if (reworkCase && reworkItems) {
        const body = {
          expectedCaseVersion: reworkCase.version,
          scopeLabel: intent.scopeLabel,
          scheduledStartAt: intent.scheduledStart,
          scheduledEndAt: intent.scheduledEnd,
          caseItemIds: reworkItems.map((item) => item.caseItemId).sort(),
        }
        const fingerprint = JSON.stringify([reworkCase.caseId, body])
        if (reworkRequest.current?.fingerprint !== fingerprint)
          reworkRequest.current = { fingerprint, id: crypto.randomUUID() }
        const created = await missionsApi.createReworkMission(
          reworkCase.caseId,
          {
            ...body,
            clientRequestId: reworkRequest.current.id,
          },
        )
        mission = { id: created.missionId }
      } else {
        mission =
          planQuery.data?.planStatus === 'FINALIZED'
            ? await missionsApi.createAdditionalMission(orderId, intent)
            : await missionsApi.createMission(orderId, intent)
      }
      toast.success(fb.missionCreated)
      if (onCreated) onCreated(mission.id)
      else
        setNavigateTo(
          reworkCase
            ? managerHref({
                screen: 'missionCreate',
                orderId,
                reworkCaseId: reworkCase.caseId,
              })
            : managerHref({ screen: 'orderReview', orderId }),
        )
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
        toast.error(t.planGenerationFailed)
        return
      }
      setSubmit({
        kind: 'validationFailed',
        message: planningError(err),
      })
      toast.error(planningError(err))
    }
  }
  return { handleSubmit }
}
