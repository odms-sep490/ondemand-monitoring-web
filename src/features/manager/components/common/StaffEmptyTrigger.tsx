import { DownOutlined } from '@ant-design/icons'
import { StaffRoleIcon } from './StaffRoleIcon'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { RefObject } from 'react'
import './pickers.css'

export function StaffEmptyTrigger({
  triggerRef,
  openPicker,
  t,
  role,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  t: (typeof liveDispatchPageMessages)['vi']
  role: MissionStaffRole
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      className="mgr-pk-trigger"
      onClick={openPicker}
      aria-label={t.chooseOperatorAria(t.roles[role])}
    >
      <span className="mgr-pk-trigger-label">
        <span className="mgr-pk-trigger-icon">
          <StaffRoleIcon role={role} />
        </span>
        <span>{t.chooseStaff}</span>
      </span>
      <DownOutlined className="mgr-pk-caret" aria-hidden="true" />
    </button>
  )
}
