import type { MissionStaffRole } from '../../../mission/types/mission'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useState, useRef, useMemo, useEffect, type KeyboardEvent } from 'react'
import { StaffSelectedTrigger } from './StaffSelectedTrigger'
import { StaffEmptyTrigger } from './StaffEmptyTrigger'
import { StaffPickerPanel } from './StaffPickerPanel'

export function StaffCombobox({
  role,
  staff,
  selectedIds,
  staffByRole,
  open,
  t,
  onOpen,
  onClose,
  onToggle,
  onRemove,
}: {
  role: MissionStaffRole
  staff: AvailableOperator[]
  selectedIds: string[]
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  open: boolean
  t: (typeof liveDispatchPageMessages)['vi']
  onOpen: () => void
  onClose: () => void
  onToggle: (staffId: string) => void
  onRemove: (staffId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedStaff = selectedIds
    .map((staffId) => staff.find((item) => item.id === staffId))
    .filter(Boolean) as AvailableOperator[]
  const selectedRoleByStaff = useMemo(() => {
    const result = new Map<string, MissionStaffRole[]>()
    Object.entries(staffByRole).forEach(([staffRole, staffIds]) => {
      if (!staffIds?.length || staffRole === role) return
      staffIds.forEach((staffId) => {
        const roles = result.get(staffId) ?? []
        roles.push(staffRole as MissionStaffRole)
        result.set(staffId, roles)
      })
    })
    return result
  }, [role, staffByRole])
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return staff.filter((item) => {
      if (!keyword) return true
      const haystack = `${item.fullName} ${item.email}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [query, staff])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, onClose])

  function openPicker() {
    onOpen()
    setQuery('')
    setActiveIndex(0)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function closePicker() {
    onClose()
    triggerRef.current?.focus()
  }

  function choose(item: AvailableOperator) {
    onToggle(item.id)
    onClose()
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePicker()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(0, filtered.length - 1)),
      )
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
      return
    }
    if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault()
      choose(filtered[activeIndex])
    }
  }

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', display: 'grid', gap: 8 }}
    >
      {selectedStaff.length > 0 ? (
        <StaffSelectedTrigger
          triggerRef={triggerRef}
          openPicker={openPicker}
          selectedStaff={selectedStaff}
          t={t}
          onRemove={onRemove}
        />
      ) : (
        <StaffEmptyTrigger
          triggerRef={triggerRef}
          openPicker={openPicker}
          t={t}
          role={role}
        />
      )}

      {open && (
        <StaffPickerPanel
          inputRef={inputRef}
          query={query}
          t={t}
          setQuery={setQuery}
          setActiveIndex={setActiveIndex}
          handleKeyDown={handleKeyDown}
          filtered={filtered}
          selectedRoleByStaff={selectedRoleByStaff}
          selectedIds={selectedIds}
          activeIndex={activeIndex}
          choose={choose}
        />
      )}
    </div>
  )
}
