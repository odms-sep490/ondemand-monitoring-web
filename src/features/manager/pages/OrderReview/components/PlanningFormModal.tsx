import { CloseOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

/** Overlay dialog that hosts the mission creation form (new or replacement). */
export function PlanningFormModal({
  kind,
  ariaLabel,
  heading,
  subtitle,
  closeAria,
  closeTitle,
  onRequestClose,
  children,
}: {
  kind: 'create' | 'replace'
  ariaLabel: string
  heading: string
  subtitle: string
  closeAria: string
  closeTitle: string
  /** Called on backdrop click and on the close button; the parent confirms and closes. */
  onRequestClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onRequestCloseRef = useRef(onRequestClose)

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose
  }, [onRequestClose])

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    dialog?.focus()

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onRequestCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => {
        const style = window.getComputedStyle(element)
        return (
          element.getAttribute('aria-hidden') !== 'true' &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        )
      })
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog?.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog?.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  return (
    <div
      className="odm-planning-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={titleId}
      tabIndex={-1}
      ref={dialogRef}
    >
      <div
        className="odm-planning-modal-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="odm-planning-create-head">
          <span className="odm-planning-create-icon" aria-hidden="true">
            {kind === 'create' ? <PlusOutlined /> : <RedoOutlined />}
          </span>
          <div>
            <h3 id={titleId}>{heading}</h3>
            <p>{subtitle}</p>
          </div>
          <button
            className="odm-planning-create-close"
            type="button"
            aria-label={closeAria}
            title={closeTitle}
            onClick={onRequestClose}
          >
            <CloseOutlined aria-hidden="true" />
          </button>
        </header>
        <div className="odm-planning-modal-body">{children}</div>
      </div>
    </div>
  )
}
