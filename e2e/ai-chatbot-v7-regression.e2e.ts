import { expect, test, type Page } from '@playwright/test'

async function openWizard(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-v7',
        fullName: 'Nguyễn Minh Quân',
        phone: '0901234567',
        email: 'quan.nguyen@synthetic.test',
        role: 'CUSTOMER',
      }),
    )
    localStorage.removeItem('odm.customer.createOrderDraft.v2')
  })

  await page.route('**/api/customer/order-conversations', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2e-v7-session',
          revision: 1,
          expiresAt: '2099-01-01T00:00:00Z',
          state: {
            messages: [],
            confirmedFields: {},
            pendingChanges: {},
            readyForReview: false,
          },
        }),
      })
      return
    }
    await route.continue()
  })

  await page.route('**/api/customer/order-conversations/*/speech', async (route) => {
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF') })
  })

  await page.goto('/#portal/customer/orders/new')
  await expect(page.getByRole('button', { name: /Giám sát công trình/ })).toBeVisible()
}

async function sendChat(page: Page, text: string) {
  const input = page.getByLabel('Nội dung trao đổi')
  await input.fill(text)
  await page.getByRole('button', { name: 'Gửi', exact: true }).click()
}

test('V7 critical UI regression: "Quay lại chọn dịch vụ." actually renders visible service cards and hides purpose selector', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await openWizard(page)
  await page.getByRole('button', { name: /Mở trợ lý tạo yêu cầu/i }).click()
  await expect(page.getByLabel('Nội dung trao đổi')).toBeVisible()

  const dialog = page.getByRole('dialog', { name: 'AI hỗ trợ tạo yêu cầu' })

  // 1. Select service -> purpose section becomes visible & assistant proactively asks next question
  await sendChat(page, 'Chọn giám sát công trình')
  await expect(dialog.getByLabel('Mục đích chuyến bay')).toBeVisible()
  await expect(dialog.getByText(/Tiếp theo, mục đích chuyến bay/i)).toBeVisible()

  // 2. Say "Quay lại chọn dịch vụ." -> actual service cards MUST become visible & purpose selector hidden!
  await sendChat(page, 'Quay lại chọn dịch vụ.')
  await expect(dialog.getByText('Chọn dịch vụ giám sát')).toBeVisible()
  await expect(dialog.getByLabel('Mục đích chuyến bay')).toBeHidden()
  await expect(dialog.locator('.order-chat-service-grid button')).toHaveCount(4)

  // 3. Switch to another service via voice -> purpose selector reappears, service draft updated
  await sendChat(page, 'Đổi sang giám sát rừng')
  await expect(dialog.getByLabel('Mục đích chuyến bay')).toBeVisible()
  await expect(dialog.getByText(/Đã chọn dịch vụ Giám sát rừng/i)).toBeVisible()

  // 4. Consultation question must NOT mutate state
  await sendChat(page, 'Quay video có được không?')
  await expect(dialog.getByLabel('Mục đích chuyến bay')).toBeVisible()

  expect(pageErrors).toEqual([])
})
