import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons'

import { useI18n } from '../../../../../shared/i18n'
import type { MissionMediaProgress } from '../../../lib/missionHistory/types'
import { mediaProgressPanelMessages } from './MediaProgressPanel.messages'

/** Result availability from `GET /api/customer/missions/{id}/media-status`. */
export function MediaProgressPanel({ progress }: { progress: MissionMediaProgress }) {
  const { t } = useI18n(mediaProgressPanelMessages)
  return (
    <div className="mhd-progress">
      <div className="mhd-stats">
        <span><CheckCircleOutlined /> {t.available}: <strong>{progress.available}</strong></span>
        {progress.processing > 0 && <span><SyncOutlined /> {t.processing}: <strong>{progress.processing}</strong></span>}
        {progress.rejected > 0 && <span><CloseCircleOutlined /> {t.rejected}: <strong>{progress.rejected}</strong></span>}
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
