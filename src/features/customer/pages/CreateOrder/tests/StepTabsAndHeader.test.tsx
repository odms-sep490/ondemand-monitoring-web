import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { DateEcho, weekdayOf } from '../components/DateEcho'
import { StepTabs } from '../components/StepTabs'
import { CreateOrderPage } from '../CreateOrderPage'

const labels = {
  1: 'Dịch vụ & mục tiêu',
  2: 'Vị trí & vùng giám sát',
  3: 'Nội dung giám sát',
  4: 'Chi tiết & quyền giám sát',
  5: 'Thời gian',
  6: 'Kết quả bàn giao & xác nhận',
} as const

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  act(() => setLanguage('vi'))
})

describe('StepTabs', () => {
  it('exposes six steps with their full titles, the current one marked and later ones disabled', () => {
    render(<StepTabs step={3} labels={labels} onSelect={() => {}} />)
    const nav = screen.getByRole('navigation')
    const tabs = within(nav).getAllByRole('button')
    expect(tabs).toHaveLength(6)
    // Full text is in the DOM (CSS wraps or hides it, never truncates), so the accessible names are complete.
    expect(tabs[5].textContent).toContain('Kết quả bàn giao & xác nhận')
    expect(
      within(nav).getByRole('button', { name: /Kết quả bàn giao & xác nhận/ }),
    ).toBeTruthy()
    expect(tabs.map((tab) => tab.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'step',
      null,
      null,
      null,
    ])
    expect(tabs.map((tab) => (tab as HTMLButtonElement).disabled)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
    ])
  })

  it('lets finished steps be reopened but not later ones', () => {
    const onSelect = vi.fn()
    render(<StepTabs step={3} labels={labels} onSelect={onSelect} />)
    const nav = screen.getByRole('navigation')
    fireEvent.click(
      within(nav).getByRole('button', { name: /Vị trí & vùng giám sát/ }),
    )
    fireEvent.click(within(nav).getByRole('button', { name: /Thời gian/ }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('writes the position out as text for narrow screens', () => {
    render(<StepTabs step={2} labels={labels} onSelect={() => {}} />)
    expect(screen.getByText(/Bước 2 \/ 6/)).toBeTruthy()
  })
})

describe('CreateOrderPage header', () => {
  it('keeps one shared navigation bar available outside the step cards', async () => {
    render(<CreateOrderPage />)
    await screen.findByRole('button', { name: /Giám sát công trình/ })
    const nav = screen.getByRole('navigation', {
      name: 'Điều hướng tạo yêu cầu',
    })
    expect(within(nav).getByRole('button', { name: /Tiếp tục:/ })).toBeEnabled()
    expect(
      screen.getAllByRole('navigation', { name: 'Điều hướng tạo yêu cầu' }),
    ).toHaveLength(1)
  })

  it('keeps Cancel as a link to the orders page', async () => {
    render(<CreateOrderPage />)
    await screen.findByText('Tạo yêu cầu giám sát')
    const cancel = screen.getByRole('link', { name: 'Hủy' })
    expect(cancel.getAttribute('href')).toContain('orders')
    expect(cancel.className).toContain('ant-btn')
  })

  it('still asks for confirmation before leaving', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<CreateOrderPage />)
    await screen.findByText('Tạo yêu cầu giám sát')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByRole('link', { name: 'Hủy' }).dispatchEvent(click)
    expect(confirm).toHaveBeenCalled()
    expect(click.defaultPrevented).toBe(true)
    confirm.mockRestore()
  })
})

describe('DateEcho', () => {
  it('shows only the weekday, which the native date input does not show', () => {
    const { container } = render(<DateEcho value="2026-11-12" />)
    expect(container.textContent).toBe('Thứ Năm')
    expect(container.textContent).not.toContain('12/11/2026')
  })

  it('follows the interface language', () => {
    act(() => setLanguage('en'))
    const { container } = render(<DateEcho value="2026-11-12" />)
    expect(container.textContent).toBe('Thursday')
  })

  it('renders nothing for an empty or impossible date', () => {
    expect(render(<DateEcho value="" />).container.textContent).toBe('')
    expect(weekdayOf('2026-02-31', 'en')).toBe('')
  })
})
