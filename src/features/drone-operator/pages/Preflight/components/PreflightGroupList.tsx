import { RuntimePreflightItemRow } from './RuntimePreflightItemRow'
import type { PreflightItemDef } from './PreflightItem'
import type { PreflightItemKey } from '../../../types/mission'
import type { ItemState } from '../preflightTypes'

export function PreflightGroupList({
  RUNTIME_GROUPS,
  itemStates,
}: {
  RUNTIME_GROUPS: { items: PreflightItemDef[]; title: string }[]
  itemStates: Partial<Record<PreflightItemKey, ItemState>>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {RUNTIME_GROUPS.map((group) => (
        <div
          key={group.title}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              color: 'var(--tx2)',
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            {group.title}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            {group.items.map((def) => (
              <RuntimePreflightItemRow
                key={def.key}
                def={def}
                state={itemStates[def.key] ?? { result: null }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
