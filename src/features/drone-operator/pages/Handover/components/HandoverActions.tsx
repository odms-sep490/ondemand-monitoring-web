import { operatorHref } from '../../../routes'
import { handoverPageMessages } from '../HandoverPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'

export function HandoverActions({
  mission,
  canConfirm,
  handleConfirm,
  submitting,
}: {
  mission: {
    data: BackendMission | undefined
    missionId: string
    loading: boolean
    error: unknown
    allMissions: BackendMission[]
    postflightMissions: BackendMission[]
    selectMission: (id: string) => void
    reload: () => void
  }
  canConfirm: boolean
  handleConfirm: () => Promise<void>
  submitting: boolean
}) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <>
      <a
        className="odm-btn"
        href={operatorHref({
          screen: 'preflight',
          missionId: mission.missionId,
        })}
        style={{ minWidth: 150 }}
      >
        {t.back}
      </a>
      <button
        type="button"
        className="odm-btn odm-btn-p"
        disabled={!canConfirm}
        onClick={handleConfirm}
        style={{ flex: 1 }}
      >
        {submitting ? t.processing : t.confirmHandover}
      </button>
    </>
  )
}
