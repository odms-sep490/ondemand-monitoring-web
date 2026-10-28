import { RuntimePreflightItemRow } from './RuntimePreflightItemRow'
import type { PreflightItemDef } from './PreflightItem'
import type { PreflightItemKey } from '../../../types/mission'
import type { ItemState } from '../preflightTypes'
import {
  MANUAL_FALLBACK_PREFLIGHT_KEYS,
  MANUAL_PREFLIGHT_KEYS,
} from '../preflightConstants'

export function PreflightGroupList({
  RUNTIME_GROUPS,
  itemStates,
  onUpdateItem,
  onRecheckItem,
  updatingItem,
}: {
  RUNTIME_GROUPS: { items: PreflightItemDef[]; title: string }[]
  itemStates: Partial<Record<PreflightItemKey, ItemState>>
  onUpdateItem: (
    checkType: string,
    status: 'PASSED' | 'FAILED',
    message: string,
  ) => Promise<void>
  onRecheckItem: (checkType: string) => Promise<void>
  updatingItem: string | null
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
                manual={
                  MANUAL_PREFLIGHT_KEYS.has(def.key) ||
                  (MANUAL_FALLBACK_PREFLIGHT_KEYS.has(def.key) &&
                    itemStates[def.key]?.result !== 'ok')
                }
                updating={updatingItem === def.key}
                onUpdate={onUpdateItem}
                onRecheck={onRecheckItem}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
