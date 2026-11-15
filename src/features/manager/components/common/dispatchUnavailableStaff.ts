import { busyScheduleApi } from '../../../busy-schedule/api/busyScheduleApi'
import {
  busyOverlapping,
  weekAnchorsForWindow,
} from '../../../busy-schedule/lib/busySessions'
import type { BusySchedule } from '../../../busy-schedule/types'
import {
  operatorApi,
  type AvailableOperator,
} from '../../../staff/api/operatorApi'

/**
 * Staff the BE excluded from `GET /api/operators/available?missionId=`.
 * BE excludes them either because they registered a busy session overlapping
 * the mission window (BusySchedule) or because they hold another mission
 * reservation. The reason is a UX hint only; the BE re-validates on assign.
 */
export type UnavailableOperator = AvailableOperator & {
  busySessions: BusySchedule[]
}

const MAX_REASON_LOOKUPS = 25

export type DispatchStaff = {
  people: AvailableOperator[]
  unavailable: UnavailableOperator[]
}

export async function loadDispatchStaff(
  missionId: string,
  window: { start: string; end: string },
): Promise<DispatchStaff> {
  const [people, everyone] = await Promise.all([
    operatorApi.getAvailable(missionId),
    // Without missionId the BE returns every active operator. The directory is
    // best effort: failing here must not block assignment.
    operatorApi.getAvailable().catch(() => [] as AvailableOperator[]),
  ])
  const availableIds = new Set(people.map((person) => person.id))
  const missing = everyone.filter((person) => !availableIds.has(person.id))
  const anchors = weekAnchorsForWindow(window.start, window.end)
  const unavailable = await Promise.all(
    missing.map(async (person, index): Promise<UnavailableOperator> => {
      if (index >= MAX_REASON_LOOKUPS) return { ...person, busySessions: [] }
      const weeks = await Promise.all(
        anchors.map((anchor) =>
          busyScheduleApi.getStaffWeek(person.id, anchor).catch(() => null),
        ),
      )
      const items = weeks.flatMap((week) => week?.items ?? [])
      return {
        ...person,
        busySessions: busyOverlapping(items, window.start, window.end),
      }
    }),
  )
  return { people, unavailable }
}
