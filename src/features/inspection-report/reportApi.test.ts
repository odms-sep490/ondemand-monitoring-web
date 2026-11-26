import { afterEach, expect, it } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../shared/api/httpClient'
import { reportApi } from './reportApi'
afterEach(resetHttpTransport)
it('preserves PDF response bytes instead of consuming them as JSON', async () => {
  const bytes = '%PDF-1.7\nfixture'
  setHttpTransport(
    async () =>
      new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } }),
  )
  const blob = await reportApi.pdf('report-1', false)
  expect(await blob.text()).toBe(bytes)
})
it('preserves authorized image responses', async () => {
  setHttpTransport(
    async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { 'Content-Type': 'image/jpeg' },
      }),
  )
  expect((await reportApi.image('report-1', 'media-1')).size).toBe(3)
})
