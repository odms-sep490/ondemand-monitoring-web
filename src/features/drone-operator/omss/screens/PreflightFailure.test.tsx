import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import PreflightFailure from './PreflightFailure'
import type { CheckItem } from '../../types/omss'

const checklist: CheckItem[] = [
  {
    id: 'battery',
    label: 'Battery',
    icon: 'battery',
    value: '20%',
    requirement: '>= 80%',
    status: 'FAIL',
    explanation: 'Below threshold',
  },
]

describe('PreflightFailure', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <PreflightFailure
        checklist={checklist}
        scenario="battery-fail"
        onReplace={vi.fn()}
        onBack={vi.fn()}
        onEscalate={vi.fn()}
      />,
    )
    expect(screen.getByText('Pin không đủ')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <PreflightFailure
        checklist={checklist}
        scenario="battery-fail"
        onReplace={vi.fn()}
        onBack={vi.fn()}
        onEscalate={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Battery charge insufficient')).toBeInTheDocument()
  })
})
