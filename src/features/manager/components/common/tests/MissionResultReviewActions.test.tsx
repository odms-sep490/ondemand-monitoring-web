import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { missionsApi } from '../../../api/missionsApi'
import { MissionResultReviewActions } from '../MissionResultReviewActions'
import { setLanguage } from '../../../../../shared/i18n'
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
it.each(['DRAFT', 'REJECTED', 'APPROVED', 'PENDING_MANAGER_APPROVAL'] as const)(
  'keeps %s read-only even if checklist readiness is true',
  (status) => {
    const approve = vi.spyOn(missionsApi, 'approveMissionResult')
    const reject = vi.spyOn(missionsApi, 'rejectMissionResult')
    render(
      <MissionResultReviewActions
        resultId="r"
        status={status}
        ready
        onReviewed={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(
      screen.getByText('Inspector phụ trách nghiệm thu'),
    ).toBeInTheDocument()
    expect(approve).not.toHaveBeenCalled()
    expect(reject).not.toHaveBeenCalled()
  },
)
it('explains responsibility in English without mixing interface copy', () => {
  setLanguage('en')
  render(
    <MissionResultReviewActions
      resultId="r"
      status="PENDING_MANAGER_APPROVAL"
      ready={false}
      onReviewed={vi.fn()}
    />,
  )
  expect(
    screen.getByText('The Inspector owns result acceptance'),
  ).toBeInTheDocument()
  expect(screen.queryByText('Inspector phụ trách nghiệm thu')).toBeNull()
})
