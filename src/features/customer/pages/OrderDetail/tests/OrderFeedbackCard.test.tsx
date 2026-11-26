import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { orderFeedbackApi, type OrderFeedbackState } from '../../../api/orderFeedbackApi'
import { OrderFeedbackCard } from '../components/OrderFeedbackCard'

const eligible: OrderFeedbackState = { orderId: 'order-1', eligible: true, feedback: null }

describe('OrderFeedbackCard', () => {
  beforeEach(() => setLanguage('vi'))
  afterEach(() => vi.restoreAllMocks())

  it('renders nothing before the result is accepted', async () => {
    const get = vi
      .spyOn(orderFeedbackApi, 'get')
      .mockResolvedValue({ orderId: 'order-1', eligible: false, feedback: null })
    const { container } = render(<OrderFeedbackCard orderId="order-1" />)
    await waitFor(() => expect(get).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('requires an overall rating before submitting', async () => {
    vi.spyOn(orderFeedbackApi, 'get').mockResolvedValue(eligible)
    const submit = vi.spyOn(orderFeedbackApi, 'submit')
    render(<OrderFeedbackCard orderId="order-1" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Gửi đánh giá' }))

    expect(await screen.findByText('Vui lòng chọn số sao đánh giá chung.')).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  it('submits the rating and shows the thank-you state', async () => {
    vi.spyOn(orderFeedbackApi, 'get').mockResolvedValue(eligible)
    const submit = vi.spyOn(orderFeedbackApi, 'submit').mockResolvedValue({
      orderId: 'order-1',
      eligible: false,
      feedback: {
        id: 'fb-1',
        rating: 4,
        qualityRating: null,
        punctualityRating: null,
        communicationRating: null,
        comment: 'Tốt',
        createdAt: '2026-11-25T00:00:00Z',
      },
    })
    render(<OrderFeedbackCard orderId="order-1" />)

    await screen.findByRole('button', { name: 'Gửi đánh giá' })
    const overallStars = screen.getAllByRole('radio')
    fireEvent.click(overallStars[3])
    fireEvent.change(screen.getByLabelText('Nhận xét (không bắt buộc)'), { target: { value: ' Tốt ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith('order-1', {
        rating: 4,
        qualityRating: null,
        punctualityRating: null,
        communicationRating: null,
        comment: 'Tốt',
      }),
    )
    expect(await screen.findByText('Cảm ơn bạn đã đánh giá đơn hàng này.')).toBeInTheDocument()
  })
})
