import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { liveDispatchPageMessages } from '../LiveDispatchPage.messages'
import { StaffCombobox } from '../StaffCombobox'

describe('StaffCombobox unavailable staff', () => {
  it('lists unavailable staff as disabled rows with the reason and never selects them', () => {
    setLanguage('vi')
    const onToggle = vi.fn()
    render(
      <StaffCombobox
        role="PILOT"
        staff={[{ id: 'a', fullName: 'Ann', email: 'a@x.vn' }]}
        unavailable={[
          {
            id: 'b',
            fullName: 'Bob',
            email: 'b@x.vn',
            busySessions: [
              {
                id: 'busy-1',
                staffId: 'b',
                staffName: 'Bob',
                date: '2026-09-22',
                dayOfWeek: 'TUESDAY',
                session: 'MORNING',
                startTime: '2026-09-21T23:00:00Z',
                endTime: '2026-09-22T05:00:00Z',
                notes: null,
              },
            ],
          },
          { id: 'c', fullName: 'Cat', email: 'c@x.vn', busySessions: [] },
        ]}
        selectedIds={[]}
        staffByRole={{}}
        open
        t={liveDispatchPageMessages.vi}
        onOpen={vi.fn()}
        onClose={vi.fn()}
        onToggle={onToggle}
        onRemove={vi.fn()}
      />,
    )
    const bob = screen.getByRole('button', { name: /Bob/ }) as HTMLButtonElement
    expect(bob.disabled).toBe(true)
    expect(bob.textContent).toContain('Đã báo bận')
    expect(bob.textContent).toContain('Sáng 22/09')
    const cat = screen.getByRole('button', { name: /Cat/ }) as HTMLButtonElement
    expect(cat.disabled).toBe(true)
    expect(cat.textContent).toContain('Trùng nhiệm vụ')
    fireEvent.click(bob)
    fireEvent.click(cat)
    expect(onToggle).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Ann/ }))
    expect(onToggle).toHaveBeenCalledWith('a')
  })
})
