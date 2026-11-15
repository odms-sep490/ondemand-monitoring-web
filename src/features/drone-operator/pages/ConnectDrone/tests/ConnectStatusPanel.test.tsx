import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { ConnectStatusPanel } from '../components/ConnectStatusPanel'

describe('ConnectStatusPanel', () => {
  it('renders vietnamese status text', () => {
    render(<ConnectStatusPanel state="default" error={null} />)
    expect(screen.getByText('Trạng thái kết nối')).toBeTruthy()
    expect(screen.getByText('Chưa kết nối')).toBeTruthy()
    expect(screen.getByText('Quay lại nhiệm vụ')).toBeTruthy()
  })

  it('renders english status text when language is switched', () => {
    render(<ConnectStatusPanel state="default" error={null} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Connection status')).toBeTruthy()
    expect(screen.getByText('Not connected')).toBeTruthy()
    expect(screen.getByText('Back to mission')).toBeTruthy()
  })
})
