import { Alert } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { OperatorMission } from '../../../types/mission'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import { formatHm, formatVnDate } from '../missionFormat'

export function ManagerNoteCard({ mission }: { mission: OperatorMission }) {
  const { t, lang } = useI18n(missionDetailViewMessages)
  return (
    <Alert
      type="warning"
      showIcon
      message={<strong>{t.managerNote(mission.managerName ?? '')}</strong>}
      description={
        <>
          <div>{mission.managerNote}</div>
          {mission.respondBy && mission.status === 'PENDING' && (
            <div style={{ marginTop: 6, fontWeight: 600 }}>
              {t.respondBefore(
                formatVnDate(mission.respondBy.slice(0, 10), lang),
                formatHm(mission.respondBy),
              )}
            </div>
          )}
        </>
      }
    />
  )
}
