import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { ConnectDronePage } from '../ConnectDronePage'

// Legacy connection routes should render the preflight checklist directly.
describe('ConnectDroneScreen', () => {
  it('opens the preflight step directly in Vietnamese', () => {
    render(<ConnectDronePage />)
    expect(
      screen.getByRole('heading', { name: 'Danh sách kiểm tra trước bay' }),
    ).toBeTruthy()
    expect(screen.queryByText('Kết nối Flight Controller')).toBeNull()
  })

  it('opens the preflight step directly in English', () => {
    render(<ConnectDronePage />)
    act(() => setLanguage('en'))
    expect(
      screen.getByRole('heading', { name: 'Preflight checklist' }),
    ).toBeTruthy()
    expect(screen.queryByText('Connect Flight Controller')).toBeNull()
  })
})
