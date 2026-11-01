import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PricingEstimateCard } from './PricingEstimateCard'
import { selectionEstimate } from '../../../lib/checklist/selectionEstimate'

describe('PricingEstimateCard', () => {
  it('explains that checklist changes are reflected in the final manager quote', () => {
    render(
      <PricingEstimateCard
        estimate={{
          serviceId: 'service-1',
          servicePrice: 3_200_000,
          additionalRequirements: [],
          totalPrice: 3_200_000,
        }}
        loading={false}
        hasService
      />,
    )

    expect(
      screen.getByText(/Quản lý sẽ gửi báo giá cuối cùng/),
    ).toBeInTheDocument()
    expect(screen.getByText(/báo giá cuối cùng/)).toBeInTheDocument()
    expect(screen.queryByText('Dịch vụ bổ sung')).not.toBeInTheDocument()
  })

  it('shows that manager-quoted requirements are excluded', () => {
    render(
      <PricingEstimateCard
        estimate={{
          serviceId: 'service-1',
          servicePrice: 500_000,
          additionalRequirements: [],
          totalPrice: 500_000,
          quotePending: true,
        }}
        loading={false}
        hasService
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      /Báo giá dự kiến chưa bao gồm dịch vụ bổ sung/,
    )
  })

  it('lists additional checklist requirements without exposing an internal price', () => {
    render(
      <PricingEstimateCard
        estimate={{
          serviceId: 'service-1',
          servicePrice: 3_500_000,
          additionalRequirements: [],
          totalPrice: 3_500_000,
          quotePending: true,
        }}
        loading={false}
        hasService
        additionalChecklists={[
          {
            key: 'additional-1',
            sourceChecklistId: 'checklist-7',
            version: 1,
            originalContent: 'Kiểm tra tình trạng mái phía sau',
            content: 'Kiểm tra tình trạng mái phía sau',
            selected: true,
            minimumEvidenceCount: 0,
            requiredEvidenceType: 'IMAGE_AND_VIDEO',
            includedImageCount: 0,
            includedVideoCount: 0,
            requestedImageCount: 20,
            requestedVideoCount: 2,
            mandatory: false,
            packageItem: false,
          },
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'DỊCH VỤ BỔ SUNG' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Kiểm tra tình trạng mái phía sau'),
    ).toBeInTheDocument()
    expect(screen.getByText('20 ảnh · 2 video')).toBeInTheDocument()
    expect(screen.getByText('Chờ quản lý duyệt báo giá')).toBeInTheDocument()
    expect(
      screen.getByText('Đang chờ quản lý duyệt báo giá'),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/3\.500\.000/)).toHaveLength(2)
    expect(screen.queryByText(/880\.000/)).not.toBeInTheDocument()
  })

  it('takes the service price and add-ons from the checklist quote', () => {
    expect(
      selectionEstimate(
        {
          serviceId: 'service-1',
          servicePrice: 3_200_000,
          additionalRequirements: [],
          totalPrice: 3_200_000,
        },
        {
          serviceId: 'service-1',
          serviceName: 'Service',
          currency: 'VND',
          policyId: 'policy-1',
          policyVersion: 1,
          draftPolicy: false,
          priceSource: 'CHECKLISTS',
          packageFee: 0,
          checklists: [],
          checklistSubtotal: 900_000,
          total: 1_400_000,
          complete: false,
          warnings: [],
          quotePending: true,
          addOns: [
            { key: 'OUTPUT_VIDEO', description: 'Video bàn giao', amount: 500_000 },
          ],
        },
      ),
    ).toMatchObject({
      servicePrice: 900_000,
      totalPrice: 1_400_000,
      quotePending: true,
      additionalRequirements: [
        { type: 'OUTPUT_VIDEO', description: 'Video bàn giao', additionalPrice: 500_000 },
      ],
    })
  })

  it('shows an order-level video as a customer-visible deliverable fee', () => {
    render(
      <PricingEstimateCard
        estimate={{
          serviceId: 'service-1',
          servicePrice: 4_050_000,
          additionalRequirements: [
            {
              type: 'OUTPUT_VIDEO',
              description: 'Video bàn giao',
              additionalPrice: 300_000,
            },
          ],
          totalPrice: 4_350_000,
        }}
        loading={false}
        hasService
      />,
    )

    expect(screen.getByRole('heading', { name: 'Sản phẩm bàn giao' })).toBeInTheDocument()
    expect(screen.getByText('Video bàn giao')).toBeInTheDocument()
    expect(screen.getByText(/\+300\.000/)).toBeInTheDocument()
    expect(screen.getByText(/4\.350\.000/)).toBeInTheDocument()
  })

  it('separates a contextual area charge from the default checklist content', () => {
    const estimate = selectionEstimate(null, {
      serviceId: 'area-monitoring',
      serviceName: 'Giám sát khu vực',
      currency: 'VND',
      policyId: 'policy-1',
      policyVersion: 1,
      draftPolicy: false,
      priceSource: 'CHECKLISTS',
      packageFee: 0,
      checklists: [
        {
          checklistId: 'area-checklist',
          content: 'Ghi nhận toàn cảnh khu vực',
          pricingProfile: 'DEFAULT',
          custom: false,
          includedImageCount: 10,
          includedVideoCount: 1,
          requestedImageCount: 10,
          requestedVideoCount: 1,
          extraImageCount: 0,
          extraVideoCount: 0,
          standardVideoDurationSeconds: 60,
          lines: [
            {
              component: 'BASE',
              category: 'CHECKLIST',
              description: 'Giá cơ bản checklist',
              quantity: 1,
              unitPrice: 600_000,
              amount: 600_000,
              tierFrom: null,
              tierTo: null,
              blockSize: null,
              rounding: null,
            },
            {
              component: 'AREA',
              category: 'AREA',
              description: 'Phụ phí theo mỗi 10 ha',
              quantity: 2,
              unitPrice: 100_000,
              amount: 200_000,
              tierFrom: 10,
              tierTo: 50,
              blockSize: 10,
              rounding: 'CEILING',
            },
          ],
          subtotal: 800_000,
          quotePending: false,
        },
      ],
      checklistSubtotal: 2_700_000,
      addOns: [
        {
          key: 'OUTPUT_VIDEO',
          description: 'Video bàn giao',
          amount: 300_000,
        },
      ],
      total: 3_000_000,
      complete: true,
      warnings: [],
      quotePending: false,
      occurrences: 1,
    })

    expect(estimate).toMatchObject({
      servicePrice: 2_500_000,
      totalPrice: 3_000_000,
      additionalRequirements: [
        {
          type: 'CONTEXT_AREA',
          description: 'AREA',
          additionalPrice: 200_000,
        },
        { type: 'OUTPUT_VIDEO', additionalPrice: 300_000 },
      ],
    })

    render(
      <PricingEstimateCard
        estimate={estimate}
        loading={false}
        hasService
      />,
    )

    expect(screen.getByText('Nội dung giám sát').nextSibling).toHaveTextContent(
      /2\.500\.000/,
    )
    expect(screen.getByText('Phụ phí diện tích').nextSibling).toHaveTextContent(
      /\+200\.000/,
    )
    expect(screen.getByText('Video bàn giao').nextSibling).toHaveTextContent(
      /\+300\.000/,
    )
    expect(screen.getByText('Tổng dự kiến').nextSibling).toHaveTextContent(
      /3\.000\.000/,
    )
  })
})
