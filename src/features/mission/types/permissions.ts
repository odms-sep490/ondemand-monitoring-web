export type MissionPermissions = {
  canPrepareSafeStopPostflight?: boolean
  canTerminateFlight?: boolean
  canAttachChecklistEvidence?: boolean
  canDetachChecklistEvidence?: boolean
  canRespond: boolean
  canStartMission?: boolean
  canControlFlight: boolean
  canOperatePayload: boolean
  canInspectDevice: boolean
  canMaintainDevice: boolean
  canUploadMedia: boolean
  canCompleteMission?: boolean
  canSubmitMissionResult?: boolean
  canExecuteMonitoringChecklist?: boolean
}

export type MissionAction =
  'connect' | 'handover' | 'flight' | 'preflight' | 'postflight' | 'upload'

export function mayPerformMissionAction(
  permissions: MissionPermissions | null | undefined,
  action: MissionAction,
): boolean {
  if (!permissions) return false
  if (action === 'connect' || action === 'preflight' || action === 'handover')
    return permissions.canOperatePayload === true
  if (action === 'postflight') return permissions.canMaintainDevice === true
  if (action === 'upload')
    return (
      permissions.canUploadMedia === true ||
      permissions.canInspectDevice === true ||
      permissions.canControlFlight === true ||
      permissions.canExecuteMonitoringChecklist === true ||
      permissions.canSubmitMissionResult === true
    )
  return (
    permissions.canControlFlight === true ||
    permissions.canTerminateFlight === true
  )
}
