import { useSyncExternalStore } from 'react'
import { authSession } from '../api/authApi'

export function useAuthSession() {
  useSyncExternalStore(authSession.subscribe, authSession.getSnapshot)
  return {
    status: authSession.getStatus(),
    user: authSession.getUser(),
    sessionKey: authSession.getEpoch(),
  }
}
