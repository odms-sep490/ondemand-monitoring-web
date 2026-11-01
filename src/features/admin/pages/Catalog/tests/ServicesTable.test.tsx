import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ServicesTable } from '../components/ServicesTable'
import type { AdminService } from '../../../types/catalog'

const service: AdminService = {
  id: 's',
  name: 'Service',
  description: 'Description',
  basePrice: 2_000_000,
  isActive: true,
  createdAt: null,
  updatedAt: null,
}
describe('Service catalog related actions', () => {
  it('makes Checklist discoverable and keeps delete inside the secondary disclosure', () => {
    const edit = vi.fn(),
      remove = vi.fn()
    render(<ServicesTable items={[service]} onEdit={edit} onDelete={remove} />)
    expect(screen.getByRole('link', { name: 'Checklist' })).toHaveAttribute(
      'href',
      '#portal/admin/services/s/checklists',
    )
    expect(screen.getByRole('link', { name: 'Checklist' })).toHaveClass(
      'ant-btn',
    )
    expect(screen.queryByRole('button', { name: 'Xóa Service' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Service' }))
    expect(edit).toHaveBeenCalledWith(service)
    fireEvent.click(
      screen.getByRole('button', { name: 'Thao tác khác Service' }),
    )
    const actions = screen.getByRole('group', { name: 'Thao tác khác Service' })
    fireEvent.click(
      within(actions).getByRole('button', { name: 'Xóa Service' }),
    )
    expect(remove).toHaveBeenCalledWith(service)
  })
  it('closes disclosure on Escape and restores keyboard focus', () => {
    render(
      <ServicesTable items={[service]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )
    const trigger = screen.getByRole('button', {
      name: 'Thao tác khác Service',
    })
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: 'Xóa Service' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Xóa Service' }), {
      key: 'Escape',
    })
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Xóa Service' })).toBeNull()
  })
  it('closes secondary actions when clicking outside the row actions', () => {
    render(
      <ServicesTable items={[service]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Thao tác khác Service' }),
    )
    fireEvent.mouseDown(screen.getByText('Description'))
    expect(screen.queryByRole('button', { name: 'Xóa Service' })).toBeNull()
  })
})
