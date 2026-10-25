import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import PostflightCheck from './PostflightCheck'
import type { Drone } from '../../types/omss'

const drone = {
  id: 'DRN-1',
  name: 'DRN-1',
  model: 'X500',
  serialNumber: 'DRN-1',
  state: 'PREFLIGHT',
  battery: 60,
  gpsCount: 10,
  storageMB: 100,
} as Drone

describe('PostflightCheck', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <PostflightCheck drone={drone} onComplete={vi.fn()} onFault={vi.fn()} />,
    )
    expect(screen.getByText('Kiểm tra sau bay')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <PostflightCheck drone={drone} onComplete={vi.fn()} onFault={vi.fn()} />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Post-flight inspection')).toBeInTheDocument()
  })
})
