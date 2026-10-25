import { FILTER_CHIP_VALUES } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { FilterChip } from '../droneHelpers'
import type { Dispatch, SetStateAction } from 'react'

export function DronesStats({
  filter,
  setFilter,
}: {
  filter: FilterChip
  setFilter: Dispatch<SetStateAction<FilterChip>>
}) {
  const { t } = useI18n(dronesPageMessages)
  return (
    <div
      style={{ display: 'flex', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}
    >
      {FILTER_CHIP_VALUES.map((chip) => (
        <button
          key={chip}
          type="button"
          className={`odm-chip${filter === chip ? ' odm-chip-active' : ''}`}
          onClick={() => setFilter(chip)}
        >
          {t.filters[chip]}
        </button>
      ))}
    </div>
  )
}
