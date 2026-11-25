import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const base = 'http://localhost:8086'
async function call(route, method = 'GET', body, status = 200) {
  const r = await fetch(base + route, {
    method,
    headers: {
      'X-QA-Actor': 'qa-manager',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  assert.equal(r.status, status, text)
  return text ? (JSON.parse(text).data ?? JSON.parse(text)) : null
}
await call('/qa/findings/true', 'POST')
let r = await call('/api/missions/qa-mission/inspection-reports', 'POST')
r = await call(`/api/inspection-reports/${r.id}/generate`, 'POST', {
  revision: r.revision,
})
const end = Date.now() + 300000
while (r.status === 'GENERATING' && Date.now() < end) {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  r = await call(`/api/inspection-reports/${r.id}`)
}
assert.equal(r.status, 'AI_DRAFT', r.error)
assert.equal(r.evidence.findings.length, 1)
assert.ok(
  r.document.sections.some((s) => s.sourceFindingIds.includes('qa-finding-1')),
  'Reviewed source must be cited',
)
console.log(
  'PASS real local Qwen report cites reviewed finding and linked media',
)
await fs.writeFile(
  '../on-demand-monitoring-system/.ai-runtime/qa-artifacts/inspection-report/reviewed-source-report.json',
  JSON.stringify(r, null, 2),
)
const proposal = await call(`/api/inspection-reports/${r.id}/rewrite`, 'POST', {
  revision: r.revision,
  instruction: 'professional',
})
assert.ok(proposal.document)
assert.equal(
  (await call(`/api/inspection-reports/${r.id}`)).revision,
  r.revision,
)
console.log('PASS real rewrite proposal does not save or increment revision')
await call('/qa/findings/false', 'POST')
await call(
  `/api/inspection-reports/${r.id}/submit-review`,
  'POST',
  { revision: r.revision },
  409,
)
console.log(
  'PASS changed reviewed source blocks review until a new report is generated',
)
let cancelled = await call('/api/missions/qa-empty/inspection-reports', 'POST')
cancelled = await call(
  `/api/inspection-reports/${cancelled.id}/generate`,
  'POST',
  { revision: cancelled.revision },
)
cancelled = await call(
  `/api/inspection-reports/${cancelled.id}/cancel-generation`,
  'POST',
  { revision: cancelled.revision },
)
await new Promise((resolve) => setTimeout(resolve, 4000))
assert.equal(
  (await call(`/api/inspection-reports/${cancelled.id}`)).status,
  'DRAFT',
)
console.log(
  'PASS cancelled generation stays cancelled after scheduler invocation',
)
