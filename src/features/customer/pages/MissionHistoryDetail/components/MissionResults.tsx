import { PictureOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { Card, EmptyState } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { MediaGrid, MediaPreviewModal } from '../../../components/common/media'
import { Pager } from '../../../components/common/Pager'
import type { MediaItem } from '../../../lib/media/types'
import type { MissionMediaProgress } from '../../../lib/missionHistory/types'
import type { useMissionDetail } from '../hooks/useMissionDetail'
import { MediaProgressPanel } from './MediaProgressPanel'
import { missionResultsMessages } from './MissionResults.messages'

type Detail = ReturnType<typeof useMissionDetail>
type Props = { detail: Detail; missionCode: string }

function ProgressBody({ progress, onRetry }: { progress: UseApiQueryState<MissionMediaProgress>; onRetry: () => void }) {
  const { t } = useI18n(missionResultsMessages)
  if (progress.loading && !progress.data) return <p className="mhd-note" role="status">{t.progressLoading}</p>
  if (!progress.data) {
    return (
      <div className="mhd-error" role="alert">
        <span>{t.progressError}</span>
        <Button size="small" onClick={onRetry}>
          {t.retry}
        </Button>
      </div>
    )
  }
  return <MediaProgressPanel progress={progress.data} />
}

/** Result counts and the paged file grid of one mission. */
export function MissionResults({ detail, missionCode }: Props) {
  const { t } = useI18n(missionResultsMessages)
  const { media } = detail
  const data = media.data
  const open = (item: MediaItem) => detail.openPreview(item.id)

  return (
    <Card
      icon={<PictureOutlined />}
      title={t.title}
      actions={
        <Button
          size="small"
          disabled={detail.progress.loading || media.loading}
          onClick={detail.refreshResults}
        >
          {t.refresh}
        </Button>
      }
    >
      <div className="mhd-results">
        <ProgressBody progress={detail.progress} onRetry={detail.refreshResults} />
        {media.loading && !data && <p className="mhd-note" role="status">{t.loading}</p>}
        {media.error !== undefined && !media.loading && (
          <div className="mhd-error" role="alert">
            <span>{t.error}</span>
            <Button size="small" onClick={media.reload}>
              {t.retry}
            </Button>
          </div>
        )}
        {data && data.items.length === 0 && (
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        )}
        {data && data.items.length > 0 && (
          <>
            <MediaGrid items={data.items} onOpen={open} />
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              unit={t.unit}
              onPage={detail.setPage}
            />
          </>
        )}
      </div>
      {detail.preview && (
        <MediaPreviewModal
          item={detail.preview}
          missionLabel={missionCode}
          onClose={detail.closePreview}
          onPrev={detail.prevPreview}
          onNext={detail.nextPreview}
        />
      )}
    </Card>
  )
}
