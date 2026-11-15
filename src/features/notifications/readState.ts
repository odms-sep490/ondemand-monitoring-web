const EVENT_NAME = 'odm:notification-read-state'

function storageKey(userId: string) {
  return `odm:notifications:read:${encodeURIComponent(userId)}`
}

export function readNotificationIds(userId: string): Set<string> {
  try {
    const stored = window.localStorage.getItem(storageKey(userId))
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [],
    )
  } catch {
    return new Set()
  }
}

export function persistReadNotificationIds(userId: string, ids: Set<string>) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify([...ids]))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Private browsing or storage quotas should not prevent the dropdown working in this tab.
  }
}

export function subscribeReadNotificationIds(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(EVENT_NAME, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(EVENT_NAME, listener)
  }
}

export function notificationReadStorageKey(userId: string) {
  return storageKey(userId)
}
