import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const apiOrigin = process.env.ORDER_AGENT_API_URL ?? 'http://localhost:8080'
const webOrigin = process.env.ORDER_AGENT_WEB_URL ?? 'http://localhost:5173'
test.beforeEach(async ({ page }) => {
  if (
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(apiOrigin) ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(webOrigin)
  )
    throw new Error('Local test only')
  if (
    !process.env.ORDER_AGENT_TEST_EMAIL ||
    !process.env.ORDER_AGENT_TEST_PASSWORD
  )
    throw new Error('Set test customer credentials in environment')
  await page.goto('/#auth/login')
  await page.locator('#email').fill(process.env.ORDER_AGENT_TEST_EMAIL)
  await page.locator('#password').fill(process.env.ORDER_AGENT_TEST_PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/portal/, { timeout: 60000 })
  await page.goto('/#portal/customer/orders/new')
  await expect(
    page.getByRole('button', { name: 'Tư vấn tạo đơn bằng AI', exact: true }),
  ).toBeVisible()
})
async function openChat(page: Page) {
  await page
    .getByRole('button', { name: 'Tư vấn tạo đơn bằng AI', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Tư vấn tạo đơn bằng AI' })
  await expect(
    dialog.getByRole('button', { name: 'Gửi', exact: true }),
  ).toBeVisible()
  await expect(dialog.getByRole('status')).toHaveCount(0)
  return dialog
}
async function turn(page: Page, text: string, evidence: unknown[]) {
  const dialog = page.getByRole('dialog', { name: 'Tư vấn tạo đơn bằng AI' })
  await dialog.getByLabel('Nội dung trao đổi').fill(text)
  const received = page.waitForResponse(
    (r) =>
      r.url().includes('/order-conversations/') &&
      r.url().endsWith('/messages') &&
      r.request().method() === 'POST',
    { timeout: 110000 },
  )
  await dialog.getByRole('button', { name: 'Gửi', exact: true }).click()
  const response = await received
  const envelope = await response.json()
  expect(response.status(), JSON.stringify(envelope)).toBe(200)
  evidence.push({ input: text, ...envelope.data })
  await expect(dialog.getByRole('status')).toHaveCount(0)
  if (Object.keys(envelope.data.state.pendingChanges).length) {
    const confirmed = page.waitForResponse(
      (r) => r.url().endsWith('/confirm') && r.request().method() === 'POST',
    )
    await dialog.getByRole('button', { name: 'Xác nhận lựa chọn này' }).click()
    expect((await confirmed).status()).toBe(200)
    await expect(
      dialog.getByRole('button', { name: 'Xác nhận lựa chọn này' }),
    ).toHaveCount(0)
  }
  return envelope.data
}
async function selectMap(page: Page) {
  await page
    .getByRole('button', { name: 'Chọn khu vực trên bản đồ', exact: true })
    .click()
  await drawMap(page)
}
async function drawMap(page: Page) {
  await expect(
    page.getByRole('region', {
      name: 'Bản đồ chọn vị trí và khu vực giám sát',
    }),
  ).toBeVisible()
  await page.getByText('Tọa độ nâng cao', { exact: true }).click()
  await page
    .getByRole('button', { name: 'Xác nhận tọa độ', exact: true })
    .click()
  await page.getByRole('button', { name: 'Tự vẽ vùng', exact: true }).click()
  const box = await page.locator('.co-area-map').boundingBox()
  expect(box).toBeTruthy()
  for (const [x, y] of [
    [0.4, 0.4],
    [0.6, 0.4],
    [0.6, 0.6],
    [0.4, 0.6],
  ])
    await page.mouse.click(box!.x + box!.width * x, box!.y + box!.height * y)
  await page.locator('.leaflet-marker-icon.co-area-handle').first().click()
  await expect(page.locator('.co-area-metric-grid dd').last()).toHaveText('4')
}
async function remainingFields(page: Page) {
  let dialog = await openChat(page)
  await dialog.getByRole('button', { name: 'Liên hệ & quyền giám sát' }).click()
  await page.getByLabel(/Người liên hệ/).fill('Local E2E Customer')
  await page.getByLabel(/Số điện thoại/).fill('0901234567')
  await page
    .getByLabel(/Điều kiện ra vào/)
    .fill('Cổng chính, liên hệ bảo vệ khi đến.')
  await page.getByRole('radio', { name: 'Chủ sở hữu / Chủ đầu tư' }).check()
  await page.getByLabel(/Tôi xác nhận mình có quyền yêu cầu giám sát/).check()
  dialog = await openChat(page)
  await dialog
    .getByRole('button', { name: 'Xác nhận lịch', exact: true })
    .click()
  const from = page.locator('#co-from')
  const earliest = await from.getAttribute('min')
  expect(earliest).toBeTruthy()
  await from.fill(earliest!)
  await page.locator('#co-to').fill(earliest!)
  const time = page.locator('#co-time')
  await expect.poll(() => time.locator('option').count()).toBeGreaterThan(1)
  const value = await time
    .locator('option')
    .evaluateAll((options) =>
      options.map((o) => (o as HTMLOptionElement).value).find(Boolean),
    )
  await time.selectOption(value!)
  dialog = await openChat(page)
  await dialog
    .getByText('Điều khoản trước khi xem lại đơn', { exact: true })
    .click()
  await dialog.locator('input[name=termsAccepted]').check()
}
async function orderCount(page: Page) {
  // The UI already authenticated normally. A separate legitimate test login
  // supplies a read-only API context without touching browser auth storage.
  const auth = await page.request.post(apiOrigin + '/api/auth/login', {
    data: {
      email: process.env.ORDER_AGENT_TEST_EMAIL,
      password: process.env.ORDER_AGENT_TEST_PASSWORD,
    },
  })
  expect(auth.status()).toBe(200)
  const token = (await auth.json()).data.accessToken
  const response = await page.request.get(apiOrigin + '/api/orders/mine', {
    headers: { Authorization: 'Bearer ' + token },
  })
  expect(response.status()).toBe(200)
  return (await response.json()).data.length
}
async function validateReview(
  page: Page,
  testInfo: TestInfo,
  evidence: unknown[],
) {
  const dialog = page.getByRole('dialog', { name: 'Tư vấn tạo đơn bằng AI' })
  const validation = page.waitForResponse(
    (r) => r.url().endsWith('/validate') && r.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Kiểm tra và xem lại đơn' }).click()
  const response = await validation
  const result = await response.json()
  evidence.push({ validation: result })
  expect(response.status(), JSON.stringify(result)).toBe(200)
  expect(result.data.state.readyForReview, JSON.stringify(result)).toBe(true)
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.co-page.is-review-step')).toBeVisible()
  const canonical = result.data.state.canonicalDraft
  // Inspect actual persisted production FormState; no data is injected into it.
  const stored = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem('odm.customer.createOrderDraft.v2') ?? '{}',
    ),
  )
  expect(stored.step).toBe(6)
  expect(stored.form.serviceId).toBe(canonical.serviceId)
  expect(stored.form.coverageArea).toEqual(canonical.coverageArea)
  expect(stored.form.agentChecklistItems).toEqual(canonical.checklistItems)
  expect(stored.form.preferredDateFrom).toBe(canonical.preferredDateFrom)
  expect(stored.form.preferredTimeId).toBe(canonical.preferredTimeId)
  expect(stored.form.description).toBe(canonical.description ?? '')
  expect(stored.form.siteContactPhone).toBe(canonical.siteContactPhone)
  expect(
    canonical.checklistItems.reduce(
      (sum: number, item: { requestedImageCount: number }) =>
        sum + item.requestedImageCount,
      0,
    ),
  ).toBe(20)
  expect(
    canonical.checklistItems.reduce(
      (sum: number, item: { requestedVideoCount: number }) =>
        sum + item.requestedVideoCount,
      0,
    ),
  ).toBe(0)
  await page.screenshot({
    path: testInfo.outputPath('review.png'),
    fullPage: true,
  })
  await writeFile(
    testInfo.outputPath('evidence.json'),
    JSON.stringify({ evidence, stored }, null, 2),
  )
  return stored
}

async function prepareReview(
  page: Page,
  testInfo: TestInfo,
  fullJourney = false,
) {
  const evidence: unknown[] = []
  await page.getByRole('button', { name: /Giám sát công trình/ }).click()
  await page
    .locator('#co-flight-purpose')
    .selectOption('CONSTRUCTION_MONITORING')
  await page
    .locator('#co-desc')
    .fill('Theo dõi tiến độ thi công nhà xưởng, chú ý phần mái.')
  await openChat(page)
  if (fullJourney)
    await turn(
      page,
      'Tôi cần drone giúp tôi nhưng chưa biết cần làm gì.',
      evidence,
    )
  await turn(page, 'Tôi chọn dịch vụ Giám sát công trình.', evidence)
  if (fullJourney) {
    const media = await turn(
      page,
      'Tôi cần 20 ảnh và 1 video dài 5 phút.',
      evidence,
    )
    expect(media.state.pendingChanges.description).toMatch(/5\s*phút/)
    await turn(page, 'Không cần video nữa, chỉ giữ 20 ảnh.', evidence)
    await turn(page, 'Tôi đổi sang dịch vụ Kiểm tra nhà xưởng.', evidence)
  }
  await turn(page, 'Tôi chỉ muốn 20 ảnh, không cần video.', evidence)
  await selectMap(page)
  await remainingFields(page)
  return validateReview(page, testInfo, evidence)
}

test('H01 full draft to canonical Review', async ({ page }, info) => {
  const before = await orderCount(page)
  const form = await prepareReview(page, info, true)
  expect(form.form.agentChecklistItems.length).toBeGreaterThan(0)
  await expect(page.locator('.co-confirm-layout')).toContainText(
    'Local E2E Customer',
  )
  expect(await orderCount(page)).toBe(before)
})
test('H02 reload retains customer conversation', async ({ page }) => {
  await openChat(page)
  await turn(page, 'Tôi chọn dịch vụ Giám sát công trình.', [])
  await page.reload()
  await openChat(page)
  await expect(page.getByRole('log')).toContainText(
    'Tôi chọn dịch vụ Giám sát công trình.',
  )
})
test('H03 existing map picker persists confirmed polygon', async ({ page }) => {
  await openChat(page)
  await selectMap(page)
  const saved = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem('odm.customer.createOrderDraft.v2') ?? '{}',
    ),
  )
  expect(saved.form.locationStatus).toBe('confirmed')
  expect(saved.form.coverageArea.type).toBe('Polygon')
  expect(saved.form.coverageArea.coordinates[0]).toHaveLength(5)
})
test('H04 existing schedule picker saves customer choice', async ({ page }) => {
  await openChat(page)
  await page.getByRole('button', { name: 'Xác nhận lịch', exact: true }).click()
  const from = page.locator('#co-from')
  const earliest = await from.getAttribute('min')
  await from.fill(earliest!)
  await page.locator('#co-to').fill(earliest!)
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem('odm.customer.createOrderDraft.v2') ?? '{}',
          ).form?.preferredDateFrom,
      ),
    )
    .toBe(earliest)
})
test('H05 manual continuation preserves customer text', async ({ page }) => {
  const text = 'Khách tự nhập: kiểm tra phần mái phía Bắc.'
  await page.locator('#co-desc').fill(text)
  const dialog = await openChat(page)
  await dialog
    .getByRole('button', { name: 'Tiếp tục nhập thủ công', exact: true })
    .click()
  await expect(page.locator('#co-desc')).toHaveValue(text)
})
test('H06 Review editing uses existing form', async ({ page }, info) => {
  await prepareReview(page, info)
  await page.getByRole('button', { name: /^Sửa:/ }).first().click()
  await expect(page.locator('.co-page.is-review-step')).toHaveCount(0)
  await expect(page.locator('#co-desc')).not.toHaveValue('')
})
test('H07 AI never submits an order', async ({ page }, info) => {
  const before = await orderCount(page)
  const submits: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/api\/orders(?:\?|$)/.test(r.url()))
      submits.push(r.url())
  })
  await prepareReview(page, info)
  expect(submits).toEqual([])
  expect(await orderCount(page)).toBe(before)
})
test('H08 proposal requires explicit customer confirmation', async ({
  page,
}) => {
  const manual = 'Nội dung khách giữ nguyên khi phiên đổi revision.'
  await page.locator('#co-desc').fill(manual)
  const dialog = await openChat(page)
  await dialog
    .getByLabel('Nội dung trao đổi')
    .fill('Tôi chọn dịch vụ Giám sát rừng.')
  const received = page.waitForResponse(
    (r) => r.url().endsWith('/messages') && r.request().method() === 'POST',
    { timeout: 110000 },
  )
  await dialog.getByRole('button', { name: 'Gửi', exact: true }).click()
  const response = await received
  expect(response.status()).toBe(200)
  const result = (await response.json()).data
  expect(result.state.pendingChanges.serviceId).toBeTruthy()
  expect(result.state.confirmedFields.serviceId).toBeUndefined()
  await expect(
    dialog.getByRole('button', { name: 'Xác nhận lựa chọn này' }),
  ).toBeVisible()
  // A second legitimate customer tab confirms first. The stale UI must load
  // the current revision without auto-replaying or replacing manual form data.
  const login = await page.request.post(apiOrigin + '/api/auth/login', {
    data: {
      email: process.env.ORDER_AGENT_TEST_EMAIL,
      password: process.env.ORDER_AGENT_TEST_PASSWORD,
    },
  })
  expect(login.status()).toBe(200)
  const token = (await login.json()).data.accessToken
  const otherTab = await page.request.post(
    apiOrigin + '/api/customer/order-conversations/' + result.id + '/confirm',
    {
      headers: { Authorization: 'Bearer ' + token },
      data: { revision: result.revision },
    },
  )
  expect(otherTab.status()).toBe(200)
  const conflict = page.waitForResponse(
    (r) => r.url().endsWith('/confirm') && r.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Xác nhận lựa chọn này' }).click()
  expect((await conflict).status()).toBe(409)
  await expect(dialog.getByRole('alert')).toContainText(
    'Đã tải hội thoại mới nhất',
  )
  await dialog
    .getByRole('button', { name: 'Tiếp tục nhập thủ công', exact: true })
    .click()
  await expect(page.locator('#co-desc')).toHaveValue(manual)
})
test('H09 incomplete draft cannot open Review', async ({ page }) => {
  const dialog = await openChat(page)
  await dialog.getByRole('button', { name: 'Kiểm tra và xem lại đơn' }).click()
  await expect(page.locator('.co-page.is-review-step')).toHaveCount(0)
  await expect(dialog).toBeVisible()
})
test('H10 network failure preserves manual customer description', async ({
  page,
}) => {
  const text = 'Thông tin khách cần giữ khi mất kết nối.'
  await page.locator('#co-desc').fill(text)
  const dialog = await openChat(page)
  // Explicit transport-failure injection only; no successful Agent response is mocked.
  await page.route('**/order-conversations/*/messages', (route) =>
    route.abort('failed'),
  )
  await dialog.getByLabel('Nội dung trao đổi').fill('Tôi muốn kiểm tra mái.')
  await dialog.getByRole('button', { name: 'Gửi', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog
    .getByRole('button', { name: 'Tiếp tục nhập thủ công', exact: true })
    .click()
  await expect(page.locator('#co-desc')).toHaveValue(text)
})
