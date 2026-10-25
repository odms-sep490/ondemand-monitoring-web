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
  return (
    <div role="status" className="upload-media-notice upload-media-contact">
      <p>
        {permissions.error
          ? t.permissionsUnavailable
          : permissions.loading
            ? t.checkingPermissions
            : t.uploadPermissionNote}
      </p>
      {!permissions.loading && !permissions.error && inspector ? (
        <div className="upload-media-contact-row">
          <div>
            <strong>
              {showManagerContact ? t.managerContact : t.inspectorContact}
            </strong>
            <span>
              {showManagerContact
                ? activeMission.data?.managerName || t.notUpdated
                : inspector.staffName || t.notUpdated}
            </span>
            <small>
              {showManagerContact
                ? activeMission.data?.managerEmail || t.notUpdated
                : `${t.responseStatus(inspector.responseStatus)}${
                    inspector.staffEmail ? ` · ${inspector.staffEmail}` : ''
                  }`}
            </small>
          </div>
          {(
            showManagerContact
              ? activeMission.data?.managerPhone
              : inspector.staffPhone
          ) ? (
            <a
              className="odm-btn odm-btn-p"
              href={`tel:${
                showManagerContact
                  ? activeMission.data?.managerPhone
                  : inspector.staffPhone
              }`}
            >
              {showManagerContact
                ? t.callManager(activeMission.data?.managerPhone ?? '')
                : t.callInspector(inspector.staffPhone ?? '')}
            </a>
          ) : (
            <span className="upload-media-contact-missing">
              {t.phoneNotUpdated}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
