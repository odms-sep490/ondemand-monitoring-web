import { CheckOutlined, SearchOutlined } from '@ant-design/icons'
import { memo, useCallback, useRef, type KeyboardEvent } from 'react'
import { StaffAvatar } from './StaffAvatar'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { staffContact } from './liveDispatchHelpers'
import { usePickerPlacement } from './usePickerPlacement'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../mission/types/mission'
import './pickers.css'

const NO_ROLES: MissionStaffRole[] = []

/**
 * One row of the picker. Memoized so that moving the hover/keyboard highlight
 * (activeIndex) or typing re-renders only the rows whose own props changed
 * instead of every option in the list.
 */
const StaffOption = memo(function StaffOption({
  item,
  index,
  usedRoles,
  isSelected,
  isActive,
  roleLabels,
  onActivate,
  onChoose,
}: {
  item: AvailableOperator
  index: number
  usedRoles: MissionStaffRole[]
  isSelected: boolean
  isActive: boolean
  roleLabels: Record<MissionStaffRole, string>
  onActivate: (index: number) => void
  onChoose: (item: AvailableOperator) => void
}) {
  const contact = staffContact(item)
  return (
    <button
      type="button"
      className={`mgr-pk-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
      onMouseEnter={() => onActivate(index)}
      onClick={() => onChoose(item)}
    >
      <StaffAvatar staff={item} />
      <span className="mgr-pk-text">
        <span className="mgr-pk-name-row">
          <span className="mgr-pk-name">{item.fullName}</span>
          {usedRoles.map((usedRole) => (
            <span key={usedRole} className="mgr-pk-roletag">
              {roleLabels[usedRole]}
            </span>
          ))}
        </span>
        {contact ? <span className="mgr-pk-sub">{contact}</span> : null}
        <StaffStatusBadge />
      </span>
      <span className="mgr-pk-check">
        <CheckOutlined aria-hidden="true" />
      </span>
    </button>
  )
})

export function StaffPickerPanel({
  inputRef,
  query,
  t,
  setQuery,
  setActiveIndex,
  handleKeyDown,
  filtered,
  selectedRoleByStaff,
  selectedIds,
  activeIndex,
  choose,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  query: string
  t: (typeof liveDispatchPageMessages)['vi']
  setQuery: Dispatch<SetStateAction<string>>
  setActiveIndex: Dispatch<SetStateAction<number>>
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  filtered: AvailableOperator[]
  selectedRoleByStaff: Map<string, MissionStaffRole[]>
  selectedIds: string[]
  activeIndex: number
  choose: (item: AvailableOperator) => void
}) {
  const placement = usePickerPlacement()
  const chooseRef = useRef(choose)
  chooseRef.current = choose
  const stableChoose = useCallback(
    (item: AvailableOperator) => chooseRef.current(item),
    [],
  )
  return (
    <div ref={placement.ref} className={`mgr-pk-panel${placement.className}`}>
      <div className="mgr-pk-panel-head">
        <div className="mgr-pk-search">
          <SearchOutlined aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            placeholder={t.staffSearchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <span className="mgr-pk-chip">{t.availableFilter}</span>
      </div>
      <div className="mgr-pk-list">
        {filtered.length === 0 ? (
          <div className="mgr-pk-empty">{t.noStaffFound}</div>
        ) : (
          filtered.map((item, index) => (
            <StaffOption
              key={item.id}
              item={item}
              index={index}
              usedRoles={selectedRoleByStaff.get(item.id) ?? NO_ROLES}
              isSelected={selectedIds.includes(item.id)}
              isActive={activeIndex === index}
              roleLabels={t.roles}
              onActivate={setActiveIndex}
              onChoose={stableChoose}
            />
          ))
        )}
      </div>
    </div>
  )
}
