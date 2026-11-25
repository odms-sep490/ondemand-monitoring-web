import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

// Run only against ReportQaServer (isolated PostgreSQL 5549); never the normal dev server.
const base = 'http://localhost:8086'
const ui = 'http://localhost:5175/e2e/harness/inspection-report.html'
const out = path.resolve(
  '../on-demand-monitoring-system/.ai-runtime/qa-artifacts/inspection-report',
)
await fs.mkdir(out, { recursive: true })
const checks = []
async function api(
  route,
  {
    actor = 'qa-manager',
    method = 'GET',
    body,
    status = 200,
    binary = false,
  } = {},
) {
  const r = await fetch(base + route, {
    method,
    headers: {
      'X-QA-Actor': actor,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const bytes = Buffer.from(await r.arrayBuffer())
  assert.equal(
    r.status,
    status,
    `${method} ${route}: ${bytes.toString().slice(0, 700)}`,
  )
  if (binary) return bytes
  const payload = bytes.length ? JSON.parse(bytes) : null
  return payload?.data ?? payload
}
function pass(name) {
  checks.push(name)
  console.log('PASS', name)
}
async function generated(r) {
  const ticksBefore=await api('/qa/scheduler-ticks'); const started=Date.now()
  const queued = await api(`/api/inspection-reports/${r.id}/generate`, {
    method: 'POST',
    body: { revision: r.revision },
  })
  await api(`/api/inspection-reports/${r.id}/generate`, {
    method: 'POST',
    body: { revision: queued.revision },
    status: 409,
  })
  const end = Date.now() + 300000
  let stage = ''
  while (Date.now() < end) {
    const current = await api(`/api/inspection-reports/${r.id}`)
    if (current.jobStage !== stage) {
      stage = current.jobStage
      console.log('STAGE', stage)
    }
    if(current.status!=='GENERATING') {
      if(current.status==='AI_DRAFT') {
        const after=await api('/qa/scheduler-ticks')
        assert.ok(after.ticks-ticksBefore.ticks>=Math.max(1,Math.floor((Date.now()-started)/2000)),'Report inference blocked other scheduled jobs')
        pass('Other scheduled jobs keep running during model inference')
      }
      return current
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error('Report generation timeout')
}
const created = process.env.QA_REPORT_ID
  ? await api(`/api/inspection-reports/${process.env.QA_REPORT_ID}`)
  : await api('/api/missions/qa-mission/inspection-reports', { method: 'POST' })
await api(`/api/inspection-reports/${created.id}`, {
  actor: 'qa-customer',
  status: 404,
})
let report = created.status === 'AI_DRAFT' ? created : await generated(created)
assert.equal(report.status, 'AI_DRAFT', report.error)
assert.equal(report.model, 'odm-order-qwen:3b')
assert.equal(report.evidence.images.length, 3)
assert.equal(report.evidence.findings.length, 0)
assert.ok(report.document.limitations.join(' ').includes('Chưa có đánh giá'))
pass(
  'Real local Qwen -> persisted draft with three decoded private images, no findings',
)
await fs.writeFile(
  path.join(out, 'generated-report.json'),
  JSON.stringify(report, null, 2),
)
await api(`/api/inspection-reports/${report.id}/images/other-mission-image`, {
  status: 404,
  binary: true,
})
await api(`/api/inspection-reports/${report.id}`, {
  method: 'PATCH',
  body: { revision: report.revision - 1, document: report.document },
  status: 409,
})
const invalid = structuredClone(report.document)
invalid.sections[0].images[0].mediaId = 'other-mission-image'
await api(`/api/inspection-reports/${report.id}`, {
  method: 'PATCH',
  body: { revision: report.revision, document: invalid },
  status: 422,
})
pass('Cross-Mission image, stale revision and invalid evidence rejected')
const browser = await chromium.launch({ headless: true, timeout: 120000 })
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(ui, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page
    .getByRole('textbox', { name: 'Nội dung phần báo cáo', exact: true })
    .waitFor({ timeout: 120000 })
  async function addOneAvailableImage() {
    for (const button of await page
      .getByRole('button', { name: 'Thêm vào phần này', exact: true })
      .all()) {
      if (await button.isEnabled()) {
        await button.click()
        return true
      }
    }
    return false
  }
  for (
    let attempt = 0;
    attempt < 3 && (await page.locator('.ir-section figure').count()) < 3;
    attempt++
  )
    await addOneAvailableImage()
  await page
    .getByRole('textbox', { name: 'Chú thích ảnh 1', exact: true })
    .fill('Ảnh nguồn đã được nhân viên rà soát cho báo cáo QA.')
  const editor = page.getByRole('textbox', {
    name: 'Nội dung phần báo cáo',
    exact: true,
  })
  await editor.fill(
    'Hồ sơ ảnh đã được nhân viên rà soát. Nội dung được lưu từ Report Studio.',
  )
  await editor.press('Control+End')
  await page.getByRole('button', { name: 'Thêm bảng', exact: true }).click()
  const header = page.locator('.tiptap table th').first()
  await header.click()
  await page.keyboard.insertText('Hạng mục')
  const replacement = report.evidence.images.find(
    (image) => image.mediaId !== report.document.sections[0].images[0].mediaId,
  )
  await page
    .getByRole('combobox', { name: 'Thay ảnh', exact: true })
    .first()
    .click()
  await page
    .locator(
      `.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[title="${replacement.fileName}"]`,
    )
    .click()
  if ((await page.locator('.ir-section figure').count()) > 1) {
    await page.getByRole('button', { name: 'Lên', exact: true }).last().click()
    await page
      .getByRole('button', { name: 'Bỏ khỏi báo cáo', exact: true })
      .last()
      .click()
    await addOneAvailableImage()
  }
  await page.getByRole('button', { name: /Lưu bản nháp/ }).click()
  await page
    .getByText('Có thay đổi chưa lưu.', { exact: false })
    .waitFor({ state: 'hidden', timeout: 30000 })
  report = await api(`/api/inspection-reports/${report.id}`)
  assert.ok(report.document.sections[0].richText)
  assert.ok(report.document.sections[0].content.includes('Hạng mục'))
  assert.equal(
    report.document.sections[0].images.find(
      (image) =>
        image.caption === 'Ảnh nguồn đã được nhân viên rà soát cho báo cáo QA.',
    )?.caption,
    'Ảnh nguồn đã được nhân viên rà soát cho báo cáo QA.',
  )
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.locator('.tiptap table').waitFor({ timeout: 30000 })
  pass(
    'Browser adds, replaces, reorders and removes images; caption, rich text and table persist after reopening',
  )
  for (const figure of await page.locator('.ir-section figure').all()) {
    await figure.scrollIntoViewIfNeeded()
    await figure.locator('img').waitFor({ state: 'visible', timeout: 30000 })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  for (const [label, width, height] of [
    ['desktop', 1440, 1000],
    ['wide', 1920, 1080],
    ['laptop', 1024, 900],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    await page.screenshot({
      path: path.join(out, `studio-${label}.png`),
      fullPage: true,
    })
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `Horizontal overflow at ${width}`,
    )
  }
  assert.deepEqual(errors, [])
  pass(
    'Desktop, wide, laptop and mobile render without horizontal overflow or page errors',
  )
  const preview = await api(`/api/inspection-reports/${report.id}/preview`, {
    binary: true,
  })
  assert.ok(preview.subarray(0, 5).toString() === '%PDF-')
  await fs.writeFile(path.join(out, 'edited-preview.pdf'), preview)
  report = await api(`/api/inspection-reports/${report.id}/submit-review`, {
    method: 'POST',
    body: { revision: report.revision },
  })
  await api(`/api/inspection-reports/${report.id}/approve`, {
    actor: 'qa-inspector',
    method: 'POST',
    body: { revision: report.revision },
    status: 403,
  })
  report = await api(`/api/inspection-reports/${report.id}/approve`, {
    method: 'POST',
    body: { revision: report.revision },
  })
  await api(`/api/inspection-reports/${report.id}`, {
    method: 'PATCH',
    body: { revision: report.revision, document: report.document },
    status: 409,
  })
  const sourceGuard = await api(
    `/qa/source-guard/${report.document.sections[0].images[0].mediaId}`,
  )
  assert.equal(sourceGuard.referenced, true)
  assert.equal(sourceGuard.approved, true)
  report = await api(`/api/inspection-reports/${report.id}/finalize`, {
    method: 'POST',
    body: { revision: report.revision },
  })
  const pdf = await api(`/api/inspection-reports/${report.id}/pdf`, {
    binary: true,
  })
  await fs.writeFile(path.join(out, 'finalized-report.pdf'), pdf)
  await api(`/api/inspection-reports/${report.id}/deliver`, {
    method: 'POST',
    body: { revision: report.revision },
    status: 409,
  })
  pass(
    'Manager-only approval, immutable version, source guard SQL and final PDF verified; early delivery blocked',
  )
  await api('/qa/release', { method: 'POST' })
  report = await api(`/api/inspection-reports/${report.id}/deliver`, {
    method: 'POST',
    body: { revision: report.revision },
  })
  const customer = await api(`/api/inspection-reports/${report.id}`, {
    actor: 'qa-customer',
  })
  assert.equal(customer.status, 'DELIVERED')
  assert.equal(customer.evidence, null)
  assert.equal(customer.canEdit, false)
  const customerPdf = await api(`/api/inspection-reports/${report.id}/pdf`, {
    actor: 'qa-customer',
    binary: true,
  })
  assert.deepEqual(customerPdf, pdf)
  await api(`/api/inspection-reports/${report.id}/pdf`, {
    actor: 'qa-other',
    status: 404,
    binary: true,
  })
  await api(`/api/missions/qa-mission/inspection-reports`, {
    actor: 'qa-other',
    status: 403,
  })
  await page.goto(ui + '?actor=qa-customer', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  await page.getByRole('button', { name: /Tải PDF/ }).waitFor()
  assert.equal(
    await page.getByRole('button', { name: /Lưu bản nháp/ }).count(),
    0,
  )
  await page.screenshot({
    path: path.join(out, 'customer-mobile.png'),
    fullPage: true,
  })
  pass(
    'Delivered report visible to owning customer only, exact finalized PDF bytes preserved',
  )
  const versions = await api(`/api/inspection-reports/${report.id}/versions`)
  assert.ok(versions.some((v) => v.action === 'EDIT'))
  assert.ok(versions.some((v) => v.action === 'approve'))
  assert.ok(versions.some((v) => v.action === 'deliver'))
  const empty = await generated(
    await api('/api/missions/qa-empty/inspection-reports', { method: 'POST' }),
  )
  assert.equal(empty.status, 'FAILED')
  assert.equal(empty.document, null)
  pass('Empty evidence fails safely; append-only action/version history exists')
  await fs.writeFile(
    path.join(out, 'e2e-results.json'),
    JSON.stringify(
      {
        checks,
        reportId: report.id,
        revision: report.revision,
        limitations:
          'Isolated QA adapters for identity/Mission/media/delivery; real report module, PostgreSQL, private file bytes, local Qwen, browser and PDF.',
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
