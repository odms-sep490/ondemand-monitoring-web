import { ManagerIcon } from './ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { RefObject, Dispatch, SetStateAction, KeyboardEvent } from 'react'
import type { AvailableDrone } from '../../../staff/api/droneApi'

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
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 80,
        top: 'calc(100% + 8px)',
        left: 0,
        width: 'min(460px, calc(100vw - 48px))',
        maxHeight: 300,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
      }}
    >
      <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 38,
            padding: '0 10px',
            border: '1px solid #e2e8f0',
            borderRadius: 9,
            background: '#f8fafc',
          }}
        >
          <ManagerIcon name="drones" size={15} />
          <input
            ref={inputRef}
            value={query}
            placeholder={t.deviceSearchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              border: 0,
              outline: 0,
              background: 'transparent',
              fontSize: 14,
              color: '#0f172a',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <span
            style={{
              borderRadius: 999,
              padding: '4px 9px',
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {t.availableFilter}
          </span>
        </div>
      </div>
      <div
        role="listbox"
        aria-label={t.chooseDroneAria}
        style={{ maxHeight: 210, overflowY: 'auto', padding: 6 }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: '#64748b', fontSize: 14 }}>
            {t.noAvailableDrones}
          </div>
        ) : (
          filtered.map((item, index) => {
            const isSelected = selectedIds.includes(item.id)
            const isActive = activeIndex === index
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
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px minmax(0, 1fr) auto',
                  gap: 10,
                  alignItems: 'center',
                  width: '100%',
                  minHeight: 62,
                  padding: '8px 10px',
                  border: 0,
                  borderRadius: 10,
                  background: isSelected
                    ? '#eff6ff'
                    : isActive
                      ? '#f8fafc'
                      : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#dbeafe',
                    color: '#2563eb',
                  }}
                >
                  <ManagerIcon name="drones" size={18} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {serial || t.device}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      fontSize: 12,
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {model}
                  </span>
                  <span style={{ display: 'block', marginTop: 5 }}>
                    <StaffStatusBadge />
                  </span>
                </span>
                <span
                  style={{
                    color: isSelected ? '#2563eb' : 'transparent',
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
