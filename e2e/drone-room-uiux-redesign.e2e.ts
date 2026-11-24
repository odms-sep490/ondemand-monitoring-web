import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

const SCREENSHOT_DIR = path.resolve('docs/screenshots')

async function openDroneRoomAsManager(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-staff-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'usr-mgr-001',
        fullName: 'QA Manager',
        email: 'manager@example.test',
        role: 'MANAGER',
      }),
    )
  })
  await page.goto('/#portal/manager/drones')
  await expect(
    page.getByRole('heading', { level: 1, name: /Phòng drone 3D|3D drone room/ }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.mgr-office-drone-scene-wrap')).toBeVisible()
}

test('Drone 3D Room redesign: layout, zero giant blank space, no stray ellipse, 3D toolbar, tabs, and responsive QA', async ({
  page,
}) => {
  test.setTimeout(90_000)
  const consoleErrors: string[] = []
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  // 1. Desktop 1440x900
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDroneRoomAsManager(page)
  await page.waitForTimeout(700)

  // Verify no stray decorative flight ellipse on drones screen
  await expect(page.locator('.mgr-flight-decor')).toHaveCount(0)

  // Verify single heading (no duplicate "Phòng drone 3D")
  await expect(page.getByText('Phòng drone 3D')).toHaveCount(1)

  // Verify viewport-locked layout (no giant blank scroll area & no horizontal overflow)
  const metrics1440 = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(metrics1440.scrollWidth).toBeLessThanOrEqual(metrics1440.clientWidth + 1)
  expect(metrics1440.scrollHeight).toBeLessThanOrEqual(metrics1440.clientHeight + 120)

  // Verify 3D toolbar controls are visible and clickable
  const toolbar = page.locator('.mgr-drone-scene-toolbar')
  await expect(toolbar).toBeVisible()
  await toolbar.getByRole('button', { name: 'Phóng to' }).click()
  await toolbar.getByRole('button', { name: 'Thu nhỏ' }).click()
  await toolbar.getByRole('button', { name: 'Tập trung drone đang chọn' }).click()
  await toolbar.getByRole('button', { name: 'Hiển thị toàn bộ đội drone' }).click()
  await toolbar.getByRole('button', { name: 'Đặt lại góc nhìn mặc định' }).click()
  await page.waitForTimeout(350)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drone-room-after-1440.png') })

  // 2. Switch to "Danh sách" tab, search & select a drone
  await page.getByRole('tab', { name: /Danh sách/ }).click()
  const deviceRows = page.locator('#drone-panel-list .mgr-drone-room-device')
  const rowCount = await deviceRows.count()
  expect(rowCount).toBeGreaterThan(0)
  if (rowCount > 1) {
    await deviceRows.nth(1).click()
    await expect(deviceRows.nth(1)).toHaveAttribute('aria-pressed', 'true')
  }
  await page.waitForTimeout(350)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drone-room-after-list-tab.png') })

  // 3. Switch to "Gán nhiệm vụ" tab
  await page.locator('#drone-tab-assign').click()
  await expect(page.locator('#drone-panel-assign .mgr-drone-room-assignment')).toBeVisible()
  await page.waitForTimeout(250)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drone-room-after-assign-tab.png') })

  // Switch back to Thông tin tab for viewport checks
  await page.locator('#drone-tab-info').click()

  // 4. 1366x768 laptop viewport
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.waitForTimeout(250)
  const overflow1366 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow1366).toBeLessThanOrEqual(1)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drone-room-after-1366.png') })

  // 5. 1920x1080 wide desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.waitForTimeout(250)
  const overflow1920 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow1920).toBeLessThanOrEqual(1)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drone-room-after-1920.png') })

  // 6. 390x844 mobile viewport
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  const overflow390 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow390).toBeLessThanOrEqual(1)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drone-room-after-390.png') })

  expect(consoleErrors).toEqual([])
})
