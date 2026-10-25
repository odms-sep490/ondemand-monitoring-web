import { render, screen, within } from '@testing-library/react'
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
      aiAnalysisRequested={false}
      footer={
        <>
          <button type="button">Back</button>
          <button type="button" disabled={!valid}>
            Continue
          </button>
        </>
      }
    />,
  )
}

describe('ContentStep', () => {
  it('keeps editing, summary, pricing and a single navigation set', () => {
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

    const nav = screen.getByRole('navigation', {
      name: /request step navigation|điều hướng các bước tạo yêu cầu/i,
    })
    expect(within(nav).getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Continue' })).toBeEnabled()
    expect(screen.getAllByRole('button', { name: 'Continue' })).toHaveLength(1)
  })

  it('does not bypass the wizard disabled state or lose the validation warning', () => {
    renderStep(false)
    const nav = screen.getByRole('navigation', {
      name: /request step navigation|điều hướng các bước tạo yêu cầu/i,
    })
    expect(within(nav).getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
