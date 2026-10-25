/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

async function call(method: string, path: string, body?: unknown) {
  const response = await mockFetch(`${env.apiBaseUrl}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('/api/services (BE shape)', () => {
  it('lists services as a plain array in the envelope', async () => {
    const { status, payload } = await call('GET', '/api/services')
    expect(status).toBe(200)
    expect(payload.success).toBe(true)
    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.data[0]).toHaveProperty('isActive')
  })

  it('creates, updates and deletes a service', async () => {
    const created = await call('POST', '/api/services', {
      name: 'Mới',
      basePrice: 1_000_000,
    })
    expect(created.status).toBe(201)
    const id = created.payload.data.id
    const put = await call('PUT', `/api/services/${id}`, {
      name: 'Sửa',
      basePrice: 1_200_000,
      isActive: false,
    })
    expect(put.payload.data).toMatchObject({ name: 'Sửa', isActive: false })
    expect((await call('DELETE', `/api/services/${id}`)).status).toBe(200)
    expect((await call('GET', `/api/services/${id}`)).status).toBe(404)
  })

  it('rejects a blank name with field errors', async () => {
    const { status, payload } = await call('POST', '/api/services', { name: ' ' })
    expect(status).toBe(400)
    expect(payload.errors.name).toBeTruthy()
  })
})

describe('/api/preferred-times (BE shape)', () => {
  it('lists preferred times', async () => {
    const { payload } = await call('GET', '/api/preferred-times')
    expect((payload.data as any[]).length).toBeGreaterThan(0)
  })

  it('creates, updates and deletes', async () => {
    const created = await call('POST', '/api/preferred-times', {
      code: 'NIGHT',
      name: 'Đêm',
      startTime: '22:00',
      endTime: '05:00',
    })
    expect(created.status).toBe(201)
    const id = created.payload.data.id
    const put = await call('PUT', `/api/preferred-times/${id}`, { name: 'Khuya' })
    expect(put.payload.data.name).toBe('Khuya')
    expect((await call('DELETE', `/api/preferred-times/${id}`)).status).toBe(200)
  })

  it('validates required fields and code enum', async () => {
    const { status, payload } = await call('POST', '/api/preferred-times', { code: 'X' })
    expect(status).toBe(400)
    expect(payload.errors.code).toBeTruthy()
    expect(payload.errors.name).toBeTruthy()
  })

  it('returns 409 for a duplicate code', async () => {
    const { status } = await call('POST', '/api/preferred-times', {
      code: 'MORNING',
      name: 'x',
      startTime: '06:00',
      endTime: '07:00',
    })
    expect(status).toBe(409)
  })
})
