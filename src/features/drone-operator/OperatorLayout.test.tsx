import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

import { setLanguage } from '../../shared/i18n'
import { OperatorLayout } from './OperatorLayout'

describe('OperatorLayout', () => {
  it('renders the vietnamese breadcrumb for the current screen', () => {
    const { container } = render(
      <OperatorLayout
        route={{ screen: 'availability' }}
        searchQuery=""
        onSearchChange={vi.fn()}
      >
        <div>content</div>
      </OperatorLayout>,
    )
    expect(
      container.querySelector('.ant-breadcrumb li:last-child')?.textContent,
    ).toBe('Lịch rảnh')
  })

  it('renders the english breadcrumb when language is switched', () => {
    const { container } = render(
      <OperatorLayout
        route={{ screen: 'availability' }}
        searchQuery=""
        onSearchChange={vi.fn()}
      >
        <div>content</div>
      </OperatorLayout>,
    )
    act(() => setLanguage('en'))
    expect(
      container.querySelector('.ant-breadcrumb li:last-child')?.textContent,
    ).toBe('Availability')
  })
})
