import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MockDataBadge } from '../MockDataBadge'

describe('MockDataBadge', () => {
  it('renders the sample data label with an explanatory tooltip', () => {
    render(<MockDataBadge />)
    const el = screen.getByText('Dữ liệu mẫu')
    expect(el.getAttribute('title')).toMatch(/Hệ thống/)
  })
})
