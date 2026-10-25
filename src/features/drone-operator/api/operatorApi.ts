import { authSession } from '../../auth/api/authApi'
import { missionApi } from '../../mission/api/missionApi'
import { toOperatorMission, type BackendMission } from './liveMission'
import type { AvailabilityStatus } from '../lib/availabilitySlots'
import type {
  OperatorMission,
  OperatorMissionTab,
  OperatorProfile,
} from '../types/mission'

const availabilityStorageKey = (week: string) =>
  `omss.operator.availability.${week}`

function readAvailability(week: string): Record<string, AvailabilityStatus> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(availabilityStorageKey(week))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAvailability(
  week: string,
  slots: Record<string, AvailabilityStatus>,
) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    availabilityStorageKey(week),
    JSON.stringify(slots),
  )
}

export const operatorApi = {
  getProfile: async (_signal?: AbortSignal): Promise<OperatorProfile> => {
    void _signal
    const user = authSession.getUser()
    if (!user) throw new Error('Please sign in as a drone operator')
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      rank: '',
      station: '',
      certExpiry: '',
    }
  },

  listMissions: async (tab?: OperatorMissionTab, _signal?: AbortSignal) => {
    void _signal
    const missions =
      (await missionApi.getMyMissions()) as unknown as BackendMission[]
    const currentUserId = authSession.getUser()?.id
    const items = await Promise.all(
      missions.map(async (mission) => {
        const item = toOperatorMission(mission, currentUserId)
        const permissions = await missionApi
          .getPermissions(mission.id)
          .then((value) => ({
            canControlFlight: value.canControlFlight,
            canStartMission: value.canStartMission,
            canTerminateFlight: value.canTerminateFlight,
            canOperatePayload: value.canOperatePayload,
            canInspectDevice: value.canInspectDevice,
            canMaintainDevice: value.canMaintainDevice,
            canUploadMedia: value.canUploadMedia,
            canCompleteMission: value.canCompleteMission,
            canSubmitMissionResult: value.canSubmitMissionResult,
            canExecuteMonitoringChecklist: value.canExecuteMonitoringChecklist,
            canAttachChecklistEvidence: value.canAttachChecklistEvidence,
            canDetachChecklistEvidence: value.canDetachChecklistEvidence,
          }))
          .catch(() => undefined)
        const itemWithPermissions = permissions
          ? { ...item, permissions }
          : item
        if (
          itemWithPermissions.status !== 'COMPLETED' &&
          itemWithPermissions.status !== 'FAILED'
        ) {
          return itemWithPermissions
        }

        try {
          const result = await missionApi.getMissionResult(mission.id)
          return {
            ...itemWithPermissions,
            managerSubmissionStatus:
              result?.approvalStatus === 'APPROVED'
                ? 'SENT_TO_CUSTOMER'
                : result?.approvalStatus === 'PENDING_MANAGER_APPROVAL'
                  ? 'PENDING_MANAGER'
                  : 'NEEDS_SUBMIT',
          } satisfies OperatorMission
        } catch {
          return {
            ...itemWithPermissions,
            managerSubmissionStatus: 'NEEDS_SUBMIT',
          } satisfies OperatorMission
        }
      }),
    )
    if (!tab) return { items }
    const statuses: Record<OperatorMissionTab, OperatorMission['status'][]> = {
      pending: ['PENDING'],
      upcoming: ['ACCEPTED', 'IN_FLIGHT'],
      history: ['COMPLETED', 'REJECTED', 'FAILED'],
    }
    return {
      items: items.filter((item) => statuses[tab].includes(item.status)),
    }
  },

  getMission: async (missionId: string, _signal?: AbortSignal) =>
    (void _signal, toOperatorMission(
      (await missionApi.getMissionById(missionId)) as unknown as BackendMission,
      authSession.getUser()?.id,
    )),

  acceptMission: async (missionId: string, _signal?: AbortSignal) =>
    (void _signal, toOperatorMission(
      (await missionApi.acceptMyMission(
        missionId,
      )) as unknown as BackendMission,
      authSession.getUser()?.id,
    )),

  rejectMission: async (
    missionId: string,
    body: { reason: string; notes?: string },
    _signal?: AbortSignal,
  ) =>
    (void _signal, toOperatorMission(
      (await missionApi.rejectMyMission(
        missionId,
        body.reason,
      )) as unknown as BackendMission,
      authSession.getUser()?.id,
    )),

  getAvailability: async (week: string, signal?: AbortSignal) => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return { week, slots: readAvailability(week) }
  },

  saveAvailability: (
    body: { week: string; slots: Record<string, AvailabilityStatus> },
    signal?: AbortSignal,
  ) => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    writeAvailability(body.week, body.slots)
    return Promise.resolve(body)
  },
}
