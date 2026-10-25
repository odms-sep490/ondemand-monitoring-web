import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { AuthAside } from './AuthAside'

describe('AuthAside', () => {
  it('renders the aside with an accessible label', () => {
    render(<AuthAside />)
    expect(
      screen.getByRole('complementary', {
        name: 'OnDemand Monitor - dịch vụ giám sát bằng drone theo yêu cầu',
      }),
    ).toBeInTheDocument()
  })

  it('renders the brand name and subtitle', () => {
    render(<AuthAside />)
    expect(screen.getByText('OnDemand Monitor')).toBeInTheDocument()
    expect(
      screen.getByText('Dịch vụ giám sát bằng drone theo yêu cầu'),
    ).toBeInTheDocument()
  })

  it('renders the 3 value props as real, readable text', () => {
    render(<AuthAside />)
    expect(
      screen.getByText('Chọn vùng giám sát trên bản đồ'),
    ).toBeInTheDocument()
    expect(screen.getByText('AI kiểm tra điều kiện bay')).toBeInTheDocument()
    expect(
      screen.getByText('Theo dõi trực tiếp, nhận ảnh và video'),
    ).toBeInTheDocument()
  })

  it('renders English text when language is switched', () => {
    render(<AuthAside />)
    act(() => setLanguage('en'))
    expect(
      screen.getByRole('complementary', {
        name: 'OnDemand Monitor - on-demand drone monitoring service',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('On-demand drone monitoring service'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Choose a monitoring area on the map'),
    ).toBeInTheDocument()
  })
})
