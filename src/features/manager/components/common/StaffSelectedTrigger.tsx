import { CloseOutlined } from '@ant-design/icons'
import { StaffAvatar } from './StaffAvatar'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { staffContact } from './liveDispatchHelpers'
import type { RefObject } from 'react'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import { Button } from '../../../../shared/components/ui'
import './pickers.css'

export function StaffSelectedTrigger({
  triggerRef,
  openPicker,
  selectedStaff,
  t,
  onRemove,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  selectedStaff: AvailableOperator[]
  t: (typeof liveDispatchPageMessages)['vi']
  onRemove: (staffId: string) => void
}) {
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="mgr-pk-selected"
        onClick={openPicker}
      >
        {selectedStaff.map((selected) => {
          const contact = staffContact(selected)
          return (
            <span key={selected.id} className="mgr-pk-item">
              <StaffAvatar staff={selected} />
              <span className="mgr-pk-text">
                <span className="mgr-pk-name">{selected.fullName}</span>
                {contact ? <span className="mgr-pk-sub">{contact}</span> : null}
                <StaffStatusBadge />
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={t.clearStaff}
                className="mgr-pk-remove"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(selected.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    onRemove(selected.id)
                  }
                }}
              >
                <CloseOutlined aria-hidden="true" />
              </span>
            </span>
          )
        })}
      </button>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={openPicker}
        style={{ justifySelf: 'start' }}
      >
        {t.changeStaff}
      </Button>
    </>
  )
}
