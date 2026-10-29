import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { PreflightPage } from '../PreflightPage'

describe('PreflightScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<PreflightPage />)
    expect(screen.getByText('Preflight checklist')).toBeTruthy()
    expect(screen.getByText('Chưa gán thiết bị')).toBeTruthy()
    expect(screen.getByText('Bắt đầu kiểm tra')).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<PreflightPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('No device assigned')).toBeTruthy()
  })
})
