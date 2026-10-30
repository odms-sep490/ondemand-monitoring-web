import { Button } from 'antd'
import { InfoCircleOutlined, PictureOutlined } from '@ant-design/icons'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceDeliverableOption } from '../../../api/customerApi'
import { deliverablesCardMessages } from './DeliverablesCard.messages'
import { Metric } from './Metric'

type Props = {
  deliverables: ServiceDeliverableOption[]
  loading: boolean
  error?: unknown
  onRetry: () => void
  /** Images and videos requested in the checklists; shown, not edited here. */
  mediaTotals: { images: number; videos: number }
  onEditContent?: () => void
}

export function DeliverablesCard({
  deliverables,
  loading,
  error,
  onRetry,
  mediaTotals,
  onEditContent,
}: Props) {
  const { t } = useI18n(deliverablesCardMessages)
  return (
    <Card
      className="co-deliverables-card"
      icon={<PictureOutlined />}
      title={t.cardTitle}
    >
      {!onEditContent ? (
        <p className="co-hint co-card-sub">{t.cardSubtitle}</p>
      ) : null}
      {loading && <p className="co-hint">{t.loading}</p>}
      {!loading && error ? (
        <div className="co-notice is-danger" role="alert">
          <p>{t.loadFailed}</p>
          <Button onClick={onRetry}>{t.retry}</Button>
        </div>
      ) : null}
      {!loading && !error && deliverables.length === 0 ? (
        <p className="co-hint">{t.empty}</p>
      ) : null}
      <div
        className={`co-deliverables-summary${onEditContent ? ' has-edit-content' : ''}`}
      >
        <div className="co-two co-mt" aria-label={t.mediaSummary}>
          <Metric
            label={t.requestedPhotos}
            value={String(mediaTotals.images)}
          />
          <Metric
            label={t.requestedVideos}
            value={String(mediaTotals.videos)}
          />
        </div>
        {onEditContent ? (
          <div className="co-deliverables-guidance">
            <span aria-hidden="true">
              <InfoCircleOutlined />
            </span>
            <div className="co-deliverables-guidance-copy">
              <strong>{t.cardSubtitle}</strong>
              <p className="co-hint co-deliverables-note">
                {t.mediaFromChecklist}
              </p>
            </div>
            <Button type="link" onClick={onEditContent}>
              {t.editContent}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
