import { EmptyState } from '../../../components/common/EmptyState'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

/** Shown under the checklist panel when the load succeeded but no execution exists yet. */
export function ChecklistEmptyNote({ show }: { show: boolean }) {
  const { t } = useI18n(missionDetailPageMessages)
  if (!show) return null
  return (
    <div className="odm-or-card">
      <EmptyState title={t.checklistEmpty} />
    </div>
  )
}
