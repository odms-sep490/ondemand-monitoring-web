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
  variant?: 'default' | 'inline'
}

export function DeliverablesCard({
  deliverables,
  loading,
  error,
  onRetry,
  mediaTotals,
  onEditContent,
  variant = 'default',
}: Props) {
  const { t } = useI18n(deliverablesCardMessages)

  if (variant === 'inline') {
    return (
      <section className="co-deliverables-inline" aria-label={t.mediaSummary}>
        <div className="co-deliverables-inline-state">
          {loading && <p className="co-hint">{t.loading}</p>}
          {!loading && Boolean(error) && (
            <div className="co-deliverables-error" role="alert">
              <p>{t.loadFailed}</p>
              <Button onClick={onRetry}>{t.retry}</Button>
            </div>
          )}
          {!loading && !error && deliverables.length === 0 && (
            <p className="co-hint">{t.empty}</p>
          )}
        </div>
        <div
          className="co-deliverables-counts"
          role="group"
          aria-label={t.mediaSummary}
        >
          <span>
            <strong>{mediaTotals.images}</strong> {t.photo}
          </span>
          <span>
            <strong>{mediaTotals.videos}</strong> {t.video}
          </span>
          <span className="co-deliverables-source">
            {t.derivedFromChecklist}
          </span>
        </div>
      </section>
    )
  }

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
            value={
              mediaTotals.images ? String(mediaTotals.images) : t.notRequested
            }
            detail={mediaTotals.images ? t.derivedFromChecklist : undefined}
          />
          <Metric
            label={t.requestedVideos}
            value={
              mediaTotals.videos ? String(mediaTotals.videos) : t.notRequested
            }
            detail={mediaTotals.videos ? t.derivedFromChecklist : undefined}
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
