import { expect, test, type APIRequestContext } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const roles = ['customer', 'manager', 'pilot', 'inspector'] as const
type Role = (typeof roles)[number]
type Step = {
  name: string
  role: Role
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  path: string
  body?: unknown
  multipart?: {
    fields?: Record<string, string>
    file: { field: string; path: string; name: string; mimeType: string }
  }
  status: number
  capture?: Record<string, string>
  verify?: Record<string, unknown>
}
type Scenario = {
  createOrder: Record<string, unknown>
  steps: Record<(typeof phases)[number], Step[]>
}
const phases = [
  'contractAndDeposit',
  'planning',
  'flightAndMedia',
  'inspection',
  'delivery',
  'customerRework',
  'redelivery',
] as const

function lookup(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, value)
}

test('one Order progresses through delivery and customer rework', async ({
  playwright,
}) => {
  const origin = process.env.ODMS_LIVE_API
  const scenarioPath = process.env.ODMS_LIVE_SCENARIO
  if (!origin || !scenarioPath || process.env.ODMS_LIVE_WRITE !== '1') {
    throw new Error(
      'Set ODMS_LIVE_API, ODMS_LIVE_SCENARIO and ODMS_LIVE_WRITE=1 for a disposable test environment',
    )
  }

  const scenario = JSON.parse(readFileSync(scenarioPath, 'utf8')) as Scenario
  const tokens = new Map(
    roles.map((role) => [
      role,
      process.env['ODMS_TOKEN_' + role.toUpperCase()],
    ]),
  )
  for (const role of roles) {
    expect(tokens.get(role), 'Bearer token for ' + role).toBeTruthy()
    expect(
      Object.values(scenario.steps)
        .flat()
        .some((step) => step.role === role),
      'Scenario uses ' + role,
    ).toBe(true)
  }
  for (const phase of phases) {
    expect(scenario.steps[phase]?.length, 'Steps for ' + phase).toBeGreaterThan(
      0,
    )
    expect(
      scenario.steps[phase].some(
        (step) => Object.keys(step.verify ?? {}).length > 0,
      ),
      'State assertions for ' + phase,
    ).toBe(true)
  }
  const contexts = new Map<Role, APIRequestContext>()
  const variables = new Map<string, unknown>([['runId', randomUUID()]])
  function resolve(name: string): unknown {
    if (!variables.has(name))
      throw new Error('Unknown scenario variable ' + name)
    return variables.get(name)
  }
  function interpolate(value: unknown): unknown {
    if (typeof value === 'string') {
      const reference = /^\{\{(\w+)\}\}$/.exec(value)
      if (reference) return resolve(reference[1])
      return value.replaceAll(/\{\{(\w+)\}\}/g, (_, name: string) =>
        String(resolve(name)),
      )
    }
    if (Array.isArray(value)) return value.map(interpolate)
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, interpolate(item)]),
      )
    }
    return value
  }
  async function request(step: Step) {
    await test.step(step.name, async () => {
      const path = interpolate(step.path)
      if (
        typeof path !== 'string' ||
        !path.startsWith('/api/') ||
        new URL(path, origin).origin !== new URL(origin!).origin
      ) {
        throw new Error(
          'Scenario requests must target the configured API origin',
        )
      }
      const file = step.multipart?.file
      const payloadOptions = file
        ? {
            multipart: {
              ...(interpolate(step.multipart?.fields) as Record<
                string,
                string
              >),
              [file.field]: {
                name: file.name,
                mimeType: file.mimeType,
                buffer: readFileSync(file.path),
              },
            },
          }
        : { data: interpolate(step.body) }
      const response = await contexts.get(step.role)!.fetch(path, {
        method: step.method,
        ...payloadOptions,
        maxRedirects: 0,
      })
      expect(response.status(), step.method + ' ' + path).toBe(step.status)
      if (!step.capture && !step.verify) return
      const payload: unknown = await response.json()
      for (const [field, expected] of Object.entries(step.verify ?? {})) {
        expect(lookup(payload, field), field).toEqual(interpolate(expected))
      }
      for (const [name, field] of Object.entries(step.capture ?? {})) {
        if (name === 'runId' || variables.has(name))
          throw new Error('Cannot overwrite ' + name)
        const captured = lookup(payload, field)
        expect(captured, field).toBeDefined()
        expect(captured, field).not.toBeNull()
        variables.set(name, captured)
      }
    })
  }
  try {
    for (const role of roles) {
      contexts.set(
        role,
        await playwright.request.newContext({
          baseURL: origin,
          extraHTTPHeaders: { Authorization: 'Bearer ' + tokens.get(role) },
        }),
      )
    }
    await request({
      name: 'Customer creates the Order',
      role: 'customer',
      method: 'POST',
      path: '/api/orders',
      body: scenario.createOrder,
      status: 201,
      capture: { orderId: 'data.id' },
    })
    for (const phase of phases) {
      for (const step of scenario.steps[phase]) await request(step)
      await request({
        name: 'Customer verifies the same Order after ' + phase,
        role: 'customer',
        method: 'GET',
        path: '/api/orders/{{orderId}}',
        status: 200,
        verify: { 'data.id': '{{orderId}}' },
      })
    }
  } finally {
    await Promise.all(
      [...contexts.values()].map((context) => context.dispose()),
    )
  }
})
