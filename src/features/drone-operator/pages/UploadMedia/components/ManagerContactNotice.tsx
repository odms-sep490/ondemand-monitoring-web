import { Alert, Button } from 'antd'

import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import type { BackendMission } from '../../../api/liveMission'

export function ManagerContactNotice({
  permissions,
  inspector,
  showManagerContact,
  activeMission,
}: {
  permissions: UseApiQueryState<MissionPermissions>
  inspector:
    | {
        staffId?: string | null | undefined
        staffName?: string | null | undefined
        staffEmail?: string | null | undefined
        staffPhone?: string | null | undefined
        assignedRole?: string | null | undefined
        responseStatus?: string | null | undefined
      }
    | undefined
  showManagerContact: boolean
  activeMission: {
    data: BackendMission | undefined
    missionId: string
    loading: boolean
    error: unknown
    allMissions: BackendMission[]
    postflightMissions: BackendMission[]
    selectMission: (id: string) => void
    reload: () => void
  }
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  const phone = showManagerContact
    ? activeMission.data?.managerPhone
    : inspector?.staffPhone
  return (
    <Alert
      role="status"
      type="info"
      showIcon
      message={
        permissions.error
          ? t.permissionsUnavailable
          : permissions.loading
            ? t.checkingPermissions
            : t.uploadPermissionNote
      }
      description={
        !permissions.loading && !permissions.error && inspector ? (
          <div
            className="stf-row"
            style={{ justifyContent: 'space-between', marginTop: 4 }}
          >
            <div className="stf-stack-sm" style={{ gap: 2 }}>
              <strong>
                {showManagerContact ? t.managerContact : t.inspectorContact}
              </strong>
              <span>
                {showManagerContact
                  ? activeMission.data?.managerName || t.notUpdated
                  : inspector.staffName || t.notUpdated}
              </span>
              <small className="stf-muted">
                {showManagerContact
                  ? activeMission.data?.managerEmail || t.notUpdated
                  : `${t.responseStatus(inspector.responseStatus)}${
                      inspector.staffEmail ? ` · ${inspector.staffEmail}` : ''
                    }`}
              </small>
            </div>
            {phone ? (
              <Button type="primary" href={`tel:${phone}`}>
                {showManagerContact
                  ? t.callManager(activeMission.data?.managerPhone ?? '')
                  : t.callInspector(inspector.staffPhone ?? '')}
              </Button>
            ) : (
              <span className="stf-muted">{t.phoneNotUpdated}</span>
            )}
          </div>
        ) : null
      }
    />
  )
}
