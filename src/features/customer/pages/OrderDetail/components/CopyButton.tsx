import { useState } from 'react'

import { OrderIcon } from '../../../../manager/components/common/OrderIcon'

/** Small icon button that copies `value` to the clipboard and flashes a check mark. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (insecure context); the id stays selectable.
    }
  }
  return (
    <button type="button" className="od-copy" onClick={copy} aria-label={label} title={label}>
      <OrderIcon name={copied ? 'check' : 'copy'} size={14} />
    </button>
  )
}
