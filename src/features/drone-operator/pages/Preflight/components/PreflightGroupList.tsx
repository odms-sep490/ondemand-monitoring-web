import { RuntimePreflightItemRow } from './RuntimePreflightItemRow'
import type { PreflightItemDef } from './PreflightItem'
import type { PreflightItemKey } from '../../../types/mission'
import type { ItemState } from '../preflightTypes'
import {
  MANUAL_FALLBACK_PREFLIGHT_KEYS,
  MANUAL_PREFLIGHT_KEYS,
} from '../preflightConstants'
import './PreflightChecklist.css'

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
    <div className="preflight-group-list">
      {RUNTIME_GROUPS.map((group) => (
        <div key={group.title} className="preflight-group-list__group">
          <div className="preflight-group-list__title">{group.title}</div>
          <div className="preflight-group-list__items">
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
