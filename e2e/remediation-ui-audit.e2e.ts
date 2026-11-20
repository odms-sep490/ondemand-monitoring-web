import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

async function collectOverflowReport(page: Page, label: string) {
  return page.evaluate((sectionLabel) => {
    const viewportWidth = document.documentElement.clientWidth
    const docScrollWidth = document.documentElement.scrollWidth
    const bodyScrollWidth = document.body.scrollWidth
    const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => {
        if (el.closest('[hidden]')) return false
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden')
          return false
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.right > viewportWidth + 1
      })
      .slice(0, 8)
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          tag: el.tagName,
          className: typeof el.className === 'string' ? el.className : '',
          text: (el.innerText || '').slice(0, 40).replace(/\s+/g, ' '),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        }
      })
    return {
      sectionLabel,
      viewportWidth,
      docScrollWidth,
      bodyScrollWidth,
      offenders,
    }
  }, label)
}

test('Inspection & Rework screens pass desktop/narrow layout and VI/EN checks in real Chromium', async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/e2e/harness/remediation-audit.html')

  // =========================================================================
  // 1. SCREEN 1: Inspector Correction Panel
  // =========================================================================
  const nextStepAlert = page.locator('.inspection-corrections__next-step')
  await expect(nextStepAlert).toBeVisible()
  await expect(nextStepAlert).toContainText(
    'Cần hoàn tất các hạng mục còn lại của nhiệm vụ gốc',
  )

  const strategyRadios = page.locator(
    '.inspection-corrections__strategy .ant-radio-wrapper',
  )
  await expect(strategyRadios).toHaveCount(2)
  await expect(strategyRadios.first()).toHaveClass(/ant-radio-wrapper-checked/)
  await expect(strategyRadios.first()).toContainText(
    'Điều chỉnh hồ sơ bằng dữ liệu đã có',
  )
  await expect(strategyRadios.nth(1)).toContainText(
    'Cần thực hiện chuyến bay bổ sung',
  )

  await page.screenshot({
    path: testInfo.outputPath('01-panel-desktop-vi.png'),
    fullPage: true,
  })
  const panelDesktopViOverflow = await collectOverflowReport(
    page,
    'panel-desktop-vi',
  )

  // Switch Screen 1 to EN
  await page.getByTestId('lang-toggle-en').click()
  await expect(nextStepAlert).toContainText(
    'Complete the remaining original mission checklist items',
  )
  await expect(strategyRadios.first()).toContainText(
    'Adjust the dossier using existing data',
  )
  await expect(strategyRadios.nth(1)).toContainText(
    'Supplemental flight required',
  )
  await page.screenshot({
    path: testInfo.outputPath('01-panel-desktop-en.png'),
    fullPage: true,
  })

  // Switch Screen 1 to Narrow (390x844) in VI
  await page.getByTestId('lang-toggle-vi').click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('01-panel-narrow-vi.png'),
    fullPage: true,
  })
  const panelNarrowViOverflow = await collectOverflowReport(
    page,
    'panel-narrow-vi',
  )

  // =========================================================================
  // 1b. SCREEN 1b: Checklist FIRST, Correction Composer BELOW
  // =========================================================================
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByText('1b. Checklist & Composer').click()
  const checklistCard = page.locator('.monitoring-checklist')
  const composingCard = page.locator('.inspection-corrections.is-composing')
  await expect(checklistCard).toBeVisible()
  await expect(composingCard).toBeVisible()
  const checklistBox = await checklistCard.boundingBox()
  const composingBox = await composingCard.boundingBox()
  expect(checklistBox).not.toBeNull()
  expect(composingBox).not.toBeNull()
  expect(checklistBox!.y).toBeLessThan(composingBox!.y)
  await expect(composingCard.getByText('Ảnh #1', { exact: true })).toBeVisible()
  await expect(composingCard.getByText('1 mục không đạt · Điều chỉnh hồ sơ bằng dữ liệu đã có')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('redesign-composing-desktop.png'),
    fullPage: true,
  })
  const composingDesktopOverflow = await collectOverflowReport(
    page,
    'composing-desktop-vi',
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('redesign-composing-narrow.png'),
    fullPage: true,
  })
  const composingNarrowOverflow = await collectOverflowReport(
    page,
    'composing-narrow-vi',
  )

  // =========================================================================
  // 2. SCREEN 2: MissionCorrectionPage (Staff & Inspector Workspace)
  // =========================================================================
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByText('2. Correction Workspace').click()

  // Flight Crew back link -> #portal/staff/missions/mission-workspace-audit
  const backLink = page.locator('.mcw-header a').first()
  await expect(backLink).toBeVisible()
  await expect(backLink).toContainText('Chi tiết nhiệm vụ')
  await expect(backLink).toHaveAttribute(
    'href',
    '#portal/staff/missions/mission-workspace-audit',
  )
  await expect(page.locator('.mcw-context')).toBeVisible()
  await expect(page.locator('.mcw-steps')).toBeVisible()

  await page.screenshot({
    path: testInfo.outputPath('02-workspace-desktop-vi.png'),
    fullPage: true,
  })
  const workspaceDesktopViOverflow = await collectOverflowReport(
    page,
    'workspace-desktop-vi',
  )

  // Toggle Role to Inspector -> back link points to #portal/staff/inspection/mission-workspace-audit
  await page.getByRole('button', { name: 'Role: Flight Crew' }).click()
  await expect(backLink).toContainText('Nghiệm thu nhiệm vụ')
  await expect(backLink).toHaveAttribute(
    'href',
    '#portal/staff/inspection/mission-workspace-audit',
  )

  // Toggle EN on Workspace
  await page.getByTestId('lang-toggle-en').click()
  await expect(backLink).toContainText('Mission inspection')
  await page.getByRole('button', { name: 'Role: Inspector' }).click()
  await expect(backLink).toContainText('Mission details')
  await page.screenshot({
    path: testInfo.outputPath('02-workspace-desktop-en.png'),
    fullPage: true,
  })

  // Switch Screen 2 to Narrow (390x844) in VI
  await page.getByTestId('lang-toggle-vi').click()
  await expect(page.locator('.mcw-context')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('02-workspace-narrow-vi.png'),
    fullPage: true,
  })
  const workspaceNarrowViOverflow = await collectOverflowReport(
    page,
    'workspace-narrow-vi',
  )

  // =========================================================================
  // 3. SCREEN 3: ManagerDeliveryPanel & MissionDetailHeader
  // =========================================================================
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByText('3. Manager Rework & Header').click()

  // MissionDetailHeader source mission link
  const sourceMissionBtn = page.getByRole('link', {
    name: 'Xem nhiệm vụ gốc',
  })
  await expect(sourceMissionBtn).toBeVisible()
  await expect(sourceMissionBtn).toHaveAttribute(
    'href',
    '#portal/manager/missions/mission-root-01/detail',
  )

  // Revision case (Step 1) should render above checklist groups (Step 2) when active
  const revisionSectionBox = await page
    .locator('.delivery-revision-case')
    .boundingBox()
  const checklistGroupBox = await page
    .locator('.delivery-checklist-groups')
    .boundingBox()
  expect(revisionSectionBox).not.toBeNull()
  expect(checklistGroupBox).not.toBeNull()
  expect(revisionSectionBox!.y).toBeLessThan(checklistGroupBox!.y)

  // Expand the revision case item first (AntD Collapse inside .delivery-revision-case)
  const revisionHeader = page
    .locator('.delivery-revision-case .delivery-review-collapse .ant-collapse-header')
    .first()
  await expect(revisionHeader).toBeVisible()
  await revisionHeader.click()

  // ManagerDeliveryPanel reserve media jump button
  const jumpBtn = page.getByRole('button', {
    name: 'Chọn media dự phòng cho hạng mục này',
  })
  await expect(jumpBtn).toBeVisible()
  await jumpBtn.click()

  const editor = page.locator('#delivery-checklist-editor-oci-1')
  await expect(editor).toBeVisible()
  await expect(page.getByText('Bổ sung media dự phòng').first()).toBeVisible()

  await page.screenshot({
    path: testInfo.outputPath('03-delivery-desktop-vi.png'),
    fullPage: true,
  })
  const deliveryDesktopViOverflow = await collectOverflowReport(
    page,
    'delivery-desktop-vi',
  )

  // Switch Screen 3 to EN
  await page.getByTestId('lang-toggle-en').click()
  await expect(
    page.getByRole('link', { name: 'View original mission' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Select reserve media for this item' }),
  ).toBeVisible()
  await expect(page.getByText('Add reserve media').first()).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('03-delivery-desktop-en.png'),
    fullPage: true,
  })

  // Switch Screen 3 to Narrow (390x844) in VI
  await page.getByTestId('lang-toggle-vi').click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('03-delivery-narrow-vi.png'),
    fullPage: true,
  })
  const deliveryNarrowViOverflow = await collectOverflowReport(
    page,
    'delivery-narrow-vi',
  )

  // =========================================================================
  // 4. SCREEN 4: Unscheduled Mission Detail (OMSS)
  // =========================================================================
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByText('4. Unscheduled Mission').click()
  await expect(page.getByText('Chưa đặt lịch', { exact: true })).toBeVisible()
  await expect(page.getByText('Invalid Date')).toHaveCount(0)
  await page.screenshot({
    path: testInfo.outputPath('04-omss-desktop-vi.png'),
    fullPage: true,
  })

  await page.getByTestId('lang-toggle-en').click()
  await expect(page.getByText('Unscheduled', { exact: true })).toBeVisible()
  await expect(page.getByText('Invalid Date')).toHaveCount(0)
  await page.screenshot({
    path: testInfo.outputPath('04-omss-desktop-en.png'),
    fullPage: true,
  })

  await page.getByTestId('lang-toggle-vi').click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('04-omss-narrow-vi.png'),
    fullPage: true,
  })
  const omssNarrowViOverflow = await collectOverflowReport(
    page,
    'omss-narrow-vi',
  )

  // =========================================================================
  // 5. Legacy #operator route redirect
  // =========================================================================
  await page.goto('/#operator')
  await expect.poll(() => new URL(page.url()).hash).not.toBe('#operator')

  const reports = [
    panelDesktopViOverflow,
    panelNarrowViOverflow,
    composingDesktopOverflow,
    composingNarrowOverflow,
    workspaceDesktopViOverflow,
    workspaceNarrowViOverflow,
    deliveryDesktopViOverflow,
    deliveryNarrowViOverflow,
    omssNarrowViOverflow,
  ]
  fs.writeFileSync(
    testInfo.outputPath('overflow-report.json'),
    JSON.stringify({ pageErrors, reports }, null, 2),
  )

  for (const report of reports) {
    expect(
      report.docScrollWidth,
      `${report.sectionLabel} horizontal overflow: ${JSON.stringify(report.offenders)}`,
    ).toBeLessThanOrEqual(report.viewportWidth)
  }
  expect(pageErrors).toEqual([])
})
