import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { OrderServiceCard } from './OrderServiceCard'

afterEach(() => setLanguage('vi'))

const props = {
  deliverables: [],
  deliverablesLabel: 'Formats',
  eyebrow: 'Service',
}

describe('OrderServiceCard bilingual content', () => {
  it('shows the Vietnamese or English text of an admin-entered service', () => {
    const serviceName = '{"vi":"Kiểm tra mái","en":"Roof check"}'
    const serviceDescription = '{"vi":"Mô tả mái","en":"Roof description"}'
    setLanguage('vi')
    const { unmount } = render(
      <OrderServiceCard
        {...props}
        serviceName={serviceName}
        serviceDescription={serviceDescription}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Kiểm tra mái' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mô tả mái')).toBeInTheDocument()
    unmount()
    setLanguage('en')
    render(
      <OrderServiceCard
        {...props}
        serviceName={serviceName}
        serviceDescription={serviceDescription}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Roof check' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Roof description')).toBeInTheDocument()
  })

  it('still shows legacy plain text', () => {
    render(
      <OrderServiceCard
        {...props}
        serviceName="Giám sát rừng"
        serviceDescription="Mô tả cũ"
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Giám sát rừng' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mô tả cũ')).toBeInTheDocument()
  })
})
