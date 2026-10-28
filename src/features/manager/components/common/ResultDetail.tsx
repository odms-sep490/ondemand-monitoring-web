import type { MissionResultResponse, MediaResponse } from '../../types/missions'
import { useI18n } from '../../../../shared/i18n'
import { detailPanelsMessages } from './detailPanels.messages'
import {
  checkTone,
  checkLabel,
  formatDateTime,
  formatDuration,
  formatNumber,
} from './missionDetailHelpers'

export function ResultDetail({
  result,
  media,
  locale,
  mediaLimit = 4,
}: {
  result: MissionResultResponse | null
  media: MediaResponse[]
  locale: 'vi-VN' | 'en-US'
  mediaLimit?: number
}) {
  const { t } = useI18n(detailPanelsMessages)
  const mediaCount =
    result?.mediaCount ?? result?.mediaFiles?.length ?? media.length
  return (
    <div className="odm-or-detail-stack">
      {result ? (
        <>
          <div className="odm-or-result-line">
            <span
              className={`odm-or-pill odm-or-pill-${checkTone(result.status)}`}
            >
              {checkLabel(result.status)}
            </span>
            <span
              className={`odm-or-pill odm-or-pill-${checkTone(result.approvalStatus)}`}
            >
              {checkLabel(result.approvalStatus)}
            </span>
          </div>
          <dl className="odm-or-kv compact">
            <div>
              <dt>{t.submittedAt}</dt>
              <dd>
                {result.approvalStatus === 'DRAFT'
                  ? t.notSubmitted
                  : formatDateTime(result.submittedAt, locale)}
              </dd>
            </div>
            <div>
              <dt>{t.actualDuration}</dt>
              <dd>{formatDuration(result.durationSeconds)}</dd>
            </div>
            <div>
              <dt>{t.mediaCount}</dt>
              <dd>{mediaCount}</dd>
            </div>
          </dl>
          {result.summary || result.notes ? (
            <p className="odm-or-detail-note">
              {result.summary ?? result.notes}
            </p>
          ) : null}
        </>
      ) : (
        <div className="odm-or-empty">{t.noResult}</div>
      )}
      {media.length > 0 ? (
        <ul className="odm-or-media-list">
          {media.slice(0, mediaLimit).map((item) => (
            <li key={item.id}>
              <span className="odm-mono">{item.type}</span>
              <span>{formatNumber(item.fileSize / 1024 / 1024, ' MB')}</span>
              <time>{formatDateTime(item.capturedAt, locale)}</time>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
