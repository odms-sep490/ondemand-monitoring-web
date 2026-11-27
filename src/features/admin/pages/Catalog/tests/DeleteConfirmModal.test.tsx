import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'

it('prevents duplicate deletion and closing while the request is pending', async () => {
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  const onConfirm = vi.fn(() => pending),
    onClose = vi.fn(),
    onDeleted = vi.fn()
  render(
    <DeleteConfirmModal
      title="Xóa vĩnh viễn dịch vụ"
      name="Service"
      onConfirm={onConfirm}
      onClose={onClose}
      onDeleted={onDeleted}
    />,
  )
  const confirm = screen.getByRole('button', { name: 'Xoá' })
  fireEvent.click(confirm)
  fireEvent.click(confirm)
  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Huỷ' })).toBeDisabled()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).not.toHaveBeenCalled()
  await act(async () => finish())
  await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
})
