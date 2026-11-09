import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'small-mobile', width: 360, height: 800, mapMin: 260, mapMax: 320 },
  { name: 'mobile', width: 390, height: 844, mapMin: 260, mapMax: 320 },
  { name: 'tablet', width: 768, height: 1024, mapMin: 300, mapMax: 360 },
  { name: 'small-desktop', width: 1024, height: 768, mapMin: 340, mapMax: 390 },
  { name: 'desktop', width: 1440, height: 900, mapMin: 360, mapMax: 420 },
  {
    name: 'large-desktop',
    width: 1920,
    height: 1080,
    mapMin: 360,
    mapMax: 420,
  },
]

test('Mission Detail stays usable and accessible across production viewports', async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/e2e/harness/mission-detail.html')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Mission MS-47101' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Thông tin để quyết định' }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Bản đồ vệ tinh nhiệm vụ' }),
  ).toBeVisible()

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await expect(page.getByRole('button', { name: 'Từ chối' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Chấp nhận nhiệm vụ' }),
    ).toBeVisible()

    const dimensions = await page.evaluate(() => {
      const content = document.querySelector<HTMLElement>('.odm-opr-content')!
      const map = document.querySelector<HTMLElement>('.mds-map-viewport')!
      return {
        contentClientWidth: content.clientWidth,
        contentScrollWidth: content.scrollWidth,
        mapWidth: map.clientWidth,
        mapHeight: map.clientHeight,
      }
    })
    expect(dimensions.contentScrollWidth).toBeLessThanOrEqual(
      dimensions.contentClientWidth,
    )
    expect(dimensions.mapWidth).toBeGreaterThan(0)
    expect(dimensions.mapHeight).toBeGreaterThanOrEqual(viewport.mapMin)
    expect(dimensions.mapHeight).toBeLessThanOrEqual(viewport.mapMax)

    const mapCardBounds = await page.locator('.mds-map-card').boundingBox()
    const checklistBounds = await page
      .locator('details.mds-pending-checklist')
      .boundingBox()
    expect(mapCardBounds).not.toBeNull()
    expect(checklistBounds).not.toBeNull()
    expect(checklistBounds!.y - mapCardBounds!.y - mapCardBounds!.height).toBe(
      16,
    )
    await expect(page.getByText('Thông số và mã định danh khác')).toBeVisible()

    if (viewport.width >= 1200) {
      const columnHeights = await page.evaluate(() => ({
        primary: document.querySelector('.mds-pending-primary')!.clientHeight,
        secondary: document.querySelector('.mds-pending-secondary')!
          .clientHeight,
      }))
      expect(
        Math.abs(columnHeights.primary - columnHeights.secondary),
      ).toBeLessThanOrEqual(80)
    }

    const contentBounds = await page.locator('.odm-opr-content').boundingBox()
    const acceptBounds = await page
      .getByRole('button', { name: 'Chấp nhận nhiệm vụ' })
      .boundingBox()
    expect(contentBounds).not.toBeNull()
    expect(acceptBounds).not.toBeNull()
    expect(acceptBounds!.x).toBeGreaterThanOrEqual(contentBounds!.x)
    expect(acceptBounds!.x + acceptBounds!.width).toBeLessThanOrEqual(
      contentBounds!.x + contentBounds!.width,
    )

    await page.screenshot({
      path: testInfo.outputPath(`mission-detail-${viewport.name}.png`),
      fullPage: true,
    })
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Bỏ qua đến nội dung chính' })
  await expect(skipLink).toBeFocused()
  const skipLinkBounds = await skipLink.boundingBox()
  expect(skipLinkBounds?.y).toBeGreaterThanOrEqual(0)

  const deviceDetails = page.locator('details.mds-device-details')
  await deviceDetails.locator('summary').click()
  await expect(page.getByText('device-ui-audit')).toBeVisible()
  await deviceDetails.locator('summary').click()

  await page.getByRole('button', { name: 'Toàn tuyến' }).click()
  await expect(
    page.getByRole('button', { name: 'Toàn tuyến' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Vùng giám sát' }).click()
  await expect(
    page.getByRole('button', { name: 'Vùng giám sát' }),
  ).toHaveAttribute('aria-pressed', 'true')

  const checklistDisclosure = page.locator('details.mds-pending-checklist')
  await expect(checklistDisclosure).not.toHaveAttribute('open')
  await expect(
    page.getByText('Checklist đang khóa cho đến khi chấp nhận nhiệm vụ.'),
  ).toBeAttached()

  await page.getByRole('button', { name: 'Từ chối' }).click()
  await expect(
    page.getByRole('dialog', { name: /Từ chối mission MS-47101/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Huỷ|Cancel/ }).click()
  await page.getByRole('button', { name: 'Chấp nhận nhiệm vụ' }).click()
  await expect(page.getByRole('link', { name: 'Kết nối GCS' })).toBeVisible()
  await expect(
    page.getByText('Checklist đã mở sau khi chấp nhận nhiệm vụ.'),
  ).toBeVisible()
  expect(pageErrors).toEqual([])
})
