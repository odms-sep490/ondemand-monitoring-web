import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  mediaStatusTone,
  getMediaStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { formatAge } from '../mediaHelpers'
import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaNeedsActionResponse } from '../../../types/media'
import type { Dispatch, SetStateAction } from 'react'
import type { ActiveModal } from '../mediaTypes'

export function ManualUploadTable({
  data,
  setModal,
}: {
  data: MediaNeedsActionResponse
  setModal: Dispatch<SetStateAction<ActiveModal>>
}) {
  const { t, lang } = useI18n(mediaPageMessages)
  return (
    <div>
      <div className="odm-card" style={{ overflow: 'hidden' }}>
        <table className="odm-table">
          <thead>
            <tr>
              <th>{t.manualTab.file}</th>
              <th style={{ width: 145 }}>Mission</th>
              <th>{t.manualTab.reason}</th>
              <th style={{ width: 160 }}>{t.manualTab.assignedOperator}</th>
              <th style={{ width: 120 }}>{t.manualTab.status}</th>
              <th style={{ width: 100 }}>{t.manualTab.createdAt}</th>
              <th style={{ width: 190, textAlign: 'right' }} />
            </tr>
          </thead>
          <tbody>
            {data.manualUploadTasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div style={{ fontWeight: 600 }} className="odm-mono">
                    {task.fileName}
                  </div>
                  <div style={{ color: 'var(--tx3)', fontSize: 11.5 }}>
                    {task.mediaType} · {task.fileSizeLabel} ·{' '}
                    <StatusBadge tone={mediaStatusTone[task.mediaStatus]}>
                      {getMediaStatusLabel(task.mediaStatus, lang)}
                    </StatusBadge>
                  </div>
                </td>
                <td>
                  <span className="odm-mono">{task.missionCode}</span>
                </td>
                <td>
                  <span style={{ lineHeight: 1.4 }}>{task.reason}</span>
                </td>
                <td>{task.assignedOperatorName}</td>
                <td>
                  <StatusBadge tone="yellow">
                    {task.taskStatus === 'OPEN'
                      ? t.manualTab.open
                      : task.taskStatus}
                  </StatusBadge>
                </td>
                <td>
                  <span className="odm-mono" style={{ fontSize: 11.5 }}>
                    {formatAge(task.createdAt, t.age)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="odm-btn odm-btn-sm"
                    onClick={() => setModal({ kind: 'reassign', task })}
                  >
                    {t.manualTab.reassign}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
        {t.manualTab.footnote}
      </div>
    </div>
  )
}
