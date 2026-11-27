/**
 * V4 Intelligent Session Memory & BDI Mental State Store.
 *
 * Applies `memory-systems`, `bdi-mental-states`, `context-fundamentals`,
 * `context-compression`, and `context-degradation` skills:
 * - Isolated per (accountId, sessionId) so customer data never leaks across accounts/sessions.
 * - Tracks initial selection, previous selection, recent actions, editing context,
 *   pending BDI intentions (cancelled immediately on customer interruption), and compact summary.
 */
import type { AgentAction, CatalogService, ConversationMemory, SectionTarget } from './orderActionAgent'
import type { FormState, Step } from './types'

export type ActionMemoryRecord = {
  action: AgentAction
  ok: boolean
  timestamp: number
  summary: string
}

export type PendingIntention = {
  id: string
  targetSection: SectionTarget
  question?: string
  createdAt: number
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED_BY_USER'
}

export type StructuredSessionMemory = ConversationMemory & {
  scopeKey: string
  initialServiceId?: string
  selectionHistory: string[]
  recentActions: ActionMemoryRecord[]
  pendingIntention: PendingIntention | null
  userCorrections: string[]
  turnCount: number
}

const MAX_RECENT_ACTIONS = 12
const MAX_SELECTION_HISTORY = 10
const MAX_CORRECTIONS = 6

export class SessionMemoryStore {
  private memory: StructuredSessionMemory

  constructor(accountId = 'anonymous', sessionId = 'default') {
    this.memory = {
      scopeKey: `${accountId}:${sessionId}`,
      selectionHistory: [],
      recentActions: [],
      pendingIntention: null,
      userCorrections: [],
      turnCount: 0,
    }
  }

  /** Re-scope and wipe memory when account or conversation session changes (isolation guarantee). */
  resetForScope(accountId: string, sessionId: string) {
    const nextKey = `${accountId}:${sessionId}`
    if (this.memory.scopeKey === nextKey) return
    this.memory = {
      scopeKey: nextKey,
      selectionHistory: [],
      recentActions: [],
      pendingIntention: null,
      userCorrections: [],
      turnCount: 0,
    }
  }

  get snapshot(): StructuredSessionMemory {
    return {
      ...this.memory,
      selectionHistory: [...this.memory.selectionHistory],
      recentActions: [...this.memory.recentActions],
      userCorrections: [...this.memory.userCorrections],
      pendingIntention: this.memory.pendingIntention ? { ...this.memory.pendingIntention } : null,
    }
  }

  observeForm(form: FormState, activeStep: Step, activeSection: SectionTarget) {
    this.memory.activeStep = activeStep
    this.memory.activeSection = activeSection
    this.memory.hasFlightPurpose = Boolean(form.flightPurpose)
    if (form.serviceId) {
      if (!this.memory.initialServiceId) {
        this.memory.initialServiceId = form.serviceId
      }
      if (this.memory.currentServiceId && this.memory.currentServiceId !== form.serviceId) {
        this.memory.previousServiceId = this.memory.currentServiceId
      }
      if (this.memory.selectionHistory.at(-1) !== form.serviceId) {
        this.memory.selectionHistory = [
          ...this.memory.selectionHistory.slice(-(MAX_SELECTION_HISTORY - 1)),
          form.serviceId,
        ]
      }
      this.memory.currentServiceId = form.serviceId
    }
  }

  setPendingIntention(targetSection: SectionTarget, question?: string) {
    this.memory.pendingIntention = {
      id: `intent-${Date.now()}`,
      targetSection,
      question,
      createdAt: Date.now(),
      status: 'ACTIVE',
    }
  }

  cancelPendingIntention() {
    if (this.memory.pendingIntention && this.memory.pendingIntention.status === 'ACTIVE') {
      this.memory.pendingIntention = {
        ...this.memory.pendingIntention,
        status: 'CANCELLED_BY_USER',
      }
    }
  }

  recordAction(action: AgentAction, ok: boolean, summary: string, beforeServiceId?: string, afterServiceId?: string) {
    this.memory.turnCount += 1
    if (ok) {
      this.memory.lastAction = action
      if (action.type === 'reopen_selection') {
        this.memory.lastReferencedSection = action.target
      }
      if (afterServiceId && beforeServiceId && afterServiceId !== beforeServiceId) {
        if (!this.memory.initialServiceId) this.memory.initialServiceId = beforeServiceId
        this.memory.previousServiceId = beforeServiceId
        this.memory.currentServiceId = afterServiceId
        this.memory.selectionHistory = [
          ...this.memory.selectionHistory.slice(-(MAX_SELECTION_HISTORY - 1)),
          afterServiceId,
        ]
      }
    }
    this.memory.recentActions = [
      ...this.memory.recentActions.slice(-(MAX_RECENT_ACTIONS - 1)),
      { action, ok, timestamp: Date.now(), summary },
    ]
  }

  recordCorrection(utterance: string) {
    const compact = utterance.trim().slice(0, 140)
    if (!compact) return
    this.memory.userCorrections = [
      ...this.memory.userCorrections.slice(-(MAX_CORRECTIONS - 1)),
      compact,
    ]
  }

  /**
   * Builds a compact, high-signal context snapshot for backend LLM / Gemini calls.
   * Applies context-compression & context-degradation principles: only verified state,
   * visible option ordering, latest decisions, and active intention (no bloated source/history).
   */
  buildCompressedContext(form: FormState, visibleServices: CatalogService[]): Record<string, unknown> {
    const active = visibleServices.filter((s) => s.isActive !== false)
    return {
      activeStep: this.memory.activeStep ?? 1,
      activeSection: this.memory.activeSection ?? 'service',
      visibleServiceIds: active.map((s) => s.id),
      initialServiceId: this.memory.initialServiceId ?? '',
      previousServiceId: this.memory.previousServiceId ?? '',
      lastAction: this.memory.lastAction?.type ?? '',
      pendingIntention:
        this.memory.pendingIntention?.status === 'ACTIVE'
          ? this.memory.pendingIntention.targetSection
          : '',
      currentServiceId: form.serviceId || '',
      hasFlightPurpose: Boolean(form.flightPurpose),
      hasDescription: Boolean(form.description.trim()),
      turnCount: this.memory.turnCount,
    }
  }
}
