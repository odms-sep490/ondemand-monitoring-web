import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChecklistSnapshotCard } from './ChecklistSnapshotCard'
describe('published order guidance', () => {
  it('shows all three sections for custom work from the effective customer response', () => {
    const { container } = render(
      <ChecklistSnapshotCard
        items={[
          {
            id: 'i',
            sourceChecklistId: null,
            displayOrder: 1,
            sourceType: 'CUSTOMER_CUSTOM',
            content: 'Published task',
            description: 'Published scope',
            executionSteps: ['Published steps'],
            inputRequirements: ['Published inputs'],
            expectedOutputs: ['Published outputs'],
          },
        ]}
      />,
    )
    for (const text of [
      'Published scope',
      'Published steps',
      'Published inputs',
      'Published outputs',
    ])
      expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(container.querySelectorAll('details')).toHaveLength(1)
    expect(container.querySelector('.odm-cg-static')).not.toBeNull()
  })

  it('keeps the custom empty-guidance notice inside the parent accordion', () => {
    const { container } = render(
      <ChecklistSnapshotCard
        items={[
          {
            id: 'custom-empty',
            sourceChecklistId: null,
            displayOrder: 0,
            sourceType: 'CUSTOMER_CUSTOM',
            content: 'Additional inspection',
          },
        ]}
      />,
    )
    const summary = container.querySelector('summary')!
    fireEvent.click(summary)
    expect(screen.getByText('Chưa có hướng dẫn chi tiết')).toBeVisible()
    expect(container.querySelectorAll('details')).toHaveLength(1)
  })
})
