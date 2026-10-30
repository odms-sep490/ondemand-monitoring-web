import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChecklistSnapshotCard } from './ChecklistSnapshotCard'
describe('published order guidance', () => {
  it('shows all three sections for custom work from the effective customer response', () => {
    render(
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
  })
})
