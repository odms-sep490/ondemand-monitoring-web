import { ErrorState, LoadingState } from '../../components/common/StateView'
import { PageHeader } from '../../../../shared/components/ui'
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
    <div className="ml-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <button type="button" className="odm-btn odm-btn-gh" onClick={lib.reload}>
            {t.refresh}
          </button>
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
          <LibraryToolbar filter={lib.filter} onChange={lib.setFilter} />
          {lib.totalFiltered === 0 ? (
            <LibraryEmpty filtered={lib.isFiltered} onClear={lib.clearFilter} />
          ) : (
            <>
              <MediaGrid items={lib.pageItems} onOpen={(item) => lib.openPreview(item.id)} />
              <Pager
                page={lib.page}
                totalPages={lib.totalPages}
                totalItems={lib.totalFiltered}
                unit={t.unit}
                onPage={lib.setPage}
              />
            </>
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
