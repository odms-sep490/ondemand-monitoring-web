import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Radio, Select } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import { uploadMediaPageMessages } from '../UploadMediaPage.messages'

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
    <header className="stf-toolbar">
      <h2 className="stf-toolbar-title">{t.mediaList}</h2>
      <StatusTag tone="info">{t.fileCount(items.length)}</StatusTag>
      <div className="stf-toolbar-tools">
        <Select
          aria-label={t.filterLabel}
          value={filter}
          onChange={(value) => setFilter(value)}
          style={{ minWidth: 130 }}
          options={[
            { value: 'all', label: t.filterAll },
            { value: 'pending', label: t.filterPending },
            { value: 'uploaded', label: t.filterUploaded },
          ]}
        />
        <Select
          aria-label={t.sortLabel}
          value={sort}
          onChange={(value) => setSort(value)}
          style={{ minWidth: 120 }}
          options={[
            { value: 'newest', label: t.sortNewest },
            { value: 'oldest', label: t.sortOldest },
          ]}
        />
        <Radio.Group
          optionType="button"
          value={view}
          onChange={(event) => setView(event.target.value)}
          options={[
            {
              value: 'grid',
              label: (
                <span aria-label={t.gridView} title={t.gridView}>
                  <AppstoreOutlined aria-hidden="true" />
                </span>
              ),
            },
            {
              value: 'list',
              label: (
                <span aria-label={t.listView} title={t.listView}>
                  <UnorderedListOutlined aria-hidden="true" />
                </span>
              ),
            },
          ]}
        />
      </div>
    </header>
  )
}
