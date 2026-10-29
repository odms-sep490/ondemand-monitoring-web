import { Button } from 'antd'

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
      <Button
        size="large"
        href={operatorHref({
          screen: 'preflight',
          missionId: mission.missionId,
        })}
      >
        {t.back}
      </Button>
      <Button
        type="primary"
        size="large"
        style={{ flex: 1 }}
        disabled={!canConfirm}
        loading={submitting}
        onClick={handleConfirm}
      >
        {submitting ? t.processing : t.confirmHandover}
      </Button>
    </>
  )
}
