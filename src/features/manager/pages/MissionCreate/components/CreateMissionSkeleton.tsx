import { useI18n } from '../../../../../shared/i18n'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'

export function CreateMissionSkeleton() {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <div className="odm-or" aria-busy="true" aria-live="polite">
      <span className="odm-sk" style={{ width: '100%', height: 100 }} />
      <span
        className="odm-sk"
        style={{ width: '100%', height: 240, marginTop: 14 }}
      />
      <span
        className="odm-sk"
        style={{ width: '100%', height: 300, marginTop: 14 }}
      />
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
