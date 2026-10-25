import { StaffAvatar } from './StaffAvatar'
import { StaffStatusBadge } from './StaffStatusBadge'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { RefObject } from 'react'
import type { AvailableOperator } from '../../../staff/api/operatorApi'

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
        onClick={openPicker}
        style={{
          display: 'grid',
          gridTemplateColumns: '36px minmax(0, 1fr) auto',
          gap: 10,
          alignItems: 'center',
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
        <span style={{ display: 'grid', gap: 8, gridColumn: '1 / -1' }}>
          {selectedStaff.map((selected) => (
            <span
              key={selected.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px minmax(0, 1fr) auto',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <StaffAvatar staff={selected} />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {selected.fullName}
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
                  {selected.email}
                </span>
                <span style={{ display: 'block', marginTop: 5 }}>
                  <StaffStatusBadge />
                </span>
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={t.clearStaff}
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
          ))}
        </span>
      </button>
      <button
        ref={triggerRef}
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm"
        onClick={openPicker}
        style={{ justifySelf: 'start', minHeight: 30, borderRadius: 8 }}
      >
        {t.changeStaff}
      </button>
    </>
  )
}
