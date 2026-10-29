import { Button } from 'antd'
import { PictureOutlined } from '@ant-design/icons'
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
}

export function DeliverablesCard({
  deliverables,
  loading,
  error,
  onRetry,
  mediaTotals,
}: Props) {
  const { t } = useI18n(deliverablesCardMessages)
  return (
    <Card
      className="co-deliverables-card"
      icon={<PictureOutlined />}
      title={t.cardTitle}
    >
      <p className="co-hint co-card-sub">{t.cardSubtitle}</p>
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
      <div className="co-two co-mt" aria-label={t.mediaSummary}>
        <Metric label={t.requestedPhotos} value={String(mediaTotals.images)} />
        <Metric label={t.requestedVideos} value={String(mediaTotals.videos)} />
      </div>
      <p className="co-hint">{t.mediaFromChecklist}</p>
    </Card>
  )
}
