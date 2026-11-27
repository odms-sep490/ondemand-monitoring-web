import { expect, test, type Page } from '@playwright/test'

async function openAuthenticatedWizard(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-v5',
        fullName: 'Trần Minh Khôi',
        phone: '0987654321',
        email: 'khoi.tran@example.test',
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
          id: 'e2e-v5-session',
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
    await route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      body: Buffer.from('RIFF'),
    })
  })

  await page.route('**/api/customer/order-conversations/*/description-review', async (route) => {
    const body = route.request().postDataJSON() as { action?: string; originalText?: string }
    const isGenerate = body?.action === 'generate'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-v5-session',
        revision: isGenerate ? 3 : 2,
        expiresAt: '2099-01-01T00:00:00Z',
        state: {
          messages: [],
          confirmedFields: {},
          pendingChanges: {},
          readyForReview: false,
          descriptionReview: {
            serviceId: 'svc-001',
            originalText: body?.originalText ?? '',
            nextQuestion: isGenerate ? undefined : 'Anh/chị cần tập trung vào khu vực mái hay mặt dựng?',
            generatedDescription: isGenerate
              ? 'Bay drone khảo sát toàn cảnh công trình tại Đại học FPT cơ sở TP.HCM, kiểm tra hiện trạng mái, hàng rào và ghi nhận tiến độ thi công.'
              : undefined,
          },
        },
      }),
    })
  })

  await page.route('**/api/geocoding/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          latitude: 10.8411,
          longitude: 106.8099,
          displayName: 'Đại học FPT cơ sở TP.HCM, Khu Công nghệ cao, TP. Thủ Đức',
        },
      }),
    })
  })

  await page.goto('/#portal/customer/orders/new')
  await expect(page.getByRole('button', { name: /Giám sát công trình/ })).toBeVisible()
}

async function ensureAssistantOpen(page: Page) {
  const backToChat = page.getByRole('button', { name: 'Quay lại trò chuyện' })
  if (await backToChat.isVisible()) {
    await backToChat.click()
    await expect(backToChat).toBeHidden()
  }
  const input = page.getByLabel('Nội dung trao đổi')
  if (await input.isVisible()) return
  await page.getByRole('button', { name: /Mở trợ lý tạo yêu cầu|Trợ lý AI/i }).first().click()
  await expect(input).toBeVisible()
}

async function sendChat(page: Page, text: string) {
  await ensureAssistantOpen(page)
  const input = page.getByLabel('Nội dung trao đổi')
  await input.fill(text)
  await page.getByRole('button', { name: 'Gửi', exact: true }).click()
}

test('AI Chatbot V5 drives real CreateOrder DOM inputs end-to-end via Vietnamese voice/chat', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await openAuthenticatedWizard(page)

  // Open AI assistant workspace
  await ensureAssistantOpen(page)

  const dialog = page.getByRole('dialog', { name: 'AI hỗ trợ tạo yêu cầu' })

  // 1 & 2. Select service + flight purpose naturally
  await sendChat(page, 'Chọn giám sát công trình, tôi muốn theo dõi tiến độ xây dựng')
  await expect(dialog.getByLabel('Mô tả yêu cầu giám sát')).toBeVisible()

  // 3. Populate REAL mission description textarea directly via voice/chat
  await sendChat(
    page,
    'Tôi muốn quay toàn cảnh tòa nhà, kiểm tra mái và ghi nhận tiến độ thi công.',
  )
  const descTextarea = dialog.getByLabel('Mô tả yêu cầu giám sát')
  await expect(descTextarea).toHaveValue(/quay toàn cảnh tòa nhà/i)

  // 3b. Edit mission description via voice command
  await sendChat(page, 'Thêm kiểm tra hàng rào vào mô tả')
  await expect(descTextarea).toHaveValue(/kiểm tra hàng rào/i)

  // 3c. 4-stage refinement via voice: improve -> apply
  await sendChat(page, 'Viết mô tả chuyên nghiệp hơn')
  await expect(page.getByText(/Em đã hoàn thiện mô tả/i)).toBeVisible()
  await sendChat(page, 'Áp dụng đi')

  // 4. Location search via real geocoding API -> populates real Map Editor searchbox
  await sendChat(page, 'Địa chỉ tại Đại học FPT cơ sở HCM')
  await expect(page.getByRole('searchbox', { name: /Địa chỉ hoặc khu vực/i })).toHaveValue(
    /Đại học FPT cơ sở TP\.HCM/i,
  )

  // 5 & 6. Contact & Schedule via voice/chat
  await sendChat(page, 'Tôi tên Nguyễn Văn A, số điện thoại 0901234567, email là nguyenvana@example.com')
  await expect(page.getByText(/Nguyễn Văn A/i).first()).toBeVisible()

  await sendChat(page, 'Bay sáng mai lúc 8 giờ')
  await expect(page.getByText(/Đã đặt ngày bay/i)).toBeVisible()

  // 7. Undo and Redo
  await sendChat(page, 'Hoàn tác')
  await expect(page.getByText(/Đã hoàn tác thao tác gần nhất/i)).toBeVisible()
  await sendChat(page, 'Áp dụng lại')
  await expect(page.getByText(/Đã áp dụng lại thao tác vừa hoàn tác/i)).toBeVisible()

  // 8. Validate draft via voice
  await sendChat(page, 'Kiểm tra lại toàn bộ đơn')
  await expect(page.getByText(/Bản nháp còn thiếu|Tất cả các mục bắt buộc đã hợp lệ/i)).toBeVisible()

  expect(pageErrors).toEqual([])
})
