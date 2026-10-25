import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import type { Dispatch, SetStateAction } from 'react'

export function MediaToolbar({
  items,
  filter,
  setFilter,
  sort,
  setSort,
  view,
  setView,
}: {
  items: LocalMedia[]
  filter: 'all' | 'pending' | 'uploaded'
  setFilter: Dispatch<SetStateAction<'all' | 'pending' | 'uploaded'>>
  sort: 'newest' | 'oldest'
  setSort: Dispatch<SetStateAction<'newest' | 'oldest'>>
  view: 'grid' | 'list'
  setView: Dispatch<SetStateAction<'grid' | 'list'>>
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  return (
    <header className="upload-media-toolbar">
      <h2>{t.mediaList}</h2>
      <span className="upload-media-count">{t.fileCount(items.length)}</span>
      <div className="upload-media-tools">
        <select
          aria-label={t.filterLabel}
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
        >
          <option value="all">{t.filterAll}</option>
          <option value="pending">{t.filterPending}</option>
          <option value="uploaded">{t.filterUploaded}</option>
        </select>
        <select
          aria-label={t.sortLabel}
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
        >
          <option value="newest">{t.sortNewest}</option>
          <option value="oldest">{t.sortOldest}</option>
        </select>
        <span className="upload-media-seg" role="group">
          <button
            type="button"
            aria-pressed={view === 'grid'}
            aria-label={t.gridView}
            title={t.gridView}
            onClick={() => setView('grid')}
          >
            ▦
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            aria-label={t.listView}
            title={t.listView}
            onClick={() => setView('list')}
          >
            ☰
          </button>
        </span>
      </div>
    </header>
  )
}
