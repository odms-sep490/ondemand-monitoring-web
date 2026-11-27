import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { IncidentTraceLinks } from '../IncidentTraceLinks'

const id = 'AI-12345678-abcd-1234-abcd-123456789abc'

it.each(['Mã truy vết', 'Mã truy vết phục hồi', 'Trace'])(
  'opens explicit %s identifiers as text',
  (label) => {
    const onOpen = vi.fn()
    render(
      <IncidentTraceLinks
        text={`${label}: ${id}. <img src=x onerror=alert(1)>`}
        onOpen={onOpen}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: `Xem truy vết ${id}` }))
    expect(onOpen).toHaveBeenCalledWith(id)
    expect(document.querySelector('img')).toBeNull()
  },
)

it('does not link absent, unbounded or arbitrary references', () => {
  const { container } = render(
    <IncidentTraceLinks
      text={`Provider unavailable; ${id}; Trace: ${id}-suffix; Trace: javascript:alert(1)`}
      onOpen={vi.fn()}
    />,
  )
  expect(container.textContent).toBe('')
})

it('deduplicates explicit references and supports legacy canonical IDs', () => {
  render(
    <IncidentTraceLinks
      text={`Trace: ${id}; Mã truy vết: ${id}; Trace: AI-20261127-ABCDEF`}
      onOpen={vi.fn()}
    />,
  )
  expect(screen.getAllByRole('button')).toHaveLength(2)
})
