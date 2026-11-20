import { expect, test } from '@playwright/test'

const accounts = {
  customer: 'seed.customer@odms.local',
  manager: 'seed.manager@odms.local',
  pilot: 'seed.drone.operator@odms.local',
  inspector: 'seed.drone.operator.2@odms.local',
}

for (const [role, email] of Object.entries(accounts)) {
  test('seed account can sign in as ' + role, async ({ playwright }) => {
    const baseURL = process.env.ODMS_LIVE_API
    const password = process.env.ODMS_SEED_PASSWORD
    if (!baseURL || !password)
      throw new Error('Set ODMS_LIVE_API and ODMS_SEED_PASSWORD')
    const api = await playwright.request.newContext({ baseURL })
    try {
      const response = await api.post('/api/auth/login', {
        data: { email, password },
      })
      const payload = await response.json()
      expect(response.status(), payload.code).toBe(200)
      expect(
        Boolean(payload.data?.accessToken),
        'Login returns an access token',
      ).toBe(true)
    } finally {
      await api.dispose()
    }
  })
}

test('Customer creates an Order and Manager reads the same Order', async ({
  playwright,
}) => {
  const baseURL = process.env.ODMS_LIVE_API
  const password = process.env.ODMS_SEED_PASSWORD
  if (!baseURL || !password || process.env.ODMS_LIVE_WRITE !== '1') {
    throw new Error('Set the live API, seed password and ODMS_LIVE_WRITE=1')
  }
  const contexts = []
  try {
    for (const email of [accounts.customer, accounts.manager]) {
      const auth = await playwright.request.newContext({ baseURL })
      try {
        const response = await auth.post('/api/auth/login', {
          data: { email, password },
        })
        expect(response.status()).toBe(200)
        const token = (await response.json()).data.accessToken
        contexts.push(
          await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { Authorization: 'Bearer ' + token },
          }),
        )
      } finally {
        await auth.dispose()
      }
    }
    const [customer, manager] = contexts
    const deliverables = await customer.get('/api/service-deliverables')
    expect(deliverables.status()).toBe(200)
    const link = (await deliverables.json()).data.find(
      (item: { serviceName: string }) =>
        item.serviceName === 'Giám sát công trình',
    )
    expect(Boolean(link), 'Construction monitoring catalog fixture').toBe(true)
    const times = await customer.get('/api/preferred-times')
    expect(times.status()).toBe(200)
    const time = (await times.json()).data.find(
      (item: { code: string }) => item.code === 'MORNING',
    )
    expect(Boolean(time), 'Morning time slot').toBe(true)
    const date = new Date(Date.now() + 14 * 86400_000)
      .toISOString()
      .slice(0, 10)
    const response = await customer.post('/api/orders', {
      data: {
        title: 'E2E seed order ' + Date.now(),
        serviceId: link.serviceId,
        preferredTimeId: time.id,
        preferredDateFrom: date,
        preferredDateTo: date,
        monitoringRelationship: 'OWNER',
        monitoringAuthorizationConfirmed: true,
        termsAccepted: true,
        dataRetentionDays: 90,
        longitude: 106.7005,
        latitude: 10.7765,
        coverageArea: {
          type: 'Polygon',
          coordinates: [
            [
              [106.7, 10.776],
              [106.701, 10.776],
              [106.701, 10.777],
              [106.7, 10.777],
              [106.7, 10.776],
            ],
          ],
        },
        deliverables: [
          {
            deliverableTypeId: link.deliverableTypeId,
            requirement: { resolution: '4K' },
          },
        ],
      },
    })
    const payload = await response.json()
    expect(
      response.status(),
      JSON.stringify({ code: payload.code, message: payload.message }),
    ).toBe(201)
    const id = payload.data.id
    console.info('Created dev test Order ' + id)
    const details = await manager.get('/api/orders/' + id)
    expect(details.status()).toBe(200)
    expect((await details.json()).data.id).toBe(id)
  } finally {
    await Promise.all(contexts.map((context) => context.dispose()))
  }
})
