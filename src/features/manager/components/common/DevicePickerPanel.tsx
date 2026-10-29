import { CheckOutlined, SearchOutlined } from '@ant-design/icons'
import { ManagerIcon } from './ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { usePickerPlacement } from './usePickerPlacement'
import {
  memo,
  useCallback,
  useRef,
  type RefObject,
  type Dispatch,
  type SetStateAction,
  type KeyboardEvent,
} from 'react'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import './pickers.css'

/** Memoized row: hover/typing re-renders only rows whose own props changed. */
const DeviceOption = memo(function DeviceOption({
  item,
  index,
  isSelected,
  isActive,
  t,
  onActivate,
  onChoose,
}: {
  item: AvailableDrone
  index: number
  isSelected: boolean
  isActive: boolean
  t: (typeof liveDispatchPageMessages)['vi']
  onActivate: (index: number) => void
  onChoose: (item: AvailableDrone) => void
}) {
  const [serial, modelPart] = item.label.split(' (')
  const model = modelPart ? modelPart.replace(/\)$/, '') : t.unknownModel
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-label={`${t.chooseDroneAria} ${item.label}`}
      className={`mgr-pk-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
      onMouseEnter={() => onActivate(index)}
      onClick={() => onChoose(item)}
    >
      <span aria-hidden="true" className="mgr-pk-avatar is-device">
        <ManagerIcon name="drones" size={18} />
      </span>
      <span className="mgr-pk-text">
        <span className="mgr-pk-name is-ellipsis">{serial || t.device}</span>
        <span className="mgr-pk-sub">{model}</span>
        <StaffStatusBadge />
      </span>
      <span className="mgr-pk-check">
        <CheckOutlined aria-hidden="true" />
      </span>
    </button>
  )
})

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
  const chooseRef = useRef(choose)
  chooseRef.current = choose
  const stableChoose = useCallback(
    (item: AvailableDrone) => chooseRef.current(item),
    [],
  )
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
          filtered.map((item, index) => (
            <DeviceOption
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedIds.includes(item.id)}
              isActive={activeIndex === index}
              t={t}
              onActivate={setActiveIndex}
              onChoose={stableChoose}
            />
          ))
        )}
      </div>
    </div>
  )
}
