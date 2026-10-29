import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Router } from '../../../../app/router'
import { authSession } from '../../../auth/api/authApi'
import { checklistsApi } from '../../api/checklistsApi'

// Isolate navigation: skip the cookie/bootstrap restore (covered by sessionLifecycle tests).
vi.mock('../../../auth/api/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../auth/api/authApi')>()),
  startAuthSession: () => () => {},
}))

afterEach(() => {
  authSession.clear()
  vi.restoreAllMocks()
  window.location.hash = ''
})
it.each(['#portal/admin/checklists', '#portal/admin/services/s/checklists'])(
  'denies Customer at %s before fetching Admin APIs',
  async (hash) => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'customer',
      email: 'customer@example.test',
      fullName: 'Customer',
      role: 'CUSTOMER',
    })
    vi.spyOn(authSession, 'getAccessToken').mockReturnValue('test-only-token')
    authSession.setStatus('authenticated')
    const list = vi.spyOn(checklistsApi, 'list')
    const template = vi.spyOn(checklistsApi, 'template')
    window.location.hash = hash
    render(<Router />)
    expect(
      screen.queryByRole('heading', { name: 'Danh mục checklist' }),
    ).toBeNull()
    expect(
      screen.queryByRole('heading', { name: 'Checklist dịch vụ' }),
    ).toBeNull()
    expect(list).not.toHaveBeenCalled()
    expect(template).not.toHaveBeenCalled()
    // The role redirect fires after the auth session finishes restoring.
    await waitFor(() => expect(window.location.hash).toBe('#portal/customer'))
  },
)
