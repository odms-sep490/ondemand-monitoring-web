import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { Pager } from '../Pager'

describe('Pager', () => {
  it('shows the total and page, and pages both ways', () => {
    const onPage = vi.fn()
    render(<Pager page={1} totalPages={3} totalItems={50} unit="tệp" onPage={onPage} />)
    expect(screen.getByText('50 tệp')).toBeInTheDocument()
    expect(screen.getByText('Trang 2 / 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(onPage).toHaveBeenNthCalledWith(1, 0)
    expect(onPage).toHaveBeenNthCalledWith(2, 2)
  })

  it('hides navigation buttons when all items fit on a single page', () => {
    render(<Pager page={0} totalPages={1} totalItems={3} unit="x" onPage={() => {}} />)
    expect(screen.getByText('3 x')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trang trước' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trang sau' })).not.toBeInTheDocument()
  })
})
