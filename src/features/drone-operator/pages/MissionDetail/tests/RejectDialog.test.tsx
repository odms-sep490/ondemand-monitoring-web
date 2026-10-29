import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { RejectDialog } from '../components/RejectDialog'

describe('RejectDialog', () => {
  it('renders vietnamese title and reason options', () => {
    render(
      <RejectDialog
        missionId="MSN-1"
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('Từ chối nhiệm vụ MSN-1')).toBeTruthy()
    expect(screen.getByText('Trùng lịch cá nhân')).toBeTruthy()
    expect(screen.getByText('Xác nhận từ chối')).toBeTruthy()
  })

  it('renders english text when language is switched', () => {
    render(
      <RejectDialog
        missionId="MSN-1"
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Reject mission MSN-1')).toBeTruthy()
    expect(screen.getByText('Personal schedule conflict')).toBeTruthy()
    expect(screen.getByText('Confirm rejection')).toBeTruthy()
  })
})
