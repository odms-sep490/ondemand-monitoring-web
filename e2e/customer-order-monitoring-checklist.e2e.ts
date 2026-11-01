import { expect, test } from '@playwright/test'

const widths = [320, 390, 768, 1440]

test('customer monitoring checklist is compact, accessible, and responsive', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-1',
        fullName: 'Seed Customer 1',
        email: 'bao.le@logisticscatlai.vn',
        role: 'CUSTOMER',
      }),
    )
  })

  await page.goto('/')
  const checklistItems = [
    {
      id: 'snapshot-1',
      sourceChecklistId: 'template-1',
      content: 'Kiểm tra tình trạng tổng thể công trình',
      description: 'Đánh giá nhanh hiện trạng chung của công trình.',
      executionSteps: [
        'Bay một vòng quanh công trình',
        'Ghi nhận điểm bất thường',
      ],
      inputRequirements: ['Ranh giới khu vực đã xác nhận'],
      expectedOutputs: ['Ảnh tổng quan', 'Ghi chú hiện trạng'],
      displayOrder: 0,
      sourceType: 'SERVICE_TEMPLATE',
      evidencePolicyVersion: 3,
      requestedImageCount: 10,
      requestedVideoCount: 1,
      includedImageCountSnapshot: 10,
      includedVideoCountSnapshot: 1,
    },
    ...[
      'Ghi nhận tiến độ các khu vực đang thi công',
      'Kiểm tra mặt ngoài công trình',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh tổng quan công trình',
      'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
    ].map((content, index) => ({
      id: `snapshot-${index + 2}`,
      sourceChecklistId: `template-${index + 2}`,
      content,
      displayOrder: index + 1,
      sourceType: 'SERVICE_TEMPLATE',
      evidencePolicyVersion: 3,
      requestedImageCount: index === 4 ? 20 : 10,
      requestedVideoCount: index === 4 ? 0 : 1,
      includedImageCountSnapshot: index === 4 ? 20 : 10,
      includedVideoCountSnapshot: index === 4 ? 0 : 1,
    })),
  ]

  const order = {
    id: 'customer-checklist-ui',
    orderCode: 'ORD-CHECKLIST-UI',
    customerId: 'customer-1',
    customerName: 'Seed Customer 1',
    title: 'Kiểm tra công trình',
    serviceId: 'svc-construction',
    serviceName: 'Giám sát công trình',
    orderStatus: 'APPROVED',
    createdAt: '2026-10-30T08:00:00+07:00',
    checklistSnapshotAt: '2026-10-30T08:00:00+07:00',
    canEditChecklist: false,
    checklistItems,
  }

  await page.evaluate(async (seedOrder) => {
    const { createdOrders } =
      await import('/src/mocks/handlers/customerOrdersStore.ts')
    createdOrders.push(seedOrder as never)
  }, order)
  await page.goto('/#portal/customer/orders/customer-checklist-ui')

  await page.getByRole('tab', { name: 'Nội dung giám sát' }).click()
  const card = page.locator('.checklist-card-snapshot')
  const items = card.locator('.checklist-snapshot-item')
  await expect(items).toHaveCount(6)
  await expect(card.getByText('6 hạng mục')).toBeVisible()
  await expect(
    card.getByText('Đã chốt khi gửi yêu cầu · Chỉ xem'),
  ).toBeVisible()
  await expect(card.getByText('Đã nộp')).toHaveCount(0)
  await expect(card.getByText('Chờ duyệt')).toHaveCount(0)

  const firstItem = items.first()
  const details = firstItem.locator('details')
  const summary = details.locator('summary')
  await expect(details).not.toHaveAttribute('open', '')
  await expect(
    firstItem.getByText('Đánh giá nhanh hiện trạng chung của công trình.'),
  ).toBeHidden()
  await summary.click()
  await expect(details).toHaveAttribute('open', '')
  await expect(
    firstItem.getByText('Đánh giá nhanh hiện trạng chung của công trình.'),
  ).toBeVisible()
  await expect(
    firstItem.getByText('Bay một vòng quanh công trình'),
  ).toBeVisible()
  await expect(
    firstItem.getByText('Ranh giới khu vực đã xác nhận'),
  ).toBeVisible()
  await expect(
    firstItem.getByText('Ảnh tổng quan', { exact: true }),
  ).toBeVisible()
  await expect(
    firstItem.getByText('Đã bao gồm: 10 ảnh · 1 video'),
  ).toBeVisible()
  await expect(details.locator('details')).toHaveCount(0)

  await summary.focus()
  await summary.press('Space')
  await expect(details).not.toHaveAttribute('open', '')
  await summary.press('Space')
  await expect(details).toHaveAttribute('open', '')

  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 })
    const layout = await card.evaluate((element) => {
      const viewportWidth = document.documentElement.clientWidth
      const cardRect = element.getBoundingClientRect()
      return {
        viewportWidth,
        documentWidth: document.documentElement.scrollWidth,
        cardRight: cardRect.right,
        descendantsRight: Math.max(
          ...[...element.querySelectorAll('*')].map(
            (node) => node.getBoundingClientRect().right,
          ),
        ),
        summaryHeight:
          element.querySelector('summary')?.getBoundingClientRect().height ?? 0,
      }
    })

    expect(layout.viewportWidth, `viewport at ${width}px`).toBe(width)
    expect(
      layout.documentWidth,
      `document overflow at ${width}px`,
    ).toBeLessThanOrEqual(width)
    expect(
      layout.descendantsRight,
      `checklist overflow at ${width}px`,
    ).toBeLessThanOrEqual(layout.cardRight + 1)
    if (width <= 430) {
      expect(
        layout.summaryHeight,
        'mobile accordion touch target',
      ).toBeGreaterThanOrEqual(44)
    }
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const motionDuration = await summary.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  )
  const durationInMs =
    Number.parseFloat(motionDuration) * (motionDuration.endsWith('ms') ? 1 : 1000)
  expect(durationInMs).toBeLessThanOrEqual(1)
})
