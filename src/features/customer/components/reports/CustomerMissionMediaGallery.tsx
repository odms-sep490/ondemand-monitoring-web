import { PictureOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { customerMediaApi } from '../../api/customerMediaApi'
import { CardComponent } from '../../../../shared/components/antd'
import { MediaGrid, MediaPreviewModal } from '../common/media'
import { Pager } from '../common/Pager'
import { toMediaItem } from '../../lib/media/mapMedia'
import type { MediaItem } from '../../lib/media/types'
import { customerReportMessages } from './messages'

/** Mounted only after the requested Order/Mission pair has been authorized. */
export function CustomerMissionMediaGallery({
  missionId,
  missionCode,
}: {
  missionId: string
  missionCode: string
}) {
  const { t } = useI18n(customerReportMessages)
  const [page, setPage] = useState(0)
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const query = useApiQuery(
    async (signal) => {
      const data = await customerMediaApi.listMissionMedia(
        missionId,
        page,
        12,
        signal,
      )
      if (data.items.some((item) => item.missionId !== missionId))
        throw new Error('Invalid Mission media scope')
      return data
    },
    [missionId, page],
  )
  return (
    <CardComponent
      className="cr-gallery cr-gallery-card"
      role="region"
      aria-label={t.media}
      icon={<PictureOutlined />}
      title={t.media}
      extra={
        <span className="cr-gallery-extra">
          {!query.loading && !query.error && query.data ? (
            <span className="cr-media-count">{query.data.totalItems}</span>
          ) : null}
          <Button
            disabled={query.loading}
            onClick={() => {
              setPreview(null)
              query.reload()
            }}
          >
            {t.retry}
          </Button>
        </span>
      }
    >
      {query.loading && <p role="status">{t.loading}</p>}
      {query.error ? (
        <p role="alert">{t.error}</p>
      ) : (
        query.data && (
          <>
            {query.data.items.length === 0 ? (
              <div className="cr-media-empty">
                <span aria-hidden="true">▧</span>
                <p>{t.noMissionMedia}</p>
              </div>
            ) : (
              <MediaGrid
                items={query.data.items.map(toMediaItem)}
                onOpen={setPreview}
              />
            )}
            {query.data.totalPages > 1 && (
              <Pager
                page={query.data.page}
                totalPages={query.data.totalPages}
                totalItems={query.data.totalItems}
                unit={t.files}
                onPage={(p) => {
                  setPreview(null)
                  setPage(p)
                }}
              />
            )}
          </>
        )
      )}
      {preview && !query.error && (
        <MediaPreviewModal
          item={preview}
          missionLabel={missionCode}
          onClose={() => setPreview(null)}
          showDetailLink={false}
        />
      )}
    </CardComponent>
  )
}
