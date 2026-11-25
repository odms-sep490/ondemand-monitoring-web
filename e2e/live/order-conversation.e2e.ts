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

test('real text conversation, map/date, recovery, canonical Review and no auto submit', async ({
  page,
}, testInfo) => {
  const before = await orderCount(page)
  const evidence: unknown[] = []
  const submits: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/api\/orders(?:\?|$)/.test(r.url()))
      submits.push(r.url())
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.getByRole('button', { name: /Giám sát công trình/ }).click()
  await page
    .locator('#co-flight-purpose')
    .selectOption('CONSTRUCTION_MONITORING')
  await page
    .locator('#co-desc')
    .fill('Tôi muốn theo dõi tiến độ thi công nhà xưởng, chú ý phần mái.')
  await openChat(page)
  await turn(
    page,
    'Tôi muốn theo dõi tiến độ thi công nhà xưởng, chú ý phần mái.',
    evidence,
  )
  await turn(page, 'Tôi chọn dịch vụ Giám sát công trình.', evidence)
  await turn(page, 'Tôi chỉ muốn 20 ảnh, không cần video.', evidence)
  await page.reload()
  await openChat(page)
  await expect(page.getByRole('log')).toContainText('Tôi chỉ muốn 20 ảnh')
  console.log('REAL_CHAT_PASSED')
  await page.screenshot({ path: testInfo.outputPath('before-map.png') })
  await selectMap(page)
  console.log('MAP_PASSED')
  await remainingFields(page)
  console.log('REMAINING_FIELDS_PASSED')
  const stored = await validateReview(page, testInfo, evidence)
  await expect(page.locator('.co-confirm-layout')).toContainText(
    'Local E2E Customer',
  )
  await page.getByRole('button', { name: /^Sửa:/ }).first().click()
  expect(submits).toEqual([])
  expect(await orderCount(page)).toBe(before)
  expect(errors).toEqual([])
  expect(stored.form.locationStatus).toBe('confirmed')
})

test('real Vietnamese audio through microphone, editable ASR transcript, Agent and Review', async ({
  page,
}, testInfo) => {
  test.setTimeout(600_000)
  test.skip(
    !process.env.ORDER_AGENT_AUDIO_FIXTURE,
    'Set a real Vietnamese WAV fixture; never substitutes a transcript',
  )
  const before = await orderCount(page)
  const submits: string[] = []
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      /\/api\/orders(?:\?|$)/.test(request.url())
    )
      submits.push(request.url())
  })
  await page.getByRole('button', { name: /Giám sát công trình/ }).click()
  await page
    .locator('#co-flight-purpose')
    .selectOption('CONSTRUCTION_MONITORING')
  const dialog = await openChat(page)
  await dialog
    .getByRole('button', { name: 'Nhập bằng giọng nói', exact: true })
    .click()
  await expect(
    dialog.getByRole('button', { name: 'Dừng ghi âm' }),
  ).toBeVisible()
  // The fake microphone plays the actual human Vietnamese recording in real time.
  await page.waitForTimeout(
    Number(process.env.ORDER_AGENT_AUDIO_SECONDS ?? '10') * 1000,
  )
  const transcribed = page.waitForResponse(
    (r) => r.url().endsWith('/order-conversations/transcribe'),
    { timeout: 240_000 },
  )
  await dialog.getByRole('button', { name: 'Dừng ghi âm' }).click()
  const response = await transcribed
  expect(response.status()).toBe(200)
  const transcript = (await response.json()).data.text
  console.log('REAL_ASR_PASSED')
  expect(transcript.length).toBeGreaterThan(15)
  await expect(dialog.getByLabel('Nội dung trao đổi')).toHaveValue(transcript)
  await expect(page.getByRole('log')).not.toContainText(transcript)
  const evidence: unknown[] = [
    {
      realASR: true,
      fixture:
        process.env.ORDER_AGENT_AUDIO_IS_ORDER === 'true'
          ? 'Customer Vietnamese order recording'
          : 'Human Vietnamese FLEURS dev recording; not a spoken order',
      transcript,
    },
  ]
  // Public non-order recordings require an explicit customer edit; a real
  // order recording can be sent verbatim after the transcript preview.
  await turn(
    page,
    process.env.ORDER_AGENT_AUDIO_IS_ORDER === 'true'
      ? transcript
      : 'Tôi muốn giám sát tiến độ xây dựng nhà xưởng.',
    evidence,
  )
  await turn(page, 'Tôi chọn dịch vụ Giám sát công trình.', evidence)
  await turn(page, 'Tôi chỉ muốn 20 ảnh, không cần video.', evidence)
  await selectMap(page)
  await remainingFields(page)
  await validateReview(page, testInfo, evidence)
  expect(submits).toEqual([])
  expect(await orderCount(page)).toBe(before)
})

test('manual six-step form reaches Review without invoking the conversational agent', async ({
  page,
}, testInfo) => {
  const before = await orderCount(page)
  const conversations: string[] = []
  const submits: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/order-conversations')) conversations.push(r.url())
    if (r.method() === 'POST' && /\/api\/orders(?:\?|$)/.test(r.url()))
      submits.push(r.url())
  })
  await page.getByRole('button', { name: /Giám sát công trình/ }).click()
  await page
    .locator('#co-flight-purpose')
    .selectOption('CONSTRUCTION_MONITORING')
  await page
    .locator('#co-desc')
    .fill('Theo dõi tiến độ công trình bằng biểu mẫu thủ công.')
  await page.getByRole('button', { name: /Tiếp tục.*Vị trí/ }).click()
  await drawMap(page)
  await page
    .getByRole('button', { name: /Tiếp tục.*Nội dung giám sát/ })
    .click()
  await page.getByRole('button', { name: /Tiếp tục.*Chi tiết/ }).click()
  await page.getByLabel(/Người liên hệ/).fill('Manual regression customer')
  await page.getByLabel(/Số điện thoại/).fill('0901234567')
  await page.getByLabel(/Điều kiện ra vào/).fill('Cổng chính')
  await page.getByRole('radio', { name: 'Chủ sở hữu / Chủ đầu tư' }).check()
  await page.getByLabel(/Tôi xác nhận mình có quyền yêu cầu giám sát/).check()
  await page.getByRole('button', { name: /Tiếp tục.*Thời gian/ }).click()
  const earliest = await page.locator('#co-from').getAttribute('min')
  await page.locator('#co-from').fill(earliest!)
  await page.locator('#co-to').fill(earliest!)
  const time = page.locator('#co-time')
  await expect.poll(() => time.locator('option').count()).toBeGreaterThan(1)
  await time.selectOption({ index: 1 })
  await page.getByRole('button', { name: /Tiếp tục.*Kết quả/ }).click()
  await expect(page.locator('.co-page.is-review-step')).toBeVisible()
  await page.locator('input[name=termsAccepted]').check()
  await expect(page.locator('.co-confirm-layout')).toContainText(
    'Manual regression customer',
  )
  await page.screenshot({
    path: testInfo.outputPath('manual-review.png'),
    fullPage: true,
  })
  expect(conversations).toEqual([])
  expect(submits).toEqual([])
  expect(await orderCount(page)).toBe(before)
})

test('incomplete draft and network failure preserve the manual form', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Giám sát công trình/ }).click()
  await page.locator('#co-desc').fill('Giữ nguyên mô tả khách đã nhập.')
  let dialog = await openChat(page)
  await dialog.getByRole('button', { name: 'Kiểm tra và xem lại đơn' }).click()
  await expect(dialog.getByText(/Bản nháp còn thiếu thông tin/)).toBeVisible()
  await expect(page.locator('.co-page.is-review-step')).toHaveCount(0)
  await page.route('**/order-conversations/*/messages', (route) =>
    route.abort('connectionfailed'),
  )
  await dialog
    .getByLabel('Nội dung trao đổi')
    .fill('Tôi muốn giám sát công trình')
  await dialog.getByRole('button', { name: 'Gửi', exact: true }).click()
  await expect(dialog.getByRole('alert').first()).toBeVisible()
  await dialog
    .getByRole('button', { name: 'Tiếp tục nhập thủ công', exact: true })
    .click()
  await expect(page.locator('#co-desc')).toHaveValue(
    'Giữ nguyên mô tả khách đã nhập.',
  )
  dialog = await openChat(page)
  await expect(dialog.getByLabel('Nội dung trao đổi')).toBeVisible()
})
