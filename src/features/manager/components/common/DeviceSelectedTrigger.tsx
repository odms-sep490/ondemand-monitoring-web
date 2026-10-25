import { ManagerIcon } from './ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { RefObject } from 'react'
import type { AvailableDrone } from '../../../staff/api/droneApi'

export function DeviceSelectedTrigger({
  triggerRef,
  openPicker,
  selectedDevices,
  t,
  onRemove,
  onClear,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  selectedDevices: AvailableDrone[]
  t: (typeof liveDispatchPageMessages)['vi']
  onRemove: (deviceId: string) => void
  onClear: () => void
}) {
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        style={{
          display: 'grid',
          gap: 8,
          width: '100%',
          minHeight: 74,
          padding: 10,
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          background: '#eff6ff',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {selectedDevices.map((device) => {
          const [serial, modelPart] = device.label.split(' (')
          const model = modelPart
            ? modelPart.replace(/\)$/, '')
            : t.unknownModel
          return (
            <span
              key={device.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px minmax(0, 1fr) auto',
                gap: 10,
                alignItems: 'center',
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
                role="button"
                tabIndex={0}
                aria-label={`${t.clearDevice} ${device.label}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(device.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    onRemove(device.id)
                  }
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: 'inline-grid',
                  placeItems: 'center',
                  color: '#64748b',
                  background: '#fff',
                  border: '1px solid #dbeafe',
                  fontSize: 18,
                }}
              >
                ×
              </span>
            </span>
          )
        })}
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          ref={triggerRef}
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          onClick={openPicker}
          style={{ minHeight: 30, borderRadius: 8 }}
        >
          {t.changeDevice}
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          onClick={onClear}
          style={{ minHeight: 30, borderRadius: 8 }}
        >
          {t.clearDevice}
        </button>
      </div>
    </>
  )
}
