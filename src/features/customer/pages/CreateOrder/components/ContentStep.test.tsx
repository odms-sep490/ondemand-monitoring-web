import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentStep } from './ContentStep'

function renderStep(valid = true) {
  return render(
    <ContentStep
      checklist={<button type="button">Edit monitoring requirement</button>}
      selectedCount={3}
      packageSelectedCount={2}
      packageCount={4}
      additionalChecklists={[]}
      valid={valid}
      pricingEstimate={null}
      pricingLoading={false}
    />,
  )
}

describe('ContentStep', () => {
  it('keeps editing and summary together without duplicating wizard navigation', () => {
    renderStep()
    expect(
      screen.getByRole('region', {
        name: /monitoring content list|danh sách nội dung giám sát/i,
      }),
    ).toHaveTextContent('Edit monitoring requirement')
    expect(
      screen.getByRole('complementary', {
        name: /request summary|tóm tắt yêu cầu/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 / 4')).toBeInTheDocument()

    expect(
      screen.queryByRole('navigation', { name: /request step navigation/i }),
    ).toBeNull()
  })

  it('does not bypass the wizard disabled state or lose the validation warning', () => {
    renderStep(false)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
