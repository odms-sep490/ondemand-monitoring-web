import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { RejectDialog } from '../components/RejectDialog'

describe('RejectDialog', () => {
  it('renders vietnamese title and reason options', () => {
    render(
      <RejectDialog
        missionCode="MSN-1"
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Từ chối nhiệm vụ' })).toBeTruthy()
    expect(screen.getByText('MSN-1')).toBeTruthy()
    expect(screen.getByText('Không thể tham gia vào thời gian được phân công')).toBeTruthy()
    expect(screen.getByText('Xác nhận từ chối')).toBeTruthy()
  })

  it('renders english text when language is switched', () => {
    render(
      <RejectDialog
        missionCode="MSN-1"
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByRole('heading', { name: 'Decline mission' })).toBeTruthy()
    expect(screen.getByText('MSN-1')).toBeTruthy()
    expect(screen.getByText('Unavailable at the assigned time')).toBeTruthy()
    expect(screen.getByText('Confirm rejection')).toBeTruthy()
  })
})
