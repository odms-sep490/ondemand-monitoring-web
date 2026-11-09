import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ConfirmDialog, ConfirmProvider, useConfirm } from '../ConfirmDialog'

function Trigger({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm()
  return (
    <button
      onClick={async () =>
        onResult(
          await confirm({
            title: 'Delete?',
            description: 'Cannot undo',
            confirmLabel: 'Yes delete',
            cancelLabel: 'No',
            tone: 'danger',
          }),
        )
      }
    >
      open
    </button>
  )
}

describe('ConfirmDialog', () => {
  it('resolves true on confirm', async () => {
    const onResult = vi.fn()
    render(
      <ConfirmProvider>
        <Trigger onResult={onResult} />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Cannot undo')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Yes delete' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    expect(screen.queryByText('Delete?')).toBeNull()
  })

  it('resolves false on cancel', async () => {
    const onResult = vi.fn()
    render(
      <ConfirmProvider>
        <Trigger onResult={onResult} />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })

  it('uses danger styling and loading state when rendered directly', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        title="Sure?"
        tone="danger"
        loading
        confirmLabel="Do it"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )
    const btn = screen.getByRole('button', { name: 'Do it' })
    expect(btn.className).toContain('is-danger')
    expect(btn.getAttribute('aria-busy')).toBe('true')
    fireEvent.click(btn)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
