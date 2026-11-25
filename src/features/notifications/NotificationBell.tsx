import { BellOutlined } from '@ant-design/icons'
import { Badge, Button } from 'antd'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

import { authSession } from '../auth/api/authApi'
import { useI18n } from '../../shared/i18n'
import { createAssistantVoiceUtterance } from '../../shared/lib/assistantVoice'
import { NotificationItem, notificationCopy } from './NotificationItems'
import { notificationsHref } from './routes'
import { notificationsMessages } from './notifications.messages'
import type { AppNotification, NotificationRole } from './types'
import { useNotifications } from './useNotifications'
import './notifications.css'

function notificationIds(items: AppNotification[]) {
  return new Set(items.map((item) => item.id).filter(Boolean))
}

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
  const managerId = authSession.getUser()?.id ?? 'manager'
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 12 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusOnClose = useRef(false)
  const previousNotificationIds = useRef<{
    managerId: string
    ids: Set<string>
  } | null>(null)
  const handledNotificationIds = useRef<{
    managerId: string
    ids: Set<string>
  } | null>(null)
  const speechQueue = useRef<Array<{ notificationId: string; text: string }>>(
    [],
  )
  const speaking = useRef(false)
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null)
  const resumeSpeech = useRef<(() => void) | null>(null)

  const playNextSpeech = useCallback(function playNextSpeechCallback() {
    if (
      speaking.current ||
      resumeSpeech.current ||
      speechQueue.current.length === 0
    )
      return
    const synthesis = window.speechSynthesis
    if (!synthesis) {
      speechQueue.current = []
      return
    }

    const announcement = speechQueue.current[0]
    speaking.current = true
    const speak = async () => {
      let utterance: SpeechSynthesisUtterance | null = null
      try {
        utterance = await createAssistantVoiceUtterance(announcement.text)
      } catch {
        // Keep the unread alert queued for the next user gesture.
      }
      if (!speaking.current || speechQueue.current[0] !== announcement) return
      if (!utterance) {
        speaking.current = false
        resumeSpeech.current = () => {
          resumeSpeech.current = null
          playNextSpeechCallback()
        }
        return
      }

      activeUtterance.current = utterance
      utterance.onend = () => {
        if (activeUtterance.current !== utterance) return
        activeUtterance.current = null
        speaking.current = false
        const index = speechQueue.current.indexOf(announcement)
        if (index >= 0) speechQueue.current.splice(index, 1)
        playNextSpeechCallback()
      }
      utterance.onerror = () => {
        if (activeUtterance.current !== utterance) return
        activeUtterance.current = null
        speaking.current = false
        resumeSpeech.current = () => {
          resumeSpeech.current = null
          playNextSpeechCallback()
        }
      }
      synthesis.speak(utterance)
    }
    void speak()
  }, [])

  useEffect(() => {
    if (role !== 'MANAGER') return
    const resume = () => {
      const play = resumeSpeech.current
      window.speechSynthesis?.resume()
      if (!play) {
        if (!speaking.current && speechQueue.current.length > 0)
          playNextSpeech()
        return
      }
      resumeSpeech.current = null
      play()
    }
    window.addEventListener('pointerdown', resume)
    window.addEventListener('keydown', resume)
    return () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
  }, [playNextSpeech, role])

  useEffect(() => {
    const current = speechQueue.current[0]
    if (
      current &&
      speaking.current &&
      notifications.readIds.has(current.notificationId)
    ) {
      window.speechSynthesis?.cancel()
      activeUtterance.current = null
      speechQueue.current.shift()
      speaking.current = false
    }
    speechQueue.current = speechQueue.current.filter(
      (announcement) => !notifications.readIds.has(announcement.notificationId),
    )
    if (speechQueue.current.length === 0) resumeSpeech.current = null
    else if (!speaking.current && !resumeSpeech.current) playNextSpeech()
  }, [notifications.readIds, playNextSpeech])

  useEffect(() => {
    if (role !== 'MANAGER' || !notifications.loaded) return
    if (
      !handledNotificationIds.current ||
      handledNotificationIds.current.managerId !== managerId
    ) {
      handledNotificationIds.current = { managerId, ids: new Set() }
    }
    const handledIds = handledNotificationIds.current.ids
    const currentNotificationIds = notificationIds(notifications.items)
    const previous = previousNotificationIds.current

    if (!previous || previous.managerId !== managerId) {
      previousNotificationIds.current = {
        managerId,
        ids: currentNotificationIds,
      }
      const unreadNotifications = notifications.items.filter(
        (item) =>
          !notifications.readIds.has(item.id) && !handledIds.has(item.id),
      )
      currentNotificationIds.forEach((id) => handledIds.add(id))
      speechQueue.current.push(
        ...unreadNotifications.map((notification) => ({
          notificationId: notification.id,
          text:
            notification.type === 'ORDER_CREATED'
              ? 'Bạn có đơn hàng mới cần xử lý nè.'
              : (() => {
                  const copy = notificationCopy(
                    notification,
                    notificationsMessages.vi,
                  )
                  return `${copy.title}. ${copy.description}`
                })(),
        })),
      )
      playNextSpeech()
      return
    }

    const addedNotificationIds = [...currentNotificationIds].filter(
      (id) => !previous.ids.has(id),
    )
    previousNotificationIds.current = {
      managerId,
      ids: currentNotificationIds,
    }
    if (addedNotificationIds.length === 0) return

    const newNotificationIds = addedNotificationIds.filter(
      (id) => !handledIds.has(id),
    )
    newNotificationIds.forEach((id) => handledIds.add(id))
    const addedIdSet = new Set(newNotificationIds)
    const newNotifications = notifications.items.filter(
      (item) => addedIdSet.has(item.id),
    )
    speechQueue.current.push(
      ...newNotifications
        .filter((item) => !notifications.readIds.has(item.id))
        .map((notification) => ({
          notificationId: notification.id,
          text:
            notification.type === 'ORDER_CREATED'
              ? 'Bạn có đơn hàng mới cần xử lý nè.'
              : (() => {
                  const copy = notificationCopy(
                    notification,
                    notificationsMessages.vi,
                  )
                  return `${copy.title}. ${copy.description}`
                })(),
        })),
    )
    playNextSpeech()
  }, [
    managerId,
    notifications.items,
    notifications.loaded,
    notifications.readIds,
    playNextSpeech,
    role,
  ])

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
