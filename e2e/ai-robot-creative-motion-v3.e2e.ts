import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

const SCREENSHOT_DIR = path.resolve('docs/screenshots')

async function setupCustomerSession(page: Page) {
  let revision = 0
  const messages: Array<{ role: 'user' | 'assistant'; content: string; requestId?: string }> = []

  await page.route('**/api/customer/order-conversations**', async (route) => {
    const req = route.request()
    const url = req.url()
    if (req.method() === 'POST' && url.endsWith('/speech')) {
      // Return a tiny valid silent WAV header so speech UI doesn't error in offline E2E.
      const wav = Buffer.alloc(64)
      wav.write('RIFF', 0)
      wav.writeUInt32LE(56, 4)
      wav.write('WAVEfmt ', 8)
      wav.writeUInt32LE(16, 16)
      wav.writeUInt16LE(1, 20)
      wav.writeUInt16LE(1, 22)
      wav.writeUInt32LE(16000, 24)
      wav.writeUInt32LE(32000, 28)
      wav.writeUInt16LE(2, 32)
      wav.writeUInt16LE(16, 34)
      wav.write('data', 36)
      wav.writeUInt32LE(20, 40)
      await route.fulfill({ status: 200, contentType: 'audio/wav', body: wav })
      return
    }
    if (req.method() === 'POST' && url.endsWith('/messages')) {
      const body = req.postDataJSON() as { text?: string; requestId?: string }
      revision += 1
      messages.push({ role: 'user', content: body.text ?? '', requestId: body.requestId })
      messages.push({
        role: 'assistant',
        content: 'Đã ghi nhận lựa chọn của anh/chị. Anh/chị tiếp tục chọn mục đích chuyến bay bên dưới nhé.',
      })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2e-v3-session',
          revision,
          state: { messages, fields: {} },
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-v3-session',
        revision,
        state: { messages, fields: {} },
      }),
    })
  })

  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-v3-visual',
        fullName: 'Visual Audit Customer',
        email: 'visual@example.test',
        role: 'CUSTOMER',
      }),
    )
    localStorage.removeItem('odm.customer.createOrderDraft.v2')
  })

  await page.goto('/#portal/customer/orders/new')
  await expect(page.locator('.order-assistant-launcher')).toBeVisible({ timeout: 15_000 })
}

test('Living AI World V3: articulated rig, portal entrance, service reveal, flying chip, and responsive views', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await setupCustomerSession(page)

  // 1. Launcher articulated 2.5D rig + magnetic dock check
  const launcher = page.locator('.order-assistant-launcher')
  await expect(launcher.locator('[data-rig-mode="2.5d-rig"]')).toBeVisible()
  await expect(launcher.locator('[data-rig-part="antenna"]')).toBeVisible()
  await expect(launcher.locator('[data-rig-part="left-arm"]')).toBeVisible()

  // Hover near launcher for pointer personality
  const box = await launcher.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x - 24, box!.y + 20)
  await page.waitForTimeout(180)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ai-v3-launcher-desktop.png') })

  // 2. Click launcher -> Portal Robot Entrance + Living AI World Workspace
  await launcher.click()
  const modal = page.locator('.order-chat-workspace')
  await expect(modal).toBeVisible()
  await expect(modal.locator('.ai-hero-portal-stage [data-rig-mode="2.5d-rig"]')).toBeVisible()
  await expect(modal.locator('.ai-mini-drone')).toBeVisible()
  await expect(modal.locator('.ai-service-microworld').first()).toBeVisible()

  const serviceCards = modal.locator('.ai-svc-card')
  await expect(serviceCards).toHaveCount(4)
  // Verify the 4th card's button is reachable by scrolling inside .order-chat-scroll
  const fourthCardButton = serviceCards.nth(3).getByRole('button')
  await fourthCardButton.scrollIntoViewIfNeeded()
  await expect(fourthCardButton).toBeVisible()
  await modal.locator('.order-chat-scroll').evaluate((el) => {
    el.scrollTop = 0
  })
  await page.waitForTimeout(450)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ai-v3-workspace-desktop.png') })

  // 3. Hover second card -> 3D tilt + robot pointing, then select card -> Draft update
  const secondCard = serviceCards.nth(1)
  const cardBox = await secondCard.boundingBox()
  if (cardBox) {
    await page.mouse.move(cardBox.x + cardBox.width * 0.72, cardBox.y + cardBox.height * 0.35)
    await page.waitForTimeout(150)
  }
  await secondCard.getByRole('button', { name: /Chọn dịch vụ/ }).click()
  await expect(modal.locator('.order-agent-message.is-assistant').first()).toBeVisible()
  await expect(modal.locator('[data-draft-key="service"].is-confirmed')).toBeVisible()
  await expect(modal.locator('.order-chat-context-badge')).toBeVisible()
  await page.waitForTimeout(350)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ai-v3-service-selected.png') })

  // 4. Mobile responsive check (390x844) — zero horizontal overflow
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ai-v3-workspace-mobile.png') })

  // 5. Goodbye close preserves session and returns launcher
  await modal.locator('.ant-modal-close').click()
  await expect(modal).toBeHidden()
  await expect(launcher).toBeVisible()
})

test('Living AI World V3 respects prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await setupCustomerSession(page)

  await page.locator('.order-assistant-launcher').click()
  const modal = page.locator('.order-chat-workspace')
  await expect(modal).toBeVisible()
  // Portal rings are omitted under reduced motion
  await expect(modal.locator('.ai-portal-rings')).toHaveCount(0)
  await expect(modal.locator('.ai-svc-card')).toHaveCount(4)
})
