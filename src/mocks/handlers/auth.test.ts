import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import './auth'

function clearCookies() {
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0]?.trim()
    if (name) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  })
}

async function postJson(path: string, body: unknown, headers?: HeadersInit) {
  return mockFetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  })
}

beforeEach(() => {
  resetMockDb()
  clearCookies()
})

afterEach(() => {
  resetMockDb()
  clearCookies()
  vi.restoreAllMocks()
})

describe('POST /api/v1/auth/login', () => {
  it('logs in a known mock user with the right password', async () => {
    const response = await postJson('/api/v1/auth/login', {
      email: 'hang.le@odms.vn',
      password: 'Demo@123',
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.accessToken).toBe('mock-staff-token')
    expect(payload.data.user).toMatchObject({
      email: 'hang.le@odms.vn',
      role: 'MANAGER',
      fullName: 'Lê Thị Thanh Hằng',
    })
  })

  it('logs in an admin mock user with the right password and returns ADMIN role', async () => {
    const response = await postJson('/api/v1/auth/login', {
      email: 'binh.tran@odms.vn',
      password: 'Demo@123',
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.accessToken).toBe('mock-admin-token')
    expect(payload.data.user).toMatchObject({
      email: 'binh.tran@odms.vn',
      role: 'ADMIN',
      fullName: 'Trần Quốc Bình',
    })
  })

  it('rejects a known mock user with the wrong password (INVALID_CREDENTIALS)', async () => {
    const response = await postJson('/api/v1/auth/login', {
      email: 'hang.le@odms.vn',
      password: 'wrong-password',
    })
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.success).toBe(false)
    expect(payload.code).toBe('INVALID_CREDENTIALS')
    expect(payload.message).toBe('Email hoặc mật khẩu không đúng')
  })

  it('rejects an inactive mock user (ACCOUNT_DISABLED)', async () => {
    const response = await postJson('/api/v1/auth/login', {
      email: 'locked.demo@odms.vn',
      password: 'Demo@123',
    })
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe('ACCOUNT_DISABLED')
    expect(payload.message).toBe('Tài khoản đã bị vô hiệu hóa')
  })

  it('passes unknown emails through to the real network', async () => {
    const realResponse = new Response('{}', { status: 200 })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(realResponse)

    const response = await postJson('/api/v1/auth/login', {
      email: 'someone-real@example.com',
      password: 'whatever',
    })

    expect(fetchSpy).toHaveBeenCalled()
    expect(response).toBe(realResponse)
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('accepts a known mock access token', async () => {
    const response = await postJson(
      '/api/v1/auth/logout',
      {},
      { Authorization: 'Bearer mock-staff-token' },
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
  })

  it('passes an unknown token through to the real network', async () => {
    const realResponse = new Response('{}', { status: 200 })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(realResponse)

    const response = await postJson(
      '/api/v1/auth/logout',
      {},
      { Authorization: 'Bearer some-real-token' },
    )

    expect(fetchSpy).toHaveBeenCalled()
    expect(response).toBe(realResponse)
  })

  it('passes through when there is no Authorization header', async () => {
    const realResponse = new Response('{}', { status: 200 })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(realResponse)

    const response = await postJson('/api/v1/auth/logout', {})
    expect(response).toBe(realResponse)
  })
})

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new mock token when a mock session cookie is set', async () => {
    await postJson('/api/v1/auth/login', {
      email: 'bao.le@logisticscatlai.vn',
      password: 'Demo@123',
    })

    const response = await postJson('/api/v1/auth/refresh', {})
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.accessToken).toBe('mock-customer-token')
    expect(payload.data.user).toBeUndefined()
  })

  it('passes through when there is no mock session cookie', async () => {
    const realResponse = new Response('{}', { status: 200 })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(realResponse)

    const response = await postJson('/api/v1/auth/refresh', {})

    expect(fetchSpy).toHaveBeenCalled()
    expect(response).toBe(realResponse)
  })
})
