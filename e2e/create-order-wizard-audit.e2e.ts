import { expect, test, type Page, type TestInfo } from '@playwright/test'

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]

async function inspectResponsiveState(
  page: Page,
  step: number,
  state: string,
  testInfo: TestInfo,
) {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(80)
    const layout = await page.evaluate(() => {
      const controls = [
        ...document.querySelectorAll<HTMLElement>(
          '.co-tabs button, .co-page button, .co-page a[href], .co-page select, .co-page textarea, .co-page input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"])',
        ),
      ]
      const visible = (element: HTMLElement) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        )
      }
      const undersized = controls
        .filter(visible)
        .filter((element) => !element.closest('.leaflet-control-attribution'))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            name:
              element.getAttribute('aria-label') ||
              element.textContent?.trim() ||
              element.getAttribute('name') ||
              element.tagName.toLowerCase(),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }
        })
        .filter((target) => target.width < 24 || target.height < 24)
      const fields = [
        ...document.querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(
          '.co-page input:not([type="hidden"]), .co-page select, .co-page textarea',
        ),
      ]
      const unlabeledFields = fields
        .filter((field) => visible(field))
        .filter(
          (field) =>
            !field.labels?.length &&
            !field.getAttribute('aria-label') &&
            !field.getAttribute('aria-labelledby'),
        )
        .map((field) => field.outerHTML.slice(0, 120))
      const activeStep = document.querySelector('.co-tab[aria-current="step"]')
      const dock = document.querySelector<HTMLElement>('.co-action-dock')
      const rect = dock?.getBoundingClientRect()
      return {
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        scrollY: window.scrollY,
        activeStep: activeStep?.getAttribute('aria-label') ?? null,
        dockPosition: dock ? getComputedStyle(dock).position : null,
        dockRect: rect ? { top: rect.top, bottom: rect.bottom } : null,
        undersized,
        unlabeledFields,
      }
    })

    expect(layout.viewportWidth, `viewport at ${viewport.width}px`).toBe(
      viewport.width,
    )
    expect(
      layout.documentWidth,
      `horizontal overflow in step ${step} at ${viewport.width}px (${state})`,
    ).toBeLessThanOrEqual(viewport.width)
    expect(layout.activeStep, `active step at ${viewport.width}px`).toContain(
      `— đang thực hiện`,
    )
    expect(layout.dockPosition, `action dock at ${viewport.width}px`).toBe(
      'static',
    )
    expect(
      layout.undersized,
      `controls below 24×24 in step ${step} at ${viewport.width}px`,
    ).toEqual([])
    expect(
      layout.unlabeledFields,
      `unlabeled form fields in step ${step} at ${viewport.width}px`,
    ).toEqual([])

    await page.screenshot({
      path: testInfo.outputPath(`step-${step}-${state}-${viewport.width}.png`),
      fullPage: true,
    })
  }

  await page.setViewportSize(VIEWPORTS[0])
}

async function openWizard(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-audit',
        fullName: 'Audit Customer',
        email: 'audit@example.test',
        role: 'CUSTOMER',
      }),
    )
    if (!sessionStorage.getItem('e2e-create-order-audit-initialized')) {
      localStorage.removeItem('odm.customer.createOrderDraft.v2')
      sessionStorage.setItem('e2e-create-order-audit-initialized', 'true')
    }
  })
  await page.goto('/#portal/customer/orders/new')
  await expect(
    page.getByRole('button', { name: /Giám sát công trình/ }),
  ).toBeVisible()
}

test('CreateOrder six-step flow recovers validation and stays responsive', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000)
  const pageErrors: string[] = []
  const orderPosts: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      /\/api\/orders(?:\?|$)/.test(request.url())
    ) {
      orderPosts.push(request.url())
    }
  })
  await page.route('**/api/orders**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 418, body: 'Blocked by audit test' })
    } else {
      await route.continue()
    }
  })
  // Reproduce the documented offline map condition and verify its explicit notice.
  await page.route(
    /https:\/\/(tile\.openstreetmap\.org|server\.arcgisonline\.com)\//,
    (route) => route.abort(),
  )
  await openWizard(page)

  // Step 1: required fields are identified beside their inputs.
  await page
    .getByRole('button', { name: /Tiếp tục: Vị trí & vùng giám sát/ })
    .click()
  await expect(page.getByText('Nhập tiêu đề yêu cầu.')).toBeVisible()
  await inspectResponsiveState(page, 1, 'validation', testInfo)
  await page.getByLabel(/Tiêu đề/).fill('Nghiệm thu giao diện sáu bước')
  await page.getByLabel(/Tiêu đề/).focus()
  await page.keyboard.press('Tab')
  await expect(page.locator('#co-flight-purpose')).toBeFocused()
  await page
    .locator('#co-flight-purpose')
    .selectOption('CONSTRUCTION_MONITORING')

  // Step 2: missing location blocks progress; offline tiles show the fallback notice.
  await page
    .getByRole('button', { name: /Tiếp tục: Vị trí & vùng giám sát/ })
    .click()
  await page
    .getByRole('button', { name: /Tiếp tục: Nội dung giám sát/ })
    .click()
  await expect(
    page.getByText(
      'Xác nhận lại vị trí để đồng bộ địa chỉ, tọa độ và điểm trên bản đồ.',
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('region', {
      name: 'Bản đồ chọn vị trí và khu vực giám sát',
    }),
  ).toBeVisible()
  await expect
    .poll(() => page.locator('.co-area-map').getAttribute('class'))
    .toContain('has-tile-error')
  await expect(page.locator('.co-area-map-error')).toBeVisible()
  await inspectResponsiveState(page, 2, 'validation-and-offline-map', testInfo)
  await page.getByText('Tọa độ nâng cao', { exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận tọa độ' }).click()
  await expect(page.locator('.co-area-selected-location')).toContainText(
    '10.640200, 106.691200',
  )
  await page.getByRole('button', { name: 'Tự vẽ vùng' }).click()
  const mapBounds = await page.locator('.co-area-map').boundingBox()
  expect(mapBounds).toBeTruthy()
  const drawPoints = [
    [0.35, 0.35],
    [0.65, 0.35],
    [0.65, 0.65],
    [0.35, 0.65],
  ]
  for (const [xRatio, yRatio] of drawPoints) {
    await page.mouse.click(
      mapBounds!.x + mapBounds!.width * xRatio,
      mapBounds!.y + mapBounds!.height * yRatio,
    )
  }
  await page.locator('.leaflet-marker-icon.co-area-handle').first().click()
  await expect(page.locator('.co-area-metric-grid dd').last()).toHaveText('4')
  await expect(page.locator('.co-area-map-edit-tools')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('step-2-freehand-area.png'),
    fullPage: true,
  })

  // Step 3: an empty checklist is explicitly blocked, then restored.
  await page
    .getByRole('button', { name: /Tiếp tục: Nội dung giám sát/ })
    .click()
  await page.getByLabel('Chọn tất cả (6)').uncheck()
  await expect(
    page.getByRole('button', { name: /Tiếp tục: Chi tiết & quyền giám sát/ }),
  ).toBeDisabled()
  await expect(
    page.getByRole('status').filter({ hasText: /nội dung giám sát/i }),
  ).toBeVisible()
  await inspectResponsiveState(page, 3, 'empty-checklist', testInfo)
  await page.getByLabel(/^Chọn tất cả/).check()
  await expect(page.getByLabel(/^Chọn tất cả/)).toBeChecked()

  // Step 4: required contact, access and authorization errors recover in place.
  await page
    .getByRole('button', { name: /Tiếp tục: Chi tiết & quyền giám sát/ })
    .click()
  await page.getByLabel(/Người liên hệ/).clear()
  await page.getByLabel(/Số điện thoại/).clear()
  await page.getByLabel(/Điều kiện ra vào/).clear()
  await page.getByLabel(/Tôi xác nhận mình có quyền yêu cầu giám sát/).uncheck()
  await page.getByRole('button', { name: /Tiếp tục: Thời gian/ }).click()
  await expect(
    page.getByText('Nhập tên người liên hệ tại hiện trường.'),
  ).toBeVisible()
  await expect(
    page.getByText('Nhập số điện thoại liên hệ tại hiện trường.'),
  ).toBeVisible()
  await expect(
    page.getByText('Chọn quan hệ của bạn với khu vực giám sát.'),
  ).toBeVisible()
  await expect(
    page.getByRole('radio', { name: 'Chủ sở hữu / Chủ đầu tư' }),
  ).toHaveAttribute('aria-describedby', 'co-monitoring-relationship-error')
  await inspectResponsiveState(page, 4, 'validation', testInfo)
  await page.getByLabel(/Người liên hệ/).fill('An Nguyễn')
  await page.getByLabel(/Số điện thoại/).fill('0901234567')
  await page.getByLabel(/Điều kiện ra vào/).fill('Cổng chính')
  await page.getByRole('radio', { name: 'Chủ sở hữu / Chủ đầu tư' }).check()
  await page.getByLabel(/Tôi xác nhận mình có quyền yêu cầu giám sát/).check()

  // Step 5: stale saved date survives reload and is never silently rewritten.
  await page.getByRole('button', { name: /Tiếp tục: Thời gian/ }).click()
  const startDate = page.getByLabel(/Ngày sớm nhất/)
  const endDate = page.getByLabel(/Ngày muộn nhất/)
  const earliest = await startDate.getAttribute('min')
  expect(earliest).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  await startDate.fill(earliest!)
  await endDate.fill(earliest!)
  const time = page.getByLabel(/Khung giờ/)
  await expect.poll(() => time.locator('option').count()).toBeGreaterThan(1)
  const selectedTime = await time
    .locator('option')
    .evaluateAll((options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .find(Boolean),
    )
  expect(selectedTime).toBeTruthy()
  await time.selectOption(selectedTime!)

  const staleDate = await page.evaluate((minDate) => {
    const date = new Date(`${minDate}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - 1)
    return date.toISOString().slice(0, 10)
  }, earliest!)
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(localStorage.getItem('odm.customer.createOrderDraft.v2')),
      ),
    )
    .toBe(true)
  await page.evaluate(
    ({ date }) => {
      const key = 'odm.customer.createOrderDraft.v2'
      const draft = JSON.parse(localStorage.getItem(key) || '{}')
      draft.form.preferredDateFrom = date
      draft.form.preferredDateTo = date
      localStorage.setItem(key, JSON.stringify(draft))
    },
    { date: staleDate },
  )
  await page.reload()
  await expect(page.getByLabel(/Ngày sớm nhất/)).toHaveValue(staleDate)
  await expect(page.getByLabel(/Ngày sớm nhất/)).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(
    page.getByText(/Vui lòng chọn ngày mới để tiếp tục/),
  ).toBeVisible()
  await inspectResponsiveState(page, 5, 'stale-draft-date', testInfo)
  await expect(page.getByLabel(/Ngày sớm nhất/)).toHaveValue(staleDate)

  await startDate.fill(earliest!)
  await endDate.fill(earliest!)
  await expect(page.getByLabel(/Ngày sớm nhất/)).not.toHaveAttribute(
    'aria-invalid',
    'true',
  )

  // Step 6: errors remain actionable, the review matches the form, and no order is sent.
  await page
    .getByRole('button', { name: /Tiếp tục: Kết quả bàn giao & xác nhận/ })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Rà soát yêu cầu' }),
  ).toBeVisible()
  await expect(page.getByText('Nghiệm thu giao diện sáu bước')).toBeVisible()
  await expect(page.getByText('10.6402000, 106.6912000').first()).toBeVisible()
  await expect(page.getByText('Cao 60 m')).toBeVisible()
  await expect(page.getByRole('button', { name: /Gửi yêu cầu/ })).toBeEnabled()
  await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()
  await expect(page.getByText(/Bạn cần đồng ý điều khoản/)).toBeVisible()
  await inspectResponsiveState(page, 6, 'validation', testInfo)
  await page.getByLabel(/Tôi xác nhận mục đích giám sát/).check()
  await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()
  const confirmationDialog = page.getByRole('dialog')
  await expect(confirmationDialog).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).focus()
  await page.keyboard.press('Escape')
  await expect(confirmationDialog).toBeHidden()
  await expect(page.getByRole('button', { name: /Gửi yêu cầu/ })).toBeFocused()

  // Edit a previous step and verify downstream summary state updates.
  await page.getByRole('button', { name: 'Sửa: Hiện trường' }).click()
  await expect(
    page.locator('.co-tab[aria-current="step"]'),
  ).toHaveAccessibleName(/Chi tiết & quyền giám sát/)
  await page.getByLabel(/Độ cao giám sát/).fill('70')
  await page.getByRole('button', { name: /Tiếp tục: Thời gian/ }).click()
  await expect(page.getByText('70 m')).toBeVisible()
  await page
    .getByRole('button', { name: /Tiếp tục: Kết quả bàn giao & xác nhận/ })
    .click()
  await expect(page.getByText('Cao 70 m')).toBeVisible()

  // Keyboard navigation to a completed step preserves the selected schedule.
  const scheduleTab = page.getByRole('button', {
    name: /Thời gian — đã hoàn tất/,
  })
  await scheduleTab.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel(/Ngày sớm nhất/)).toHaveValue(earliest!)
  await expect(page.getByLabel(/Khung giờ/)).toHaveValue(selectedTime!)
  await page.getByRole('button', { name: 'Quay lại' }).click()
  await expect(
    page.locator('.co-tab[aria-current="step"]'),
  ).toHaveAccessibleName(/Chi tiết & quyền giám sát/)
  await expect(page.getByLabel(/Độ cao giám sát/)).toHaveValue('70')
  await page.getByRole('button', { name: 'Quay lại' }).click()
  await expect(
    page.locator('.co-tab[aria-current="step"]'),
  ).toHaveAccessibleName(/Nội dung giám sát/)
  await expect(page.getByLabel(/^Chọn tất cả/)).toBeChecked()
  await page
    .getByRole('button', { name: /Tiếp tục: Chi tiết & quyền giám sát/ })
    .click()
  await page.getByRole('button', { name: /Tiếp tục: Thời gian/ }).click()
  await expect(page.getByLabel(/Ngày sớm nhất/)).toHaveValue(earliest!)
  await page
    .getByRole('button', { name: /Tiếp tục: Kết quả bàn giao & xác nhận/ })
    .click()
  await expect(page.getByText('Cao 70 m')).toBeVisible()

  expect(orderPosts).toEqual([])
  expect(pageErrors).toEqual([])
})
