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
    <div className="stf-stack">
      {RUNTIME_GROUPS.map((group) => (
        <section key={group.title} className="stf-stack-sm">
          <h2 className="stf-group-title">{group.title}</h2>
          <div className="stf-grid-2 stf-grid-2--even">
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
        </section>
      ))}
    </div>
  )
}
