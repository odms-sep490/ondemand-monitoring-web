import { CloseOutlined } from '@ant-design/icons'
import { ManagerIcon } from './ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { RefObject } from 'react'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import { Button } from '../../../../shared/components/ui'
import './pickers.css'

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
        className="mgr-pk-selected"
        onClick={openPicker}
      >
        {selectedDevices.map((device) => {
          const [serial, modelPart] = device.label.split(' (')
          const model = modelPart
            ? modelPart.replace(/\)$/, '')
            : t.unknownModel
          return (
            <span key={device.id} className="mgr-pk-item">
              <span aria-hidden="true" className="mgr-pk-avatar is-device">
                <ManagerIcon name="drones" size={18} />
              </span>
              <span className="mgr-pk-text">
                <span className="mgr-pk-name">{serial || t.device}</span>
                <span className="mgr-pk-sub">{model}</span>
                <StaffStatusBadge />
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`${t.clearDevice} ${device.label}`}
                className="mgr-pk-remove"
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
              >
                <CloseOutlined aria-hidden="true" />
              </span>
            </span>
          )
        })}
      </button>
      <div className="mgr-pk-actions">
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="sm"
          onClick={openPicker}
        >
          {t.changeDevice}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          {t.clearDevice}
        </Button>
      </div>
    </>
  )
}
