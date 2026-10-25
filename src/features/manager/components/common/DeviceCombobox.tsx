import type { AvailableDrone } from '../../../staff/api/droneApi'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useState, useRef, useMemo, useEffect, type KeyboardEvent } from 'react'
import { DeviceSelectedTrigger } from './DeviceSelectedTrigger'
import { DeviceEmptyTrigger } from './DeviceEmptyTrigger'
import { DevicePickerPanel } from './DevicePickerPanel'

export function DeviceCombobox({
  devices,
  selectedIds,
  open,
  t,
  onOpen,
  onClose,
  onToggle,
  onRemove,
  onClear,
}: {
  devices: AvailableDrone[]
  selectedIds: string[]
  open: boolean
  t: (typeof liveDispatchPageMessages)['vi']
  onOpen: () => void
  onClose: () => void
  onToggle: (deviceId: string) => void
  onRemove: (deviceId: string) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedDevices = selectedIds
    .map((deviceId) => devices.find((item) => item.id === deviceId))
    .filter(Boolean) as AvailableDrone[]
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return devices.filter((item) => {
      if (!keyword) return true
      return item.label.toLowerCase().includes(keyword)
    })
  }, [devices, query])

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

  function choose(item: AvailableDrone) {
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
      style={{ position: 'relative', display: 'grid', gap: 10 }}
    >
      {selectedDevices.length > 0 ? (
        <DeviceSelectedTrigger
          triggerRef={triggerRef}
          openPicker={openPicker}
          selectedDevices={selectedDevices}
          t={t}
          onRemove={onRemove}
          onClear={onClear}
        />
      ) : (
        <DeviceEmptyTrigger
          triggerRef={triggerRef}
          openPicker={openPicker}
          t={t}
        />
      )}

      {open && (
        <DevicePickerPanel
          inputRef={inputRef}
          query={query}
          t={t}
          setQuery={setQuery}
          setActiveIndex={setActiveIndex}
          handleKeyDown={handleKeyDown}
          filtered={filtered}
          selectedIds={selectedIds}
          activeIndex={activeIndex}
          choose={choose}
        />
      )}
    </div>
  )
}
