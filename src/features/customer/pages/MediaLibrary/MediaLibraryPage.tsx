import { ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { ErrorState, LoadingState } from '../../components/common/StateView'
import { PageHeader } from '../../components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { MediaGrid, MediaPreviewModal } from '../../components/common/media'
import { Pager } from '../../components/common/Pager'
import { shortId } from '../../lib/media/mapMedia'
import { LibraryEmpty } from './components/LibraryEmpty'
import { LibraryToolbar } from './components/LibraryToolbar'
import { MissionSidebar } from './components/MissionSidebar'
import { NewMediaNotice } from './components/NewMediaNotice'
import { useMediaLibrary } from './hooks/useMediaLibrary'
import './MediaLibrary.css'
import { mediaLibraryPageMessages } from './MediaLibraryPage.messages'

/** Customer result library backed by `GET /api/customer/available-media`. */
export function MediaLibraryPage() {
  const { t } = useI18n(mediaLibraryPageMessages)
  const lib = useMediaLibrary()

  if (lib.media.loading && !lib.loaded) return <LoadingState />
  if (!lib.loaded) {
    return <ErrorState title={t.errorTitle} error={lib.media.error} onRetry={lib.reload} />
  }

  return (
    <div className="cus-page ml-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button icon={<ReloadOutlined aria-hidden="true" aria-label={undefined} />} onClick={lib.reload}>
            {t.refresh}
          </Button>
        }
      />
      <NewMediaNotice count={lib.notificationCount} />
      <div className="ml-layout">
        <MissionSidebar
          groups={lib.groups}
          total={lib.total}
          selected={lib.filter.missionId}
          onSelect={(missionId) => lib.setFilter({ missionId })}
        />
        <div className="ml-main">
          <LibraryToolbar
            filter={lib.filter}
            counts={lib.kindCounts}
            onChange={lib.setFilter}
          />
          {lib.totalFiltered === 0 ? (
            <LibraryEmpty filtered={lib.isFiltered} onClear={lib.clearFilter} />
          ) : (
            <CardComponent styles={{ body: { padding: 16 } }}>
              <MediaGrid
                items={lib.pageItems}
                missionLabels={lib.filter.missionId === null ? lib.labels : undefined}
                onOpen={(item) => lib.openPreview(item.id)}
              />
              <Pager
                page={lib.page}
                totalPages={lib.totalPages}
                totalItems={lib.totalFiltered}
                unit={t.unit}
                onPage={lib.setPage}
              />
            </CardComponent>
          )}
        </div>
      </div>
      {lib.preview && (
        <MediaPreviewModal
          item={lib.preview}
          missionLabel={lib.labels[lib.preview.missionId] ?? shortId(lib.preview.missionId)}
          onClose={lib.closePreview}
          onPrev={lib.prevPreview}
          onNext={lib.nextPreview}
        />
      )}
    </div>
  )
}
