import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons'

import { StatCard } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionMediaProgress } from '../../../lib/missionHistory/types'
import { mediaProgressPanelMessages } from './MediaProgressPanel.messages'

/** Result availability from `GET /api/customer/missions/{id}/media-status`. */
export function MediaProgressPanel({ progress }: { progress: MissionMediaProgress }) {
  const { t } = useI18n(mediaProgressPanelMessages)
  return (
    <div className="mhd-progress">
      <div className="mhd-stats">
        <StatCard label={t.available} value={progress.available} tone="success" icon={<CheckCircleOutlined />} />
        <StatCard
          icon={<SyncOutlined />}
          label={t.processing}
          value={progress.processing}
          tone={progress.processing > 0 ? 'warning' : 'default'}
        />
        <StatCard
          icon={<CloseCircleOutlined />}
          label={t.rejected}
          value={progress.rejected}
          tone={progress.rejected > 0 ? 'danger' : 'default'}
        />
      </div>
      {progress.phase === 'processing' && (
        <p className="mhd-note" role="status">
          {t.processingNote(progress.processing)}
        </p>
      )}
      {progress.rejected > 0 && <p className="mhd-note">{t.rejectedNote(progress.rejected)}</p>}
    </div>
  )
}
