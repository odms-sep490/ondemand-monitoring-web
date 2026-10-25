/** Safe-stop overlays presentation, without changing the persisted Mission lifecycle. */
export type MissionStopMetadata = {
  safeStopStatus?: string | null
  safeStopRequestedAt?: string | null
  safeStopConfirmedAt?: string | null
  safeStopCleanedAt?: string | null
}

export function missionHasSafeStop(
  mission: MissionStopMetadata | null | undefined,
): boolean {
  return Boolean(
    mission?.safeStopStatus ||
    mission?.safeStopRequestedAt ||
    mission?.safeStopConfirmedAt ||
    mission?.safeStopCleanedAt,
  )
}

export function missionStopLabel(
  mission:
    | (MissionStopMetadata & {
        status?: string
        backendStatus?: string
      })
    | null
    | undefined,
): string | null {
  if (!mission) return null
  if ((mission.backendStatus ?? mission.status) === 'CANCELLED') return 'Đã hủy'
  if (!missionHasSafeStop(mission)) return null
  if (mission.safeStopStatus === 'FAILED') return 'Dừng an toàn cần xử lý lại'
  if (
    mission.safeStopCleanedAt ||
    mission.safeStopStatus === 'READY_FOR_CANCELLATION'
  )
    return 'Sẵn sàng hủy'
  if (mission.safeStopConfirmedAt) return 'Đã xác nhận an toàn'
  return 'Đang dừng an toàn'
}

export function maySendFlightCommand(
  command: string,
  normal: boolean,
  terminate: boolean,
): boolean {
  return (
    normal ||
    (terminate &&
      ['return_to_base', 'land', 'stop', 'emergency_stop'].includes(command))
  )
}

/** Narrow an explicit capability using the Mission snapshot; never infer permission from status. */
export function missionMayTerminate(
  mission:
    | (MissionStopMetadata & { status?: string; backendStatus?: string })
    | null
    | undefined,
  permitted?: boolean,
): boolean {
  return (
    mission != null &&
    permitted === true &&
    missionHasSafeStop(mission) &&
    !mission.safeStopConfirmedAt &&
    !mission.safeStopCleanedAt &&
    mission.safeStopStatus !== 'READY_FOR_CANCELLATION' &&
    [
      'CONNECTED',
      'PREFLIGHT_CHECKING',
      'READY_TO_FLY',
      'IN_FLIGHT',
      'IN_PROGRESS',
      'RETURNING',
    ].includes(mission.backendStatus ?? mission.status ?? '')
  )
}
