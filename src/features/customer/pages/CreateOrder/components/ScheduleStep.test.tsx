import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { ScheduleStep } from './ScheduleStep'

afterEach(() => {
  vi.useRealTimers()
})

describe('ScheduleStep', () => {
  it('keeps step 5 focused on schedule details without showing an estimated cost', () => {
    render(
      <ScheduleStep
        form={{
          ...createDefaultForm(),
          serviceId: 'service-1',
          address: 'Tân Tập, Tây Ninh',
          preferredTimeId: 'morning',
        }}
        errors={{}}
        update={vi.fn()}
        preferredTimes={[
          {
            id: 'morning',
            name: 'Buổi sáng',
            startTime: '08:00',
            endTime: '11:00',
          },
        ]}
        service={{
          id: 'service-1',
          name: 'Giám sát công trình',
          basePrice: 3_500_000,
        }}
        time={{
          id: 'morning',
          name: 'Buổi sáng',
          startTime: '08:00',
          endTime: '11:00',
        }}
      />,
    )

    expect(
      screen.queryByRole('heading', { name: 'Tùy chọn lịch bay' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tùy chọn nâng cao/ }))
    expect(
      screen.getByRole('heading', { name: 'Tùy chọn lịch bay' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tóm tắt lịch bay' }),
    ).toBeInTheDocument()
    expect(screen.getByText('60 m')).toBeInTheDocument()
    expect(screen.queryByText('Chi phí dự kiến')).not.toBeInTheDocument()
    expect(screen.queryByText('Tổng dự kiến')).not.toBeInTheDocument()
  })

  it('shows a recovery message for a saved flight date that is now too soon', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-07T17:30:00.000Z'))
    const update = vi.fn()

    render(
      <ScheduleStep
        form={{
          ...createDefaultForm(),
          serviceId: 'service-1',
          address: 'Tân Tập, Tây Ninh',
          preferredDateFrom: '2026-11-14',
          preferredDateTo: '2026-11-14',
          preferredTimeId: 'morning',
        }}
        errors={{}}
        update={update}
        preferredTimes={[
          {
            id: 'morning',
            name: 'Buổi sáng',
            startTime: '08:00',
            endTime: '11:00',
          },
        ]}
        service={{
          id: 'service-1',
          name: 'Giám sát công trình',
          basePrice: 3_500_000,
        }}
        time={{
          id: 'morning',
          name: 'Buổi sáng',
          startTime: '08:00',
          endTime: '11:00',
        }}
      />,
    )

    expect(screen.getByLabelText(/Ngày sớm nhất/)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByText(/Vui lòng chọn ngày mới để tiếp tục/)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })
})
