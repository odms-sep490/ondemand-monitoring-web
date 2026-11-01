import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StepTabs } from './StepTabs'

const labels = {
  1: 'Một',
  2: 'Hai',
  3: 'Ba',
  4: 'Bốn',
  5: 'Năm',
  6: 'Sáu',
} as const

describe('StepTabs', () => {
  it('keeps steps already reached clickable after going back', () => {
    const onSelect = vi.fn()
    render(
      <StepTabs step={3} reached={5} labels={labels} onSelect={onSelect} />,
    )
    const tabs = screen.getAllByRole('button')
    expect(tabs[3]).toBeEnabled()
    expect(tabs[4]).toBeEnabled()
    expect(tabs[5]).toBeDisabled()
    expect(tabs[0]).toHaveAccessibleName('Một — đã hoàn tất')
    expect(tabs[2]).toHaveAccessibleName('Ba — đang thực hiện')
    expect(tabs[3]).toHaveAccessibleName('Bốn — chưa thực hiện')
    fireEvent.click(tabs[4])
    expect(onSelect).toHaveBeenCalledWith(5)
  })

  it('does not allow jumping past the furthest reached step', () => {
    render(<StepTabs step={2} reached={3} labels={labels} onSelect={vi.fn()} />)
    const tabs = screen.getAllByRole('button')
    expect(tabs[2]).toBeEnabled()
    expect(tabs[3]).toBeDisabled()
    expect(tabs[4]).toBeDisabled()
    expect(tabs[5]).toBeDisabled()
  })
})
