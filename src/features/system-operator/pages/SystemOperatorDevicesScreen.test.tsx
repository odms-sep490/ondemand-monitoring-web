import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'

describe('SystemOperatorDevicesScreen', () => {
  it('renders Vietnamese labels', () => {
    render(<SystemOperatorDevicesScreen />)
    expect(
      screen.getByText('Trạng thái đội bay và thiết bị drone'),
    ).toBeInTheDocument()
    expect(screen.getByText('Sẵn sàng bay')).toBeInTheDocument()
    expect(screen.getByText('Vừa xong', { exact: false })).toBeInTheDocument()
  })

  it('renders English labels when language is switched', () => {
    render(<SystemOperatorDevicesScreen />)
    act(() => setLanguage('en'))
    expect(
      screen.getByText('Fleet and drone device status'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ready to fly')).toBeInTheDocument()
    expect(screen.getByText('Just now', { exact: false })).toBeInTheDocument()
  })
})
