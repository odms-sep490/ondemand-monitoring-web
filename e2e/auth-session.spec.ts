import { expect, test, type BrowserContext, type Page } from '@playwright/test'

// Run with playwright.auth.config.ts so auth QA never reuses the app on port 5173.

const origin = 'http://localhost:5175'
const cookieName = 'OMSS_REFRESH_TOKEN'
const profiles = {
  customer: {
    id: 'customer',
    fullName: 'Customer Session',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    linkedProviders: ['LOCAL'],
  },
  staff: {
    id: 'staff',
    fullName: 'Staff Session',
    email: 'staff@example.com',
    role: 'STAFF',
    linkedProviders: ['LOCAL'],
  },
}

async function apiFixture(context: BrowserContext) {
  const state = {
    refreshes: 0,
    active: 0,
    maxActive: 0,
    offline: false,
    holdRefresh: undefined as Promise<void> | undefined,
  }
  await context.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    const json = (
      data: unknown,
      status = 200,
      headers?: Record<string, string>,
    ) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({
          success: status === 200,
          data,
          code: status === 401 ? 'REFRESH_TOKEN_INVALID' : undefined,
        }),
      })
    if (path === '/api/auth/csrf') {
      if (state.offline) return route.abort('internetdisconnected')
      return json('csrf-test')
    }
    if (path === '/api/auth/login') {
      const body = request.postDataJSON()
      const id = body.email === profiles.staff.email ? 'staff' : 'customer'
      return json(
        {
          accessToken: `header.${id}.signature`,
          tokenType: 'Bearer',
          user: profiles[id],
        },
        200,
        {
          'Set-Cookie': `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax${body.rememberMe ? '; Max-Age=2592000' : ''}`,
        },
      )
    }
    if (path === '/api/auth/logout') {
      expect(request.headers()['x-xsrf-token']).toBe('csrf-test')
      return json(null, 200, {
        'Set-Cookie': `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      })
    }
    const id = (await context.cookies()).find(
      (cookie) => cookie.name === cookieName,
    )?.value as keyof typeof profiles | undefined
    if (path === '/api/auth/refresh') {
      expect(request.headers()['x-xsrf-token']).toBe('csrf-test')
      state.refreshes += 1
      state.active += 1
      state.maxActive = Math.max(state.maxActive, state.active)
      if (state.holdRefresh) await state.holdRefresh
      state.active -= 1
      return id && profiles[id]
        ? json({ accessToken: `header.${id}.signature`, tokenType: 'Bearer' })
        : json(null, 401)
    }
    const token = request.headers().authorization?.replace('Bearer ', '')
    const authenticated = id && token === `header.${id}.signature`
    if (path === '/api/users/me')
      return authenticated ? json(profiles[id]) : json(null, 401)
    if (path === '/api/session-probe')
      return authenticated ? json('ok') : json(null, 401)
    // Keep every non-auth request in this isolated test server; never reach a live BE.
    return json(null, 404)
  })
  return state
}

async function seedCookie(context: BrowserContext, remembered = false) {
  await context.addCookies([
    {
      name: cookieName,
      value: 'customer',
      url: origin,
      httpOnly: true,
      sameSite: 'Lax',
      ...(remembered ? { expires: Math.floor(Date.now() / 1000) + 3600 } : {}),
    },
  ])
}

async function login(
  page: Page,
  account: 'customer' | 'staff',
  rememberMe = false,
) {
  await page.evaluate(
    async ({ account, rememberMe }) => {
      const url = '/src/features/auth/api/authApi.ts'
      const { authApi } = await import(url)
      await authApi.login({
        email: `${account}@example.com`,
        password: 'Password1!',
        rememberMe,
      })
      window.location.hash = '#profile'
    },
    { account, rememberMe },
  )
  await expect(
    page.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
  ).toBeVisible()
}

async function logout(page: Page) {
  await page.evaluate(async () => {
    const url = '/src/features/auth/api/logout.ts'
    await (await import(url)).logout()
  })
}

async function expectUser(page: Page, id: 'customer' | 'staff') {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem('fieldwise.user') ?? 'null')?.id,
      ),
    )
    .toBe(id)
}

test('a new independent tab restores a cookie session and reload validates it', async ({
  context,
}) => {
  await apiFixture(context)
  await seedCookie(context)
  const page = await context.newPage()
  await page.goto('/#profile')
  await expect(
    page.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
  ).toBeVisible()
  await expectUser(page, 'customer')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('fieldwise.accessToken')),
  ).toBeNull()
})

for (const rememberMe of [false, true]) {
  test(`remember-me=${rememberMe} sets cookie persistence and supports the next browser session`, async ({
    browser,
    context,
  }) => {
    await apiFixture(context)
    const page = await context.newPage()
    await page.goto('/#auth/login')
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
    await login(page, 'customer', rememberMe)
    const cookie = (await context.cookies()).find(
      (entry) => entry.name === cookieName,
    )!
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.expires > 0).toBe(rememberMe)
    const state = await context.storageState()
    // A fresh browser session retains persistent cookies and localStorage, but
    // discards session cookies/sessionStorage. No real browser process is restarted.
    const fresh = await browser.newContext({
      storageState: {
        origins: state.origins,
        cookies: state.cookies.filter((entry) => entry.expires > 0),
      },
    })
    try {
      await apiFixture(fresh)
      const freshPage = await fresh.newPage()
      await freshPage.goto('/#profile')
      await expect(
        freshPage.getByRole('heading', {
          name: rememberMe ? 'Hồ sơ cá nhân' : 'Đăng nhập',
        }),
      ).toBeVisible()
    } finally {
      await fresh.close()
    }
  })
}

for (const storageFallback of [false, true]) {
  test(`login/logout synchronize existing tabs (${storageFallback ? 'storage fallback' : 'BroadcastChannel'})`, async ({
    context,
  }) => {
    if (storageFallback)
      await context.addInitScript(() => {
        Object.defineProperty(window, 'BroadcastChannel', { value: undefined })
      })
    await apiFixture(context)
    const first = await context.newPage()
    const second = await context.newPage()
    await first.goto('/#auth/login')
    await expect(
      first.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeVisible()
    await second.goto('/#auth/login')
    await expect(
      second.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeVisible()
    await login(first, 'customer')
    await expectUser(second, 'customer')
    await second.goto('/#profile')
    await expect(
      second.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
    ).toBeVisible()
    await logout(first)
    await expect(
      second.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeVisible()
    await second.reload()
    await expect(
      second.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeVisible()
    expect(await context.cookies()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: cookieName })]),
    )
  })
}

test('account switching clears the previous profile and applies role guards in every tab', async ({
  context,
}) => {
  await apiFixture(context)
  await seedCookie(context)
  const first = await context.newPage()
  const second = await context.newPage()
  await first.goto('/#profile')
  await second.goto('/#profile')
  await expectUser(first, 'customer')
  await expectUser(second, 'customer')
  await login(first, 'staff')
  await expectUser(second, 'staff')
  await expect(
    second.getByRole('heading', { name: 'Staff Session' }),
  ).toBeVisible()
  await expect(
    second.getByRole('heading', { name: 'Customer Session' }),
  ).toHaveCount(0)
  await second.goto('/#portal/customer/orders')
  await expect(second).toHaveURL(/#portal\/staff/)
})

test('concurrent logins keep the shared cookie and every tab on the same account', async ({
  context,
}) => {
  await apiFixture(context)
  const pages = await Promise.all([context.newPage(), context.newPage()])
  for (const page of pages) {
    await page.goto('/#auth/login')
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  }
  const results = await Promise.all(
    pages.map((page, index) =>
      page.evaluate(
        async (id) => {
          const url = '/src/features/auth/api/authApi.ts'
          try {
            await (
              await import(url)
            ).authApi.login({
              email: `${id}@example.com`,
              password: 'Password1!',
            })
            return 'authenticated'
          } catch (error) {
            return (error as { code?: string }).code
          }
        },
        index === 0 ? 'customer' : 'staff',
      ),
    ),
  )
  expect(results).toContain('authenticated')
  expect(
    results.every((result) =>
      ['authenticated', 'SESSION_CHANGED'].includes(result!),
    ),
  ).toBe(true)
  const cookie = (await context.cookies()).find(
    (entry) => entry.name === cookieName,
  )!
  for (const page of pages)
    await expectUser(page, cookie.value as 'customer' | 'staff')
})

test('Web Locks serialize concurrent refreshes from separate tabs', async ({
  context,
}) => {
  const state = await apiFixture(context)
  await seedCookie(context)
  const pages = await Promise.all([context.newPage(), context.newPage()])
  for (const page of pages) {
    await page.goto('/#profile')
    await expectUser(page, 'customer')
    await page.evaluate(() =>
      sessionStorage.setItem(
        'fieldwise.accessToken',
        'header.expired.signature',
      ),
    )
  }
  state.maxActive = 0
  let release!: () => void
  state.holdRefresh = new Promise<void>((resolve) => {
    release = resolve
  })
  const requests = pages.map((page) =>
    page.evaluate(async () => {
      const url = '/src/features/auth/api/authApi.ts'
      const { authenticatedFetch } = await import(url)
      return (await authenticatedFetch(`${location.origin}/api/session-probe`))
        .status
    }),
  )
  await expect.poll(() => state.active).toBe(1)
  release()
  expect(await Promise.all(requests)).toEqual([200, 200])
  expect(state.maxActive).toBe(1)
})

test('a late refresh response cannot restore a session after another tab logs out', async ({
  context,
}) => {
  const state = await apiFixture(context)
  await seedCookie(context)
  const first = await context.newPage()
  const second = await context.newPage()
  for (const page of [first, second]) {
    await page.goto('/#profile')
    await expectUser(page, 'customer')
  }
  let release!: () => void
  state.holdRefresh = new Promise<void>((resolve) => {
    release = resolve
  })
  const request = second.evaluate(async () => {
    sessionStorage.setItem('fieldwise.accessToken', 'header.expired.signature')
    const url = '/src/features/auth/api/authApi.ts'
    try {
      await (
        await import(url)
      ).authenticatedFetch(`${location.origin}/api/session-probe`)
      return 'unexpected-success'
    } catch (error) {
      return (error as { code?: string }).code
    }
  })
  await expect.poll(() => state.active).toBe(1)
  const signout = logout(first)
  await expect(second.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  release()
  await signout
  expect(await request).toBe('SESSION_CHANGED')
  expect(
    await second.evaluate(() =>
      sessionStorage.getItem('fieldwise.accessToken'),
    ),
  ).toBeNull()
})

test('offline bootstrap offers retry and keeps the protected route until verification finishes', async ({
  context,
}) => {
  const state = await apiFixture(context)
  state.offline = true
  await seedCookie(context)
  const page = await context.newPage()
  await page.goto('/#profile')
  await expect(
    page.getByText('Chưa thể kiểm tra phiên đăng nhập.', { exact: false }),
  ).toBeVisible()
  await expect(page).toHaveURL(/#profile$/)
  state.offline = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
  ).toBeVisible()
})
