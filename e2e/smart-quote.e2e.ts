import { expect, test } from '@playwright/test'

test('manager can find analysis before the first quote and explicitly save to open it', async ({ page }) => {
  const calls: string[] = []
  const line = { category: 'CHECKLIST', description: 'Chụp ảnh tổng quan công trình', quantity: 1, unitPrice: 2250000, amount: 2250000, orderChecklistItemId: 'i' }
  const quote = { id: 'q', orderId: 'o', version: 1, status: 'DRAFT', packagePrice: 2250000, additionalAmount: 0, discountAmount: 0, adjustmentAmount: 0, totalAmount: 2250000, managerNote: null, items: [] }
  let saved = false
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname
    calls.push(`${route.request().method()} ${path}`)
    let data: unknown = null
    if (path.endsWith('/pricing')) data = {
      orderId: 'o', orderCode: 'ORD-1', customerName: 'Customer', serviceName: 'Giám sát công trình', basePackagePrice: 2250000,
      checklistItems: [{ id: 'i', content: line.description, displayOrder: 1, sourceType: 'SERVICE_TEMPLATE', reviewStatus: 'INCLUDED', guidanceReady: true, managerNote: null, managerQuoteRequired: false, managerQuotedPrice: null, requestedImageCount: 4, requestedVideoCount: 0 }],
      currentQuote: saved ? quote : null, quoteHistory: [],
      systemCalculation: { policyId: 'p', policyVersion: 1, currency: 'VND', systemCalculatedAmount: 2250000, customWork: false, assessmentComplete: true, items: [line] },
    }
    else if (path.endsWith('/quotes/draft')) { saved = true; data = quote }
    else if (path.endsWith('/analysis')) data = { revision: 'r1', version: 1, total: 2250000, warnings: [], items: [{ ...line, id: 'l' }] }
    else if (path.endsWith('/contract')) data = { required: true, id: null, version: 0, quoteId: 'q', quoteVersion: 1, status: 'NOT_ISSUED', document: null, submissions: [] }
    await route.fulfill({ json: { success: true, data }, headers: { 'access-control-allow-origin': '*' } })
  })
  await page.goto('/e2e/harness/smart-quote.html?manager-pricing')
  const summary = page.getByRole('complementary', { name: 'Tóm tắt báo giá' })
  await expect(summary.getByText('Phân tích báo giá')).toBeVisible()
  await page.screenshot({ path: 'test-results/manager-quote-analysis-entry.png', fullPage: true })
  await summary.getByText('Phân tích báo giá').click()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Lưu và phân tích' })).toBeVisible()
  expect(calls.some(call => call.startsWith('PUT '))).toBe(false)
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu và phân tích' }).click()
  await expect(page.getByText('Nguồn: báo giá đã lưu · phiên bản 1')).toBeVisible()
  await expect(page.getByText('Hỏi AI về báo giá')).toBeVisible()
  await page.screenshot({ path: 'test-results/manager-quote-analysis-dialog.png', fullPage: true, animations: 'disabled' })
  expect(calls.filter(call => call === 'PUT /api/manager/orders/o/quotes/draft')).toHaveLength(1)
  expect(calls.some(call => call.endsWith('/approve'))).toBe(false)
  for (const width of [390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  }
})

for (const role of ['customer','manager']) {
  test(`quote assistant ${role} browser UI with API test doubles`, async ({page}) => {
    await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
      const path=new URL(route.request().url()).pathname
      const data=path.endsWith('/compare') ? { revision:'r1', options:[{label:'Hiện tại',total:100000,explanation:'Giữ nguyên'},{label:'Phương án mới',total:null,explanation:'Cần báo giá lại'}] } : path.endsWith('/messages') ? {status:'UNAVAILABLE',revision:'r1'} : {revision:'r1',version:1,total:100000,warnings:[],items:[{id:'line',orderChecklistItemId:'i',description:'Ảnh công trình',quantity:1,unitPrice:100000,amount:100000}]}
      await route.fulfill({json:{success:true,data}})
    })
    await page.goto(`/e2e/harness/smart-quote.html?${role}`)
    await page.getByText(role==='customer'?'Hiểu báo giá của bạn':'Phân tích báo giá').click()
    await expect(page.getByText('Ảnh công trình').first()).toBeVisible()
    await page.getByLabel('Thay đổi phương án').fill('Bỏ video')
    await page.getByRole('button',{name:'So sánh phương án'}).click()
    await expect(page.getByText('Phương án mới: Cần báo giá lại')).toBeVisible()
    await page.getByText('Hỏi AI về báo giá').click()
    await page.getByLabel('Câu hỏi về báo giá').fill('Vì sao?')
    await page.getByRole('button',{name:'Gửi câu hỏi'}).click()
    await expect(page.getByRole('status')).toContainText('Chưa kết nối được AI')
    for (const width of [390,768,1366]) {
      await page.setViewportSize({width,height:900})
      await expect(page.getByRole('button',{name:'So sánh phương án'})).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
    await page.screenshot({path:`test-results/smart-quote-${role}.png`,fullPage:true})
  })
}

