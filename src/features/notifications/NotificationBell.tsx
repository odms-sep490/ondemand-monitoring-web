import { BellOutlined } from '@ant-design/icons'
import { Badge, Button } from 'antd'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../shared/i18n'
import { NotificationItem } from './NotificationItems'
import { notificationsHref } from './routes'
import { notificationsMessages } from './notifications.messages'
import type { NotificationRole } from './types'
import { useNotifications } from './useNotifications'
import './notifications.css'

export function NotificationBell({
  role,
  className = '',
}: {
  role: NotificationRole
  className?: string
}) {
  const popoverId = 'odm-notification-popover'
  const { t } = useI18n(notificationsMessages)
  const notifications = useNotifications()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 12 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusOnClose = useRef(false)

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const panelWidth = Math.min(400, window.innerWidth - 24)
    const maxHeight = Math.min(440, window.innerHeight - 24)
    const top =
      rect.bottom + maxHeight + 10 > window.innerHeight
        ? Math.max(12, rect.top - maxHeight - 10)
        : rect.bottom + 10
    setPosition({
      top,
      left: Math.min(
        Math.max(12, rect.right - panelWidth),
        window.innerWidth - panelWidth - 12,
      ),
    })
  }, [])

  const close = useCallback((restoreFocus = false) => {
    restoreFocusOnClose.current = restoreFocus
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open && restoreFocusOnClose.current) {
      restoreFocusOnClose.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const focusTarget = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('button:not(:disabled), a')
        ?.focus()
    })
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      )
        close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      window.cancelAnimationFrame(focusTarget)
    }
  }, [close, open, updatePosition])

  const listHref = notificationsHref(role)
  return (
    <>
      <Button
        ref={triggerRef}
        type="text"
        className={`mgr-icon-btn odm-notification-trigger ${className}${open ? ' is-open' : ''}`}
        aria-label={`${t.title}${notifications.unreadCount ? `, ${t.unreadCount.replace('{count}', String(notifications.unreadCount))}` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        title={t.title}
        onClick={() => {
          if (open) close()
          else {
            notifications.reload()
            setOpen(true)
          }
        }}
      >
        <Badge
          count={notifications.unreadCount}
          size="small"
          overflowCount={99}
        >
          <BellOutlined aria-hidden="true" />
        </Badge>
      </Button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <section
              ref={panelRef}
              id={popoverId}
              className="odm-notification-popover"
              role="dialog"
              aria-busy={notifications.loading}
              aria-label={t.title}
              style={{ top: position.top, left: position.left }}
            >
              <header className="odm-notification-header">
                <h2>{t.title}</h2>
                <button
                  type="button"
                  className="odm-notification-mark-all"
                  onClick={notifications.markAllRead}
                  disabled={notifications.unreadCount === 0}
                >
                  {t.markAllRead}
                </button>
              </header>
              <div className="odm-notification-list" aria-live="polite">
                {notifications.loading && notifications.items.length === 0 ? (
                  <p className="odm-notification-state" role="status">
                    {t.loading}
                  </p>
                ) : notifications.error ? (
                  <div className="odm-notification-state" role="alert">
                    <p>{t.loadError}</p>
                    <button type="button" onClick={notifications.reload}>
                      {t.retry}
                    </button>
                  </div>
                ) : notifications.items.length === 0 ? (
                  <div className="odm-notification-state">
                    <strong>{t.emptyTitle}</strong>
                    <p>{t.emptyDescription}</p>
                  </div>
                ) : (
                  notifications.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      role={role}
                      unread={!notifications.readIds.has(notification.id)}
                      onClick={() => {
                        notifications.markRead(notification.id)
                        close()
                      }}
                    />
                  ))
                )}
              </div>
              {listHref ? (
                <footer className="odm-notification-footer">
                  <a href={listHref} onClick={() => close()}>
                    {t.viewAll}
                  </a>
                </footer>
              ) : null}
            </section>,
            document.body,
          )
        : null}
    </>
  )
}
