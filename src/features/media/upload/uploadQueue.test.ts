import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { UploadQueue } from './uploadQueue'
import { writeQueue } from './uploadQueueStorage'
import { resolveUploadState } from './resolveUploadState'

describe('mission upload queue', () => {
  it('limits concurrency and retains successful jobs when another file fails', async () => {
    const queue = new UploadQueue<string>(crypto.randomUUID())
    const release: Array<() => void> = []
    let active = 0,
      maximum = 0
    queue.bind(
      async (job) => {
        active++
        maximum = Math.max(active, maximum)
        await new Promise<void>((resolve) => release.push(resolve))
        active--
        if (job.payload === 'bad') throw new Error('network')
      },
      () => true,
    )
    await queue.enqueue('a', 'good')
    await queue.enqueue('b', 'bad')
    await queue.enqueue('c', 'good')
    expect(maximum).toBe(2)
    release.shift()!()
    release.shift()!()
    await waitFor(() =>
      expect(
        queue.getSnapshot().filter((job) => job.stage === 'FAILED'),
      ).toHaveLength(1),
    )
    await waitFor(() => expect(release).toHaveLength(1))
    release.shift()!()
    await waitFor(() =>
      expect(
        queue.getSnapshot().filter((job) => job.stage === 'DONE'),
      ).toHaveLength(2),
    )
    expect(maximum).toBe(2)
  })
  it('deduplicates a pending selection and respects the actor gate', async () => {
    const queue = new UploadQueue<string>(crypto.randomUUID())
    const perform = vi.fn().mockResolvedValue(undefined)
    queue.bind(perform, () => false)
    await queue.enqueue('same', 'file')
    await queue.enqueue('same', 'file')
    expect(queue.getSnapshot()).toHaveLength(1)
    expect(perform).not.toHaveBeenCalled()
    queue.bind(perform, () => true)
    await queue.retry(queue.getSnapshot()[0].id)
    await waitFor(() => expect(perform).toHaveBeenCalledOnce())
  })
  it('restores unfinished work as an explicit recovery action in the same account scope', async () => {
    const scope = crypto.randomUUID()
    await writeQueue(scope, [
      {
        id: 'job',
        key: 'file',
        payload: { localId: 'capture' },
        stage: 'TRANSFERRING',
      },
    ])
    const queue = new UploadQueue(scope)
    await waitFor(() =>
      expect(queue.getSnapshot()[0]?.errorCode).toBe('RECOVERY_REQUIRED'),
    )
    expect(queue.getSnapshot()[0].stage).toBe('FAILED')
    const otherAccount = new UploadQueue(`${scope}:other`)
    expect(otherAccount.getSnapshot()).toEqual([])
  })
  it('does not let backend pending hide a real local failure or running transfer', () => {
    expect(resolveUploadState('UPLOAD_FAILED', 'UPLOAD_PENDING')).toBe(
      'UPLOAD_FAILED',
    )
    expect(resolveUploadState('UPLOADING', 'UPLOAD_PENDING')).toBe('UPLOADING')
    expect(resolveUploadState('UPLOAD_FAILED', 'VALIDATING')).toBe('VALIDATING')
    expect(resolveUploadState('UPLOAD_FAILED', 'AVAILABLE')).toBe('AVAILABLE')
  })
})
