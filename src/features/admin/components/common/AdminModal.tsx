import { Modal } from 'antd'
import type { ReactNode } from 'react'

export type AdminModalTone = 'primary' | 'danger' | 'warning' | 'success'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  /** Accent colour of the title bar. */
  tone?: AdminModalTone
  /** Width in px. */
  width?: number
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Kept for call-site compatibility with the legacy Modal; the accent replaces it. */
  icon?: string
}

/**
 * antd Modal with the legacy `Modal` call signature (always open while mounted).
 * The tone tints the header strip through `.adm-modal.is-<tone>` in admin.scss.
 */
export function AdminModal({
  title,
  subtitle,
  tone = 'primary',
  width = 480,
  onClose,
  children,
  footer,
}: Props) {
  return (
    <Modal
      open
      centered
      width={width}
      title={title}
      footer={footer ?? null}
      onCancel={onClose}
      className={`adm-modal is-${tone}`}
      destroyOnHidden
    >
      {subtitle ? <p className="mgr-modal-sub">{subtitle}</p> : null}
      {children}
    </Modal>
  )
}
