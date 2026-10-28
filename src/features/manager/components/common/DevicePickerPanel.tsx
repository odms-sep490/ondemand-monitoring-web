import { CheckOutlined, SearchOutlined } from '@ant-design/icons'
import { ManagerIcon } from './ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { usePickerPlacement } from './usePickerPlacement'
import type { RefObject, Dispatch, SetStateAction, KeyboardEvent } from 'react'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import './pickers.css'

export function DevicePickerPanel({
  inputRef,
  query,
  t,
  setQuery,
  setActiveIndex,
  handleKeyDown,
  filtered,
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
  filtered: AvailableDrone[]
  selectedIds: string[]
  activeIndex: number
  choose: (item: AvailableDrone) => void
}) {
  const placement = usePickerPlacement()
  return (
    <div
      ref={placement.ref}
      className={`mgr-pk-panel is-wide${placement.className}`}
    >
      <div className="mgr-pk-panel-head">
        <div className="mgr-pk-search">
          <SearchOutlined aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            placeholder={t.deviceSearchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <span className="mgr-pk-chip">{t.availableFilter}</span>
      </div>
      <div className="mgr-pk-list" role="listbox" aria-label={t.chooseDroneAria}>
        {filtered.length === 0 ? (
          <div className="mgr-pk-empty">{t.noAvailableDrones}</div>
        ) : (
          filtered.map((item, index) => {
            const isSelected = selectedIds.includes(item.id)
            const [serial, modelPart] = item.label.split(' (')
            const model = modelPart
              ? modelPart.replace(/\)$/, '')
              : t.unknownModel
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${t.chooseDroneAria} ${item.label}`}
                className={`mgr-pk-option${isSelected ? ' is-selected' : ''}${activeIndex === index ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
              >
                <span aria-hidden="true" className="mgr-pk-avatar is-device">
                  <ManagerIcon name="drones" size={18} />
                </span>
                <span className="mgr-pk-text">
                  <span className="mgr-pk-name is-ellipsis">
                    {serial || t.device}
                  </span>
                  <span className="mgr-pk-sub">{model}</span>
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
