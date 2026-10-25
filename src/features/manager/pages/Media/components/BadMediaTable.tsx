import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  mediaStatusTone,
  getMediaStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaNeedsActionResponse } from '../../../types/media'
import type { Dispatch, SetStateAction } from 'react'
import type { ActiveModal } from '../mediaTypes'

export function BadMediaTable({
  data,
  setModal,
}: {
  data: MediaNeedsActionResponse
  setModal: Dispatch<SetStateAction<ActiveModal>>
}) {
  const { t, lang } = useI18n(mediaPageMessages)
  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      <table className="odm-table">
        <thead>
          <tr>
            <th>{t.badTab.file}</th>
            <th style={{ width: 145 }}>Mission</th>
            <th style={{ width: 150 }}>{t.badTab.mediaStatus}</th>
            <th>{t.badTab.validationError}</th>
            <th style={{ width: 120 }}>{t.badTab.operator}</th>
            <th style={{ width: 150, textAlign: 'right' }} />
          </tr>
        </thead>
        <tbody>
          {data.badMediaItems.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="odm-mono" style={{ fontWeight: 600 }}>
                  {item.fileName}
                </div>
                <div style={{ color: 'var(--tx3)', fontSize: 11.5 }}>
                  {item.mediaType} · {item.fileSizeLabel}
                </div>
              </td>
              <td>
                <span className="odm-mono">{item.missionCode}</span>
              </td>
              <td>
                <StatusBadge tone={mediaStatusTone[item.mediaStatus]}>
                  {getMediaStatusLabel(item.mediaStatus, lang)}
                </StatusBadge>
              </td>
              <td>
                <span style={{ color: 'var(--red-fg)', lineHeight: 1.4 }}>
                  {item.validationError}
                </span>
              </td>
              <td>{item.operatorName}</td>
              <td style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="odm-btn odm-btn-sm"
                  onClick={() => setModal({ kind: 'reupload', media: item })}
                >
                  {t.badTab.requestReupload}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
