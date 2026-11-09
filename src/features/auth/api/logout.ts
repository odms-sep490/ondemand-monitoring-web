// Single source of truth for "log the current user out": call the backend,
// but always clear the local session and send the user back to the login
// screen even if the API call fails (expired token, offline, etc).

import { authApi, authSession } from './authApi'
import { withAuthLock } from './authSession'

export async function logout() {
  const token = authSession.getAccessToken()
  authSession.clear()
  const stamp = authSession.capture()
  window.location.hash = '#auth/login'
  try {
    await withAuthLock(async () => {
      if (authSession.isCurrent(stamp)) await authApi.logout(token)
    })
  } catch {
    // The shared logout marker prevents cookie bootstrap after an offline logout.
  }
}
