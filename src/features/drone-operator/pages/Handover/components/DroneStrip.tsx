import { useI18n } from '../../../../../shared/i18n'
import { Icon } from '../../../../../shared/components/Icon'
import { handoverPageMessages } from '../HandoverPage.messages'

export function DroneStrip({
  missionLabel,
  droneLabel,
}: {
  missionLabel: string
  droneLabel: string
}) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <div className="handover-drone-strip">
      <span className="handover-drone-strip__icon">
        <Icon name="link" width={18} height={18} />
      </span>
      <div className="handover-drone-strip__main">
        <div className="handover-drone-strip__title">
          {droneLabel} · {missionLabel}
        </div>
        <div className="handover-drone-strip__detail">{t.assignedToMission}</div>
      </div>
      <span className="odm-badge odm-badge-green odm-badge-lg handover-drone-strip__status">
        <span className="odm-badge-dot" aria-hidden="true" />
        {t.assigned}
      </span>
    </div>
  )
}
