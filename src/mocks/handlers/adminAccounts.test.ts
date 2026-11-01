/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; payload: any }> {
  const response = await mockFetch(`${base}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/admin/users', () => {
  it('returns a BE PageResponse', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/admin/users?page=0&size=5',
    )
    expect(status).toBe(200)
    const d = payload.data
    expect(d.items.length).toBeLessThanOrEqual(5)
    expect(d.page).toBe(0)
    expect(d.size).toBe(5)
    expect(d.first).toBe(true)
    expect(d.totalPages).toBe(Math.ceil(d.totalItems / 5))
    expect(typeof d.items[0].active).toBe('boolean')
    expect(d.items[0].status).toBeUndefined()
  })

  it('paginates', async () => {
    const p1 = (await call('GET', '/api/admin/users?page=1&size=5')).payload
      .data
    expect(p1.first).toBe(false)
    expect(p1.items.length).toBeGreaterThan(0)
  })

  it('filters by role and active', async () => {
    const { payload } = await call(
      'GET',
      '/api/admin/users?role=MANAGER&active=false',
    )
    expect(
      payload.data.items.every((a: any) => a.role === 'MANAGER' && !a.active),
    ).toBe(true)
  })

  it('items sorted newest createdAt first', async () => {
    const items: any[] = (await call('GET', '/api/admin/users?size=50')).payload
      .data.items
    for (let i = 1; i < items.length; i++) {
      expect(new Date(items[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(items[i].createdAt).getTime(),
      )
    }
  })
})

describe('GET /api/admin/users/:id', () => {
  it('returns detail for existing account', async () => {
    const list = await call('GET', '/api/admin/users')
    const id = list.payload.data.items[0].id
    const { status, payload } = await call('GET', `/api/admin/users/${id}`)
    expect(status).toBe(200)
    expect(payload.data.id).toBe(id)
    expect(Array.isArray(payload.data.linkedProviders)).toBe(true)
  })

  it('returns 404 for unknown id', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/admin/users/unknown-xyz',
    )
    expect(status).toBe(404)
    expect(payload.code).toBe('NOT_FOUND')
  })
})

describe('PATCH /api/admin/users/:id/status', () => {
  it('locks and unlocks an account', async () => {
    const list = await call('GET', '/api/admin/users?active=true')
    const id = list.payload.data.items[0].id
    const off = await call('PATCH', `/api/admin/users/${id}/status`, {
      active: false,
    })
    expect(off.status).toBe(200)
    expect(off.payload.data.active).toBe(false)
    const on = await call('PATCH', `/api/admin/users/${id}/status`, {
      active: true,
    })
    expect(on.payload.data.active).toBe(true)
  })

  it('returns 400 without active and 404 for unknown id', async () => {
    const list = await call('GET', '/api/admin/users')
    const id = list.payload.data.items[0].id
    expect(
      (await call('PATCH', `/api/admin/users/${id}/status`, {})).status,
    ).toBe(400)
    expect(
      (await call('PATCH', '/api/admin/users/nope/status', { active: true }))
        .status,
    ).toBe(404)
  })
})

describe('POST /api/admin/accounts', () => {
  it('creates a managed account and returns ManagedAccountResponse', async () => {
    const { status, payload } = await call('POST', '/api/admin/accounts', {
      fullName: 'Nhân viên Mới',
      email: 'NewStaff@test.vn',
      role: 'MANAGER',
    })
    expect(status).toBe(200)
    expect(payload.data).toEqual({
      email: 'newstaff@test.vn',
      role: 'MANAGER',
      invitationSent: true,
      passwordChangeRequired: true,
    })
  })

  it('returns 400 when fullName or email is missing', async () => {
    for (const body of [
      { email: 'x@y.vn', role: 'MANAGER' },
      { fullName: 'A', role: 'MANAGER' },
    ]) {
      const { status, payload } = await call(
        'POST',
        '/api/admin/accounts',
        body,
      )
      expect(status).toBe(400)
      expect(payload.code).toBe('VALIDATION_ERROR')
    }
  })

  it('returns 409 when email already exists', async () => {
    const list = await call('GET', '/api/admin/users')
    const existing = list.payload.data.items[0]
    const { status, payload } = await call('POST', '/api/admin/accounts', {
      fullName: 'Duplicate',
      email: existing.email,
      role: 'MANAGER',
    })
    expect(status).toBe(409)
    expect(payload.code).toBe('EMAIL_EXISTS')
  })

  it('new account appears in list', async () => {
    await call('POST', '/api/admin/accounts', {
      fullName: 'Kiểm tra',
      email: 'check@test.vn',
      role: 'STAFF',
    })
    const { payload } = await call('GET', '/api/admin/users?size=50')
    const found = payload.data.items.find(
      (a: any) => a.email === 'check@test.vn',
    )
    expect(found.role).toBe('STAFF')
    expect(found.emailVerified).toBe(false)
  })
})
