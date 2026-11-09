import { CheckOutlined, SearchOutlined } from '@ant-design/icons'
import type { KeyboardEvent } from 'react'
import { StaffAvatar } from './StaffAvatar'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { staffContact } from './liveDispatchHelpers'
import { usePickerPlacement } from './usePickerPlacement'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../mission/types/mission'
import './pickers.css'

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
          filtered.map((item, index) => {
            const usedRoles = selectedRoleByStaff.get(item.id) ?? []
            const isSelected = selectedIds.includes(item.id)
            const contact = staffContact(item)
            return (
              <button
                key={item.id}
                type="button"
                className={`mgr-pk-option${isSelected ? ' is-selected' : ''}${activeIndex === index ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
              >
                <StaffAvatar staff={item} />
                <span className="mgr-pk-text">
                  <span className="mgr-pk-name-row">
                    <span className="mgr-pk-name">{item.fullName}</span>
                    {usedRoles.map((usedRole) => (
                      <span key={usedRole} className="mgr-pk-roletag">
                        {t.roles[usedRole]}
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
        )}
      </div>
    </div>
  )
}
