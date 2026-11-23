import { expect, it } from 'vitest'
import { createDefaultForm } from './draftStorage'
import { circleCoverageArea } from './coverageGeometry'
import { buildOrderPayload } from './payload'
import {
  applyConfirmedAgentChanges,
  canonicalDraftToFormState,
  type OrderAgentSession,
} from './orderAgent'

function fixture() {
  const form = {
    ...createDefaultForm(),
    serviceId: 'service',
    description: 'Theo dõi mái',
    flightPurpose: 'CONSTRUCTION_MONITORING' as const,
    latitude: '10.7769',
    longitude: '106.7009',
    locationStatus: 'confirmed' as const,
    locationConfirmedAt: 'confirmed',
    coverageArea: circleCoverageArea([106.7009, 10.7769], 50),
    coverageAreaShape: 'CIRCLE' as const,
    siteContactName: 'Customer',
    siteContactPhone: '0901234567',
    accessNotes: 'Cổng chính',
    monitoringRelationship: 'OWNER' as const,
    monitoringAuthorizationConfirmed: true,
    termsAccepted: true,
    preferredTimeId: 'morning',
    deliverableTypeId: 'photo',
  }
  const canonicalDraft = {
    ...buildOrderPayload({
      form,
      score: { score: 0, level: 'good', notes: [] },
    }),
    checklistItems: [
      {
        sourceChecklistId: 'roof',
        expectedChecklistVersion: 2,
        requestedImageCount: 4,
        requestedVideoCount: 1,
      },
    ],
  }
  const session: OrderAgentSession = {
    id: 'session',
    revision: 3,
    expiresAt: '2099-01-01',
    state: {
      messages: [],
      confirmedFields: {},
      pendingChanges: {},
      readyForReview: true,
      canonicalDraft,
    },
  }
  return { form, session }
}
it('maps service, checklist, customer-confirmed map, schedule, contact and delivery into the actual form', () => {
  const { form, session } = fixture()
  const next = canonicalDraftToFormState(form, session)
  expect(next.serviceId).toBe('service')
  expect(next.coverageArea).toEqual(form.coverageArea)
  expect(next.preferredDateFrom).toBe(form.preferredDateFrom)
  expect(next.preferredTimeId).toBe('morning')
  expect(next.siteContactPhone).toBe('0901234567')
  expect(next.deliverableTypeId).toBe('photo')
  expect(next.agentChecklistItems?.[0].requestedVideoCount).toBe(1)
  expect(next.termsAccepted).toBe(true)
  expect(next.orderAgentSessionId).toBe('session')
  expect(form.agentChecklistItems).toBeUndefined()
})
it('rejects unvalidated drafts and a geometry the customer did not confirm', () => {
  const { form, session } = fixture()
  expect(() =>
    canonicalDraftToFormState(form, {
      ...session,
      state: { ...session.state, readyForReview: false },
    }),
  ).toThrow()
  expect(() =>
    canonicalDraftToFormState(
      { ...form, locationStatus: 'unconfirmed' },
      session,
    ),
  ).toThrow()
  expect(() =>
    canonicalDraftToFormState(
      { ...form, coverageArea: circleCoverageArea([106.701, 10.777], 80) },
      session,
    ),
  ).toThrow()
})
it('invalidates service dependencies while retaining unrelated confirmed map and schedule', () => {
  const { form } = fixture()
  const next = applyConfirmedAgentChanges(
    { ...form, agentChecklistItems: [{ sourceChecklistId: 'old' }] },
    { serviceId: 'new' },
  )
  expect(next.agentChecklistItems).toBeUndefined()
  expect(next.deliverableTypeId).toBe('')
  expect(next.coverageArea).toEqual(form.coverageArea)
  expect(next.preferredDateFrom).toBe(form.preferredDateFrom)
  expect(() =>
    applyConfirmedAgentChanges(form, { termsAccepted: true } as never),
  ).toThrow()
})
