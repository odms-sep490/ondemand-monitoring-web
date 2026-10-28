import { FilterBar, FilterSegments } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaFilter } from '../../../lib/media/types'
import { libraryToolbarMessages } from './LibraryToolbar.messages'

type Props = { filter: MediaFilter; onChange: (patch: Partial<MediaFilter>) => void }

const KINDS = ['all', 'image', 'video'] as const

export function LibraryToolbar({ filter, onChange }: Props) {
  const { t } = useI18n(libraryToolbarMessages)
  return (
    <FilterBar
      start={
        <FilterSegments<(typeof KINDS)[number]>
          ariaLabel={t.kindLabel}
          options={KINDS.map((kind) => ({ value: kind, label: t.kind[kind] }))}
          value={filter.kind}
          onChange={(kind) => onChange({ kind })}
        />
      }
      search={{
        value: filter.query,
        onChange: (query) => onChange({ query }),
        placeholder: t.searchPlaceholder,
        ariaLabel: t.searchLabel,
      }}
    />
  )
}
