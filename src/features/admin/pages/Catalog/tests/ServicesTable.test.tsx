import { fireEvent, render, screen } from '@testing-library/react'
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
  it('makes Checklist discoverable and keeps delete inside the secondary menu', async () => {
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
    expect(screen.queryByLabelText('Xoá Service')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Service' }))
    expect(edit).toHaveBeenCalledWith(service)
    fireEvent.click(
      screen.getByRole('button', { name: 'Thao tác khác Service' }),
    )
    fireEvent.click(await screen.findByLabelText('Xoá Service'))
    expect(remove).toHaveBeenCalledWith(service)
  })
  it('opens the secondary menu from the trigger', async () => {
    render(
      <ServicesTable items={[service]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Thao tác khác Service' }),
    )
    expect(await screen.findByLabelText('Xoá Service')).toBeInTheDocument()
  })
  it('keeps delete out of the row until the secondary menu is opened', () => {
    render(
      <ServicesTable items={[service]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )
    expect(screen.queryByLabelText('Xoá Service')).toBeNull()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })
})
