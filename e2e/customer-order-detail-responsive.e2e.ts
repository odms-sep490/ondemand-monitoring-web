import { expect, test } from '@playwright/test'

const widths = [320, 360, 375, 390, 430, 768, 1024, 1120, 1280, 1440]
test.setTimeout(120_000)

async function assertNoHorizontalOverflow(
  page: import('@playwright/test').Page,
  width: number,
  section: string,
) {
  if (width < 992) {
    await expect
      .poll(() =>
        page
          .locator('.mgr-sider')
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBeLessThanOrEqual(1)
  }

  const navigationLayout = await page.evaluate(() => {
    const sider = document.querySelector<HTMLElement>('.mgr-sider')
    const main = document.querySelector<HTMLElement>('.mgr-main')
    return {
      siderWidth: sider?.getBoundingClientRect().width ?? 0,
      mainWidth: main?.getBoundingClientRect().width ?? 0,
    }
  })
  if (width < 992) {
    expect(
      navigationLayout.siderWidth,
      `${section} navigation should collapse below 992px`,
    ).toBeLessThanOrEqual(1)
    expect(
      navigationLayout.mainWidth,
      `${section} main content should use the mobile viewport at ${width}px`,
    ).toBeGreaterThanOrEqual(width - 1)
  }

  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => {
        if (element.closest('[hidden]')) return false
        const rect = element.getBoundingClientRect()
        return (
          rect.width > 0 &&
          rect.right > document.documentElement.clientWidth + 1
        )
      })
      .slice(0, 5)
      .map((element) => ({
        tag: element.tagName,
        className:
          typeof element.className === 'string' ? element.className : '',
        right: Math.round(element.getBoundingClientRect().right),
      })),
  }))

  expect(layout.viewport, `${section} viewport at ${width}px`).toBe(width)
  expect(
    layout.document,
    `${section} document overflow at ${width}px: ${JSON.stringify(layout.offenders)}`,
  ).toBeLessThanOrEqual(width)
  expect(
    layout.body,
    `${section} body overflow at ${width}px`,
  ).toBeLessThanOrEqual(width)
}

test('customer order detail stays usable without horizontal overflow at the supported widths', async ({
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
  await page.goto('/#portal/customer/orders/cus-ord-006')
  const resultsTab = page.getByRole('tab', { name: 'Kết quả bàn giao' })
  await expect(resultsTab).toHaveAttribute('aria-selected', 'true', {
    timeout: 60_000,
  })
  await expect(
    page.getByRole('heading', { name: 'Kết quả giám sát của bạn' }),
  ).toBeVisible()

  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 })
    await assertNoHorizontalOverflow(page, width, 'results')
  }

  const overviewTab = page.getByRole('tab', { name: 'Thông tin đơn' })
  await overviewTab.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(resultsTab).toHaveAttribute('aria-selected', 'true')
  await overviewTab.click()
  await expect(
    page.getByRole('tabpanel', { name: 'Thông tin đơn' }),
  ).toBeVisible()
  const monitoringTab = page.getByRole('tab', { name: 'Nội dung giám sát' })
  await monitoringTab.click()
  await expect(
    page.getByRole('tabpanel', { name: 'Nội dung giám sát' }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Bản đồ khu vực giám sát' }),
  ).toBeVisible()
  const mapPlacement = await page
    .locator('.od-overview-visual')
    .evaluate((map) => {
      const previousContent = map.previousElementSibling
      const gap = previousContent
        ? map.getBoundingClientRect().top -
          previousContent.getBoundingClientRect().bottom
        : Number.POSITIVE_INFINITY
      return {
        followsMonitoringContent:
          map.parentElement?.classList.contains('cus-stack'),
        gap,
      }
    })
  expect(mapPlacement.followsMonitoringContent).toBe(true)
  expect(mapPlacement.gap).toBeLessThanOrEqual(32)

  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 })
    await assertNoHorizontalOverflow(page, width, 'monitoring')
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({
    path: 'test-results/customer-order-detail-monitoring-1440.png',
  })
  await page.locator('.od-overview-visual').scrollIntoViewIfNeeded()
  await page.screenshot({
    path: 'test-results/customer-order-detail-monitoring-map-1440.png',
  })
  await resultsTab.click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'test-results/customer-order-detail-results-390.png',
  })

  await page.getByRole('button', { name: /Xem tiến trình bàn giao/ }).click()
  await expect(resultsTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#customer-delivery-panel')).toBeFocused()
})
