import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { getFaqArticles } from '../data/helpArticles'
import { ContextAwareHelpWidget } from './ContextAwareHelpWidget'

beforeEach(() => setLanguage('vi'))

describe('ContextAwareHelpWidget', () => {
  it('uses result-review FAQs instead of order-approval FAQs', () => {
    render(
      <ContextAwareHelpWidget
        type="ORDER"
        id="ORD-123"
        status="COMPLETED"
        deliveryStatus="CUSTOMER_REVIEW"
      />,
    )

    expect(
      screen.getByText(
        getFaqArticles('vi').find((article) => article.id === 'res-1')!
          .question,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/vẫn đang chờ phê duyệt/i),
    ).not.toBeInTheDocument()
  })

  it('does not show unrelated approval FAQs while the final payment is pending', () => {
    render(
      <ContextAwareHelpWidget
        type="ORDER"
        id="ORD-123"
        status="COMPLETED"
        deliveryStatus="FINAL_PAYMENT_PENDING"
      />,
    )

    expect(
      screen.getByText(/Chưa có câu hỏi thường gặp riêng/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/phê duyệt/i)).not.toBeInTheDocument()
  })
})
