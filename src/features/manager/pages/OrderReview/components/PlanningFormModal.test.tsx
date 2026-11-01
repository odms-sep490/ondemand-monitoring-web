import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlanningFormModal } from './PlanningFormModal'

function ModalHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open planning
      </button>
      {open && (
        <PlanningFormModal
          kind="create"
          ariaLabel="Create mission"
          heading="Create a mission"
          subtitle="Set up its work and schedule."
          closeAria="Close planning"
          closeTitle="Close"
          onRequestClose={() => setOpen(false)}
        >
          <button type="button">First action</button>
          <button type="button">Last action</button>
        </PlanningFormModal>
      )}
    </>
  )
}

describe('PlanningFormModal accessibility', () => {
  it('labels the dialog and traps keyboard focus until Escape closes it', async () => {
    render(<ModalHarness />)
    const trigger = screen.getByRole('button', { name: 'Open planning' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', {
      name: 'Create a mission',
    })
    expect(dialog).toHaveAttribute('aria-labelledby')

    fireEvent.keyDown(dialog, { key: 'Tab' })
    const closeButton = screen.getByRole('button', { name: 'Close planning' })
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Last action' }), {
      key: 'Tab',
    })
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(closeButton, {
      key: 'Tab',
      shiftKey: true,
    })
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })
})
