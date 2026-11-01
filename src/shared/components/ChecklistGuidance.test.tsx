import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../i18n'
import { ChecklistGuidance, hasChecklistGuidance } from './ChecklistGuidance'

afterEach(() => act(() => setLanguage('vi')))

const guidance = {
  description: 'Phạm vi kiểm tra mái',
  executionSteps: ['Bay lưới song song', '', 'Chụp cận'],
  inputRequirements: ['Trời quang'],
  expectedOutputs: ['Ảnh toàn mái'],
}

describe('ChecklistGuidance', () => {
  it('decodes bilingual JSON for the active language and keeps legacy lines', () => {
    const bilingual = {
      description: '{"vi":"Phạm vi mái","en":"Roof scope"}',
      executionSteps: ['{"vi":"Bay lưới","en":"Fly a grid"}', 'Chụp cận'],
    }
    const { unmount } = render(
      <ChecklistGuidance
        guidance={bilingual}
        sections={['description', 'steps']}
        defaultOpen
      />,
    )
    expect(screen.getByText('Phạm vi mái')).toBeInTheDocument()
    expect(screen.getByText('Bay lưới')).toBeInTheDocument()
    unmount()
    act(() => setLanguage('en'))
    render(
      <ChecklistGuidance
        guidance={bilingual}
        sections={['description', 'steps']}
        defaultOpen
      />,
    )
    expect(screen.getByText('Roof scope')).toBeInTheDocument()
    expect(screen.getByText('Fly a grid')).toBeInTheDocument()
    expect(screen.getByText('Chụp cận')).toBeInTheDocument()
  })

  it('renders every section, keeping the step order and dropping blank lines', () => {
    render(<ChecklistGuidance guidance={guidance} defaultOpen />)
    expect(screen.getByText('Phạm vi kiểm tra mái')).toBeInTheDocument()
    const steps = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(steps.slice(0, 2)).toEqual(['Bay lưới song song', 'Chụp cận'])
    expect(screen.getByText('Đầu vào cần có')).toBeInTheDocument()
    expect(screen.getByText('Ảnh toàn mái')).toBeInTheDocument()
  })

  it('shows only the requested sections', () => {
    render(
      <ChecklistGuidance
        guidance={guidance}
        sections={['description', 'outputs']}
        defaultOpen
      />,
    )
    expect(screen.getByText('Phạm vi kiểm tra mái')).toBeInTheDocument()
    expect(screen.queryByText('Bay lưới song song')).toBeNull()
    expect(screen.queryByText('Trời quang')).toBeNull()
  })

  it('renders nothing when there is no guidance', () => {
    const { container } = render(
      <ChecklistGuidance
        guidance={{
          description: '  ',
          executionSteps: [],
          inputRequirements: null,
        }}
      />,
    )
    expect(container).toBeEmptyDOMElement()
    expect(hasChecklistGuidance(undefined)).toBe(false)
    expect(hasChecklistGuidance({ expectedOutputs: ['x'] })).toBe(true)
  })

  it('switches labels to English', () => {
    render(<ChecklistGuidance guidance={guidance} defaultOpen />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Required inputs')).toBeInTheDocument()
  })
})
