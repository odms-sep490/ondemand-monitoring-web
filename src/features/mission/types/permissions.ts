export type MissionPermissions = {
  canAttachChecklistEvidence?: boolean
  canDetachChecklistEvidence?: boolean
  canRespond: boolean
  canStartMission?: boolean
  canCancelMission?: boolean
  canControlFlight: boolean
  canOperatePayload: boolean
  canInspectDevice: boolean
  canMaintainDevice: boolean
  canUploadMedia: boolean
  canCompleteMission?: boolean
  canConfirmMissionFailure?: boolean
  canSubmitMissionResult?: boolean
  canExecuteMonitoringChecklist?: boolean
  canAccessMissionInspection?: boolean
  canAssessMonitoringChecklist?: boolean
  canReviewMissionMedia?: boolean
}

export type MissionAction =
  | 'connect'
  | 'handover'
  | 'flight'
  | 'preflight'
  | 'postflight'
  | 'upload'
  | 'corrections'

export function mayPerformMissionAction(
  permissions: MissionPermissions | null | undefined,
  action: MissionAction,
): boolean {
  if (!permissions) return false
  if (action === 'connect' || action === 'preflight' || action === 'handover')
    return permissions.canOperatePayload === true
  if (action === 'postflight')
    return permissions.canMaintainDevice === true || permissions.canAccessMissionInspection === true
  if (action === 'corrections')
    return (
      permissions.canAttachChecklistEvidence === true ||
      permissions.canExecuteMonitoringChecklist === true ||
      hasInspectionWorkspaceAccess(permissions)
    )
  if (action === 'upload')
    return (
      permissions.canUploadMedia === true ||
      permissions.canInspectDevice === true ||
      permissions.canControlFlight === true ||
      permissions.canExecuteMonitoringChecklist === true ||
      permissions.canSubmitMissionResult === true ||
      permissions.canAccessMissionInspection === true
    )
  return (
    permissions.canControlFlight === true
  )
}

/** Workspace access is independent of whether checklist assessment is currently unlocked. */
export function hasInspectionWorkspaceAccess(permissions: MissionPermissions | null | undefined): boolean {
  if (!permissions) return false
  return permissions.canAccessMissionInspection ?? (
    permissions.canAssessMonitoringChecklist === true || permissions.canCompleteMission === true ||
    permissions.canConfirmMissionFailure === true || permissions.canSubmitMissionResult === true
  )
}
