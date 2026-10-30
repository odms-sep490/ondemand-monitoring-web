import { useI18n } from '../../../../shared/i18n'
import { commonMiscMessages } from './commonMisc.messages'
import type { usePlanningConfirmation } from './usePlanningConfirmation'
import { LiveDispatchPage } from './LiveDispatchPage'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { STAFF_ROLE_LABELS } from './missionDetailHelpers'
import type { ReactElement, Dispatch, SetStateAction } from 'react'
import type { MissionResponse } from '../../types/missions'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan, SafeStop } from '../../types/planning'
import type { OrderDetail } from '../../types/orders'
import type { MissionStaffRole } from '../../../mission/types/mission'

export function WizardMissionStep({
  confirmation,
  current,
  orderId,
  embedded,
  initialMissionId,
  returnLabel,
  eligible,
  selection,
  next,
  leave,
  setLiveStep,
  setActiveId,
  setDraft,
  setBusy,
  query,
  setReviewing,
  updateDraft,
  deviceId,
  initialStaff,
}: {
  confirmation: ReturnType<typeof usePlanningConfirmation>
  current: MissionResponse
  orderId: string
  embedded: boolean
  initialMissionId: string | undefined
  returnLabel: string
  eligible: (id: string) => boolean
  selection: ReactElement
  next: () => boolean
  leave: (close?: boolean) => Promise<void>
  setLiveStep: Dispatch<SetStateAction<6 | 7>>
  setActiveId: Dispatch<SetStateAction<string | null>>
  setDraft: Dispatch<SetStateAction<boolean>>
  setBusy: Dispatch<SetStateAction<boolean>>
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    stops: (SafeStop | null)[]
  }>
  setReviewing: Dispatch<SetStateAction<boolean>>
  updateDraft: (dirty: boolean, saving: boolean) => void
  deviceId: string | null
  initialStaff: Partial<Record<MissionStaffRole, string[]>>
}) {
  const { t } = useI18n(commonMiscMessages)
  return (
    <>
      {confirmation.dialog}
      <LiveDispatchPage
        key={current.id}
        missionId={current.id}
        orderContext={{
          orderId,
          order: query.data?.order,
          embeddedInOrderReview: embedded,
          missionScoped: Boolean(initialMissionId),
          returnLabel,
          initialStep: assignmentReadiness(current).step,
          canAssign: eligible(current.id),
          missionSelection: selection,
          onMissionNext: next,
          onReturn: (toOrigin = false) => leave(toOrigin),
          onGlobalStep: setLiveStep,
          onAssigned: () => {
            setActiveId(null)
            setDraft(false)
            setBusy(false)
            query.reload()
            // Mission-scoped flow: step 8 shows every Mission for a final check.
            if (initialMissionId) setReviewing(true)
          },
          onChanged: query.reload,
          onDraftState: updateDraft,
          initialDevices: deviceId ? [deviceId] : [],
          scheduledStartAt: current.scheduledStartAt,
          scheduledEndAt: current.scheduledEndAt,
          initialStaff,
          assignedPeople: [
            ...new Map(
              (current.staffAssignments ?? []).map((person) => [
                person.staffId,
                {
                  id: person.staffId,
                  fullName:
                    person.staffName ||
                    person.staffEmail ||
                    STAFF_ROLE_LABELS[person.assignedRole],
                  email: person.staffEmail || '',
                },
              ]),
            ).values(),
          ],
          assignedDevices: deviceId
            ? [
                {
                  id: deviceId,
                  label:
                    current.deviceCode ||
                    current.droneCode ||
                    current.deviceName ||
                    t.assignedDevice,
                },
              ]
            : [],
        }}
      />
    </>
  )
}
