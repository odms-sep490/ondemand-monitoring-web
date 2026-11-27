import { expect, test, type Page } from '@playwright/test'

async function openWizardWith3Of7Completed(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-v9',
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
          id: 'e2e-v9-session',
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

test('V9 screenshot regression: at 3/7 state, "Ý coi là. Quay video như thế nào?" explains video recording without recommending service or showing flight purpose editor', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await openWizardWith3Of7Completed(page)
  await page.getByRole('button', { name: /Mở trợ lý tạo yêu cầu/i }).click()
  const dialog = page.getByRole('dialog', { name: 'AI hỗ trợ tạo yêu cầu' })
  await expect(dialog.getByLabel('Nội dung trao đổi')).toBeVisible()

  // Complete 3/7 sections: service + flight purpose + mission description
  await sendChat(page, 'Chọn giám sát công trình, theo dõi tiến độ thi công')
  await sendChat(page, 'Tôi muốn quay toàn cảnh tòa nhà, kiểm tra mái và ghi nhận tiến độ thi công.')
  await expect(dialog.getByText('3/7 mục đã xong')).toBeVisible()

  // Critical V9 bug reproduction: "Ý coi là. Quay video như thế nào?"
  await sendChat(page, 'Ý coi là. Quay video như thế nào?')
  await expect(dialog.getByText(/quy trình quay video bằng drone/i)).toBeVisible()
  await expect(dialog.getByText(/Bạn có quan tâm đến dịch vụ này không/i)).toHaveCount(0)
  await expect(dialog.getByLabel('Mục đích chuyến bay')).toBeHidden()
  await expect(dialog.getByText('3/7 mục đã xong')).toBeVisible()

  // Short follow-up without repeating subject ("Bao lâu?")
  await sendChat(page, 'Bao lâu?')
  await expect(dialog.getByText(/Thời lượng video không cố định/i)).toBeVisible()
  await expect(dialog.getByText('3/7 mục đã xong')).toBeVisible()

  // Consultation-to-action transition ("Vậy thêm video luôn")
  await sendChat(page, 'Vậy thêm video luôn')
  await expect(dialog.getByText(/Đã bật tùy chọn quay video/i)).toBeVisible()

  expect(pageErrors).toEqual([])
})
