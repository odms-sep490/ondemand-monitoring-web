import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { ScheduleStep } from './ScheduleStep'

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
          { id: 'morning', name: 'Buổi sáng', startTime: '08:00', endTime: '11:00' },
        ]}
        service={{ id: 'service-1', name: 'Giám sát công trình', basePrice: 3_500_000 }}
        time={{ id: 'morning', name: 'Buổi sáng', startTime: '08:00', endTime: '11:00' }}
        footer={<button type="button">Tiếp tục</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Tùy chọn lịch bay' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tóm tắt lịch bay' })).toBeInTheDocument()
    expect(screen.queryByText('Chi phí dự kiến')).not.toBeInTheDocument()
    expect(screen.queryByText('Tổng dự kiến')).not.toBeInTheDocument()
  })
})
