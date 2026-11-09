import { DownOutlined } from '@ant-design/icons'
import { ManagerIcon } from './ManagerIcon'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { RefObject } from 'react'
import './pickers.css'

export function DeviceEmptyTrigger({
  triggerRef,
  openPicker,
  t,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  t: (typeof liveDispatchPageMessages)['vi']
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      className="mgr-pk-trigger"
      onClick={openPicker}
      aria-label={t.chooseDroneAria}
    >
      <span className="mgr-pk-trigger-label">
        <span className="mgr-pk-trigger-icon">
          <ManagerIcon name="drones" size={16} />
        </span>
        <span>{t.chooseDroneOption}</span>
      </span>
      <DownOutlined className="mgr-pk-caret" aria-hidden="true" />
    </button>
  )
}
