import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EditUserModal } from '../components/EditUserModal'
import { useMockTransport } from './helpers'

useMockTransport()

describe('EditUserModal', () => {
  it('loads BE data and shows role badge, status and timeline', async () => {
    render(
      <EditUserModal
        userId="mock-admin-truong"
        onClose={() => {}}
        onChanged={() => {}}
      />,
    )
    expect(
      (await screen.findAllByText('long.truong@odms.vn')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Quản trị viên')).toBeTruthy()
    expect(screen.getByText('Thời gian')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByText(/PATCH \/api\/users\/me/)).toBeNull()
    // no customerProfile for an admin => no contact section
    expect(screen.queryByText('Liên hệ')).toBeNull()
  })
})
