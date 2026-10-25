import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import PreflightChecklist from './PreflightChecklist'
import type { CheckItem } from '../../types/omss'

const checklist: CheckItem[] = [
  {
    id: 'battery',
    label: 'Battery',
    icon: 'battery',
    value: '90%',
    requirement: '>= 30%',
    status: 'PASS',
    explanation: 'ok',
  },
]

describe('PreflightChecklist', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <PreflightChecklist
        checklist={checklist}
        onPass={vi.fn()}
        onFail={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText('Kiểm tra trước bay')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <PreflightChecklist
        checklist={checklist}
        onPass={vi.fn()}
        onFail={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Pre-flight check')).toBeInTheDocument()
  })
})
