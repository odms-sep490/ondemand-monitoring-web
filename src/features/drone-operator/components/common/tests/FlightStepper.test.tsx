import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { FlightStepHeader, FlightStepper } from '../FlightStepper'

describe('FlightStepper', () => {
  it('renders the vietnamese handover step', () => {
    act(() => setLanguage('vi'))
    render(<FlightStepper active={3} />)
    expect(screen.getByText('Bước 4/7 — Bàn giao')).toBeTruthy()
    expect(
      screen.getByRole('listitem', { name: /Bàn giao — Đang thực hiện \(4\/7\)/ }),
    ).toHaveAttribute('aria-current', 'step')
  })

  it('renders the vietnamese current flight step', () => {
    act(() => setLanguage('vi'))
    render(<FlightStepper active={4} />)
    expect(screen.getByText('Bước 5/7 — Bay')).toBeTruthy()
    expect(
      screen.getByRole('listitem', { name: /Bay — Đang thực hiện \(5\/7\)/ }),
    ).toHaveAttribute('aria-current', 'step')
  })

  it('renders the english handover label when language is switched', () => {
    act(() => setLanguage('en'))
    render(<FlightStepper active={3} />)
    expect(screen.getByText('Step 4 of 7 — Handover')).toBeTruthy()
  })

  it('renders the english flight label when language is switched', () => {
    act(() => setLanguage('en'))
    render(<FlightStepper active={4} />)
    expect(screen.getByText('Step 5 of 7 — Flight')).toBeTruthy()
  })

  it('marks acceptance complete and announces the manager-review state', () => {
    act(() => setLanguage('vi'))
    render(
      <FlightStepHeader
        title="Hoàn tất kiểm tra sau bay"
        missionId="MS-96811"
        active={6}
        completed
        completedLabel="Đã xác nhận nghiệm thu · đang chờ duyệt"
      />,
    )

    const acceptanceStep = screen.getByRole('listitem', {
      name: 'Nghiệm thu — Đã hoàn thành (7/7)',
    })
    expect(acceptanceStep).toHaveClass('is-complete')
    expect(acceptanceStep).not.toHaveAttribute('aria-current')
    expect(
      screen.getByText('Đã xác nhận nghiệm thu · đang chờ duyệt'),
    ).toBeTruthy()
  })
})
