import { useCallback, useEffect, useMemo, useState } from 'react'

import { authSession } from '../auth/api/authApi'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { notificationApi } from './notificationApi'
import { subscribeNotificationRefresh } from './notificationRealtime'
import type { NotificationFeed } from './types'
import {
  persistReadNotificationIds,
  readNotificationIds,
  subscribeReadNotificationIds,
} from './readState'

export function useNotifications() {
  const userId = authSession.getUser()?.id ?? ''
  const query = useApiQuery(
    (signal) =>
      userId
        ? notificationApi
            .list(signal)
            .then((feed) => ({ ownerId: userId, feed }))
        : Promise.resolve({ ownerId: userId, feed: { items: [] } }),
    [userId],
  )
  const [readIds, setReadIds] = useState(() => readNotificationIds(userId))
  const [realtimeItems, setRealtimeItems] = useState<NotificationFeed['items']>(
    [],
  )
  const feed: NotificationFeed | undefined =
    query.data?.ownerId === userId ? query.data.feed : undefined
  const items = useMemo(() => {
    const merged = new Map(
      (feed?.items ?? []).map((notification) => [
        notification.id,
        notification,
      ]),
    )
    realtimeItems.forEach((notification) =>
      merged.set(notification.id, notification),
    )
    return [...merged.values()].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    )
  }, [feed?.items, realtimeItems])

  useEffect(() => {
    setReadIds(readNotificationIds(userId))
    setRealtimeItems([])
    return subscribeReadNotificationIds(() => {
      setReadIds(readNotificationIds(userId))
    })
  }, [userId])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (userId && document.visibilityState === 'visible') query.reload()
    }
    const timer = userId
      ? window.setInterval(refreshWhenVisible, 30_000)
      : undefined
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      if (timer !== undefined) window.clearInterval(timer)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [query.reload, userId])

  useEffect(() => {
    if (!userId) return
    return subscribeNotificationRefresh((notification, replay) => {
      if (notification) {
        setRealtimeItems((current) => {
          const next = new Map(current.map((item) => [item.id, item]))
          next.set(notification.id, notification)
          return [...next.values()].slice(-50)
        })
      }
      if (!replay) query.reload()
    })
  }, [query.reload, userId])

  const markRead = useCallback(
    (id: string) => {
      const next = new Set(readNotificationIds(userId))
      next.add(id)
      persistReadNotificationIds(userId, next)
      setReadIds(next)
    },
    [userId],
  )

  const markAllRead = useCallback(() => {
    const next = new Set(readIds)
    for (const notification of items) next.add(notification.id)
    persistReadNotificationIds(userId, next)
    setReadIds(next)
  }, [items, readIds, userId])

  const unreadCount = useMemo(
    () => items.filter((item) => !readIds.has(item.id)).length,
    [items, readIds],
  )

  return {
    items,
    readIds,
    loading: query.loading,
    error: query.error,
    unreadCount,
    markRead,
    markAllRead,
    reload: query.reload,
  }
}
