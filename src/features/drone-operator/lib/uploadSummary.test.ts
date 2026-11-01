import { describe, expect, it } from 'vitest'

import type { MediaFile } from '../types/mission'
import { uploadSummary } from './uploadSummary'

function file(overrides: Partial<MediaFile>): MediaFile {
  return {
    id: 'IMG_0001.JPG',
    name: 'IMG_0001.JPG',
    type: 'PHOTO',
    sizeBytes: 8_000_000,
    progressPct: 100,
    attempt: 1,
    maxAttempts: 3,
    status: 'UPLOADED',
    ...overrides,
  }
}

describe('uploadSummary', () => {
  it('counts uploaded/uploading/manual and flags done when all uploaded', () => {
    const files = [
      file({ id: 'a', status: 'UPLOADED' }),
      file({ id: 'b', status: 'UPLOADED' }),
    ]
    const summary = uploadSummary(files)
    expect(summary).toEqual({
      nTotal: 2,
      nUploaded: 2,
      nUploading: 0,
      nManual: 0,
      isDone: true,
      isEmpty: false,
    })
  })

  it('flags manual tasks and not-done when some files are still in flight', () => {
    const files = [
      file({ id: 'a', status: 'UPLOADED' }),
      file({ id: 'b', status: 'UPLOADING', progressPct: 40 }),
      file({
        id: 'c',
        status: 'FAILED',
        attempt: 3,
        manualTaskCreated: true,
      }),
    ]
    const summary = uploadSummary(files)
    expect(summary.nUploaded).toBe(1)
    expect(summary.nUploading).toBe(1)
    expect(summary.nManual).toBe(1)
    expect(summary.isDone).toBe(false)
  })

  it('treats an empty queue as empty, not done', () => {
    const summary = uploadSummary([])
    expect(summary.isEmpty).toBe(true)
    expect(summary.isDone).toBe(false)
  })

  it('counts server-accepted files as uploaded while preserving review outcomes', () => {
    const summary = uploadSummary([
      file({ id: 'validating', status: 'VALIDATING' }),
      file({ id: 'pending-review', status: 'PENDING_MANAGER_APPROVAL' }),
      file({ id: 'approved', status: 'AVAILABLE' }),
      file({ id: 'rejected', status: 'REJECTED' }),
    ])

    expect(summary.nUploaded).toBe(4)
    expect(summary.isDone).toBe(true)
  })
})
