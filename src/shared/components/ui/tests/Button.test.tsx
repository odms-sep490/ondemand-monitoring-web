import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { Button } from '../Button'

describe('Button', () => {
  it('renders variant and size classes and defaults to type=button', () => {
    render(
      <Button variant="danger" size="sm">
        Remove
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Remove' })
    expect(btn.className).toContain('is-danger')
    expect(btn.className).toContain('is-sm')
    expect(btn.getAttribute('type')).toBe('button')
  })

  it('calls onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('blocks clicks and sets aria-busy while loading', () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn.getAttribute('aria-busy')).toBe('true')
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not fire when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nope' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders a link when href is given', () => {
    render(<Button href="/x">Open</Button>)
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link.getAttribute('href')).toBe('/x')
  })
})
