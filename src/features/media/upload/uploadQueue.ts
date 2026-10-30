import { readQueue, writeQueue } from './uploadQueueStorage'

export type UploadStage =
  | 'QUEUED'
  | 'PREPARING'
  | 'ATTACHING'
  | 'TRANSFERRING'
  | 'VALIDATING'
  | 'FAILED'
  | 'DONE'
export type UploadJob<T> = {
  id: string
  key: string
  payload: T
  stage: UploadStage
  errorCode?: string
}
type Performer<T> = (
  job: UploadJob<T>,
  stage: (value: UploadStage) => void,
) => Promise<void>

/** Page-independent queue. Persist metadata before starting any network side effect. */
export class UploadQueue<T> {
  private jobs: UploadJob<T>[] = []
  private listeners = new Set<() => void>()
  private running = 0
  private writes: Promise<void> = Promise.resolve()
  private ready: Promise<void>
  private perform?: Performer<T>
  private allowed = () => false
  readonly scope: string
  readonly concurrency: number
  private storageFailed = false
  constructor(scope: string, concurrency = 2) {
    this.scope = scope
    this.concurrency = concurrency
    this.ready = readQueue<UploadJob<T>>(scope)
      .then((jobs) => {
        this.jobs = jobs.map((job) => ({
          ...job,
          stage: job.stage === 'DONE' ? 'DONE' : 'FAILED',
          errorCode: 'RECOVERY_REQUIRED',
        }))
        this.emit()
      })
      .catch(() => {
        this.storageFailed = true
      })
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getSnapshot = () => this.jobs
  bind(perform: Performer<T>, allowed: () => boolean) {
    this.perform = perform
    this.allowed = allowed
    void this.ready.then(() => this.pump())
  }
  async enqueue(key: string, payload: T) {
    await this.ready
    if (this.storageFailed) throw new Error('PERSISTENCE_UNAVAILABLE')
    if (this.jobs.some((job) => job.key === key && job.stage !== 'DONE')) return
    const job: UploadJob<T> = {
      id: crypto.randomUUID(),
      key,
      payload,
      stage: 'QUEUED',
    }
    this.jobs = [...this.jobs.filter((old) => old.key !== key), job]
    try {
      await this.persist()
    } catch (error) {
      this.jobs = this.jobs.filter((entry) => entry !== job)
      this.emit()
      throw error
    }
    this.emit()
    this.pump()
  }
  async retry(id: string) {
    await this.ready
    const job = this.jobs.find((entry) => entry.id === id)
    if (!job || !['FAILED', 'QUEUED'].includes(job.stage)) return
    this.update(id, { stage: 'QUEUED', errorCode: undefined })
    await this.persist()
    this.pump()
  }
  async updatePayload(id: string, payload: T) {
    this.update(id, { payload })
    await this.persist()
  }
  async remove(id: string) {
    await this.ready
    this.jobs = this.jobs.filter(
      (job) => job.id !== id || !['FAILED', 'DONE'].includes(job.stage),
    )
    await this.persist()
    this.emit()
  }
  private persist() {
    const snapshot = this.jobs
    this.writes = this.writes
      .catch(() => undefined)
      .then(() => writeQueue(this.scope, snapshot))
    return this.writes
  }
  private emit() {
    this.listeners.forEach((listener) => listener())
  }
  private update(id: string, change: Partial<UploadJob<T>>) {
    this.jobs = this.jobs.map((job) =>
      job.id === id ? { ...job, ...change } : job,
    )
    this.emit()
  }
  private pump() {
    if (!this.perform || !this.allowed()) return
    for (const job of this.jobs) {
      if (this.running >= this.concurrency) break
      if (job.stage !== 'QUEUED') continue
      this.running++
      this.update(job.id, { stage: 'PREPARING' })
      const perform = this.perform
      void perform(job, (stage) => this.update(job.id, { stage }))
        .then(() => {
          this.update(job.id, { stage: 'DONE' })
        })
        .catch((error: unknown) => {
          const code =
            error && typeof error === 'object' && 'code' in error
              ? String(error.code)
              : 'UPLOAD_FAILED'
          this.update(job.id, { stage: 'FAILED', errorCode: code })
        })
        .finally(() => {
          this.running--
          void this.persist().catch(() =>
            this.update(job.id, {
              stage: 'FAILED',
              errorCode: 'PERSISTENCE_UNAVAILABLE',
            }),
          )
          this.pump()
        })
    }
  }
}
