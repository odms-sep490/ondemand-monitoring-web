import { CloseOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
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
  return (
    <div
      className="odm-planning-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
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
            <h3>{heading}</h3>
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
