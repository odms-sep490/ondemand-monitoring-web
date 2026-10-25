import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { ConfirmedBanner, RevokedBanner } from '../components/HandoverBanners'

describe('RevokedBanner', () => {
  it('renders vietnamese text', () => {
    render(<RevokedBanner onReconfirm={vi.fn()} />)
    expect(screen.getByText('Xác nhận lại')).toBeTruthy()
    expect(screen.getByText('Đã thu hồi')).toBeTruthy()
  })

  it('renders english text when language is switched', () => {
    render(<RevokedBanner onReconfirm={vi.fn()} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Re-confirm')).toBeTruthy()
    expect(screen.getByText('Revoked')).toBeTruthy()
  })
})

describe('ConfirmedBanner', () => {
  it('renders vietnamese text', () => {
    render(<ConfirmedBanner />)
    expect(
      screen.getByText(
        'Bạn đã xác nhận bàn giao quyền điều khiển · control_handover.status = CONFIRMED',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Tiếp tục tới buồng lái')).toBeNull()
    expect(screen.queryByText('(Demo) Giả lập quản lý thu hồi quyền')).toBeNull()
  })

  it('renders english text when language is switched', () => {
    render(<ConfirmedBanner />)
    act(() => setLanguage('en'))
    expect(
      screen.getByText(
        'You confirmed the control handover · control_handover.status = CONFIRMED',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Continue to cockpit')).toBeNull()
    expect(screen.queryByText('(Demo) Simulate a manager revoking access')).toBeNull()
  })
})
