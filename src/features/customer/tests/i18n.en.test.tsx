import { act } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import customerSeed from '../../../mocks/data/customer-orders.json'
import { customerApi } from '../api/customerApi'
import {
  translatedCategoryNames,
  translatedDeliverableNames,
} from '../lib/i18n/catalogNames'
import { translatedServiceNames } from '../lib/i18n/serviceNames'
import { Router } from '../../../app/router'
import { supportApi, type SupportTicketDto } from '../../support/api/supportApi'
import { CustomerApp } from '../CustomerApp'
import { CustomerCreateRequestPage } from '../pages/CustomerCreateRequest'

/**
 * Regression guard: after switching to English, no Vietnamese diacritic may
 * be left in the rendered text or in aria-label/title/placeholder/alt values
 * of any Customer page (including the sidebar shell and the chatbot).
 */
const VI_CHARS =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i

/**
 * Seed / BE data that is legitimately Vietnamese: every diacritic-bearing
 * string value of the mock customer seed (order titles, addresses, notes...)
 * plus the mock catalog names. UI copy is never added here.
 */
/** Seed fields the FE localizes (service and timeslot names): never allowlisted. */
const TRANSLATED_SEED_KEYS = new Set(['serviceNames', 'serviceName', 'preferredTimeName'])

function collectSeedStrings(value: unknown, out: Set<string>) {
  if (typeof value === 'string') {
    if (VI_CHARS.test(value)) out.add(value)
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectSeedStrings(v, out))
  } else if (value && typeof value === 'object') {
    // Object keys are data too (e.g. AI finding evidence labels).
    for (const [key, v] of Object.entries(value)) {
      if (TRANSLATED_SEED_KEYS.has(key)) continue
      if (VI_CHARS.test(key)) out.add(key)
      collectSeedStrings(v, out)
    }
  }
}

/** Vietnamese string literals of the mock BE handlers (catalog, zones, missions). */
const MOCK_HANDLER_SOURCES = import.meta.glob(
  '../../../mocks/handlers/{catalogBe,customerCreateOrderBe,customerMissionHistoryBe}.ts',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>
function collectHandlerStrings(out: Set<string>) {
  for (const source of Object.values(MOCK_HANDLER_SOURCES)) {
    for (const match of source.matchAll(/'([^'\n]+)'/g)) {
      if (VI_CHARS.test(match[1])) out.add(match[1])
    }
  }
}
/** Service and preferred-time names from the seed orders and the mock catalog. */
function translatedCatalogNames(): Set<string> {
  const names = new Set<string>()
  const orders = (customerSeed as { orders?: Array<Record<string, unknown>> }).orders ?? []
  for (const order of orders) {
    for (const s of (order.serviceNames as string[] | undefined) ?? []) names.add(s)
    if (typeof order.preferredTimeName === 'string') names.add(order.preferredTimeName)
  }
  for (const s of [...translatedServiceNames(), ...translatedDeliverableNames(), ...translatedCategoryNames()]) names.add(s)
  for (const s of ['Buổi sáng', 'Buổi chiều', 'Buổi tối']) names.add(s)
  return names
}
let seedCache: string[] | undefined
function seedStrings(): string[] {
  if (seedCache) return seedCache
  seedCache = (() => {
  // Text this test types into the form itself.
  const set = new Set<string>(['KCN Long Hậu', 'Đơn kiểm thử'])
  collectSeedStrings(customerSeed, set)
  collectSeedStrings(TICKET, set)
  // Service and timeslot names are translated by the FE, so they must NOT be
  // allowlisted: seeing one in English mode is a failure.
  const handlerStrings = new Set<string>()
  collectHandlerStrings(handlerStrings)
  for (const name of translatedCatalogNames()) handlerStrings.delete(name)
  handlerStrings.forEach((v) => set.add(v))
  return [...set].sort((x, y) => y.length - x.length)
  })()
  return seedCache
}

function stripSeed(text: string): string {
  let out = text
  for (const seed of seedStrings()) out = out.split(seed).join('')
  return out
}

/** Every visible text node and text-bearing attribute of the document. */
function visibleStrings(): string[] {
  const out: string[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim()
    if (text) out.push(text)
  }
  document.querySelectorAll('*').forEach((el) => {
    for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
      const v = el.getAttribute(attr)
      if (v) out.push(`[${attr}] ${v}`)
    }
  })
  return out
}

/** Text left over after removing seed data that still has diacritics. */
function viLines(): string[] {
  return visibleStrings()
    .map(stripSeed)
    .filter((text) => VI_CHARS.test(text))
    .map((text) => text.trim().slice(0, 140))
}

async function settled() {
  await waitFor(() => {
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })
  await new Promise((resolve) => setTimeout(resolve, 30))
  await waitFor(() => {
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })
}

beforeEach(() => {
  resetMockDb()
  localStorage.clear()
  setLanguage('vi')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})
afterEach(() => {
  cleanup()
  resetMockDb()
  localStorage.clear()
  setLanguage('vi')
  vi.unstubAllGlobals()
})

type Route = { name: string; hash: string; vi: string; en: string }

const ROUTES: Route[] = [
  { name: 'Dashboard', hash: '#portal/customer', vi: 'Đơn hàng gần đây', en: 'Recent orders' },
  { name: 'Orders', hash: '#portal/customer/orders', vi: 'Đơn của tôi', en: 'My orders' },
  {
    name: 'OrderDetail',
    hash: '#portal/customer/orders/cus-ord-003',
    vi: 'Chi tiết đơn hàng',
    en: 'Order details',
  },
  {
    name: 'CreateOrder',
    hash: '#portal/customer/orders/new',
    vi: 'Chọn dịch vụ giám sát',
    en: 'Choose a monitoring service',
  },
  {
    name: 'Analysis',
    hash: '#portal/customer/orders/cus-ord-002/analysis',
    vi: 'Phân tích AI',
    en: 'AI analysis',
  },
  {
    name: 'Live',
    hash: '#portal/customer/orders/cus-ord-001/live',
    vi: 'Giám sát trực tiếp',
    en: 'Live monitoring',
  },
  { name: 'LiveHub', hash: '#portal/customer/live', vi: 'Xem trực tiếp', en: 'Live view' },
  {
    name: 'Media (order)',
    hash: '#portal/customer/orders/cus-ord-006/media',
    vi: 'Kết quả của đơn hàng',
    en: 'Order results',
  },
  {
    name: 'MediaLibrary',
    hash: '#portal/customer/media',
    vi: 'Thư viện kết quả',
    en: 'Result library',
  },
  {
    name: 'MissionHistory',
    hash: '#portal/customer/mission-history',
    vi: 'Lịch sử mission',
    en: 'Mission history',
  },
  {
    name: 'MissionHistoryDetail',
    hash: '#portal/customer/mission-history/msn-006-1',
    vi: 'Thông tin lần bay',
    en: 'Mission information',
  },
  {
    name: 'Notifications',
    hash: '#portal/customer/notifications',
    vi: 'Thông báo',
    en: 'Notifications',
  },
  { name: 'NotFound', hash: '#portal/customer/nope', vi: 'Không tìm thấy', en: 'Not found' },
]

/** Common English UI words that must not show up when the language is Vietnamese. */
const EN_UI_WORDS =
  /\b(the|and|your|please|loading|failed|retry|cancel|submit|error|view|details|back|next|previous|save|search|filter|status|order|orders|mission|missions|results|overview)\b/i
/** Product terms and data that legitimately stay in English inside Vietnamese copy. */
const EN_ALLOWED = ['mission', 'Mission', 'order', 'Order', 'Hue']

function enLines(): string[] {
  return visibleStrings()
    .map(stripSeed)
    .map((text) => EN_ALLOWED.reduce((acc, word) => acc.split(word).join(''), text))
    .filter((text) => !VI_CHARS.test(text) && EN_UI_WORDS.test(text))
    .map((text) => text.trim().slice(0, 140))
}

describe('Customer portal i18n (vi -> en)', () => {
  it.each(ROUTES)('$name has no Vietnamese left after switching to English', async (route) => {
    window.location.hash = route.hash
    render(<CustomerApp />)
    // Reverse check: in Vietnamese the main labels are Vietnamese.
    expect((await screen.findAllByText(route.vi, { exact: false })).length).toBeGreaterThan(0)
    await settled()

    act(() => setLanguage('en'))
    expect((await screen.findAllByText(route.en, { exact: false })).length).toBeGreaterThan(0)
    await settled()

    expect(viLines()).toEqual([])
  })

  it.each(ROUTES.filter((r) => r.name !== 'NotFound'))(
    '$name shows no English UI words in Vietnamese',
    async (route) => {
      window.location.hash = route.hash
      render(<CustomerApp />)
      expect((await screen.findAllByText(route.vi, { exact: false })).length).toBeGreaterThan(0)
      await settled()
      expect(enLines()).toEqual([])
    },
  )

  it('error states are localized', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockRejectedValue(new Error('boom'))
    window.location.hash = '#portal/customer/orders'
    render(<CustomerApp />)
    await screen.findAllByText('Đơn của tôi')
    await settled()
    act(() => setLanguage('en'))
    await screen.findAllByText('My orders')
    await settled()
    expect(viLines()).toEqual([])
  })

  it('CustomerApp shell (sidebar, chatbot) is English', async () => {
    window.location.hash = '#portal/customer'
    render(<CustomerApp />)
    await settled()
    act(() => setLanguage('en'))
    await settled()
    const chatbotToggle = document.querySelector('.odm-chatbot-fab, [class*="chatbot"] button')
    if (chatbotToggle) fireEvent.click(chatbotToggle)
    expect(viLines()).toEqual([])
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0)
  })

  it('CreateOrder wizard: every step is English', async () => {
    window.location.hash = '#portal/customer/orders/new'
    render(<CustomerApp />)
    act(() => setLanguage('en'))

    // Step 1: select a service and provide a title.
    fireEvent.click(await screen.findByRole('button', { name: /Construction monitoring/ }))
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Đơn kiểm thử' } })
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    await settled()
    expect(viLines()).toEqual([])

    // Step 2: the current service checklist is ready before moving to location.
    const locationNext = await screen.findByRole('button', { name: /Continue: Location & monitoring area/ })
    await waitFor(() => expect(locationNext).toBeEnabled())
    fireEvent.click(locationNext)

    // Step 3: location is now the active wizard step.
    fireEvent.change(await screen.findByLabelText(/Address\/area/), {
      target: { value: 'KCN Long Hậu' },
    })
    await settled()
    expect(viLines()).toEqual([])
    // The right-to-monitor declaration is required before moving on.
    fireEvent.change(screen.getByLabelText(/Contact person/), { target: { value: 'An' } })
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '0901234567' } })
    fireEvent.change(screen.getByLabelText(/Access conditions/), { target: { value: 'Main gate' } })
    fireEvent.click(screen.getByLabelText('Owner / Investor'))
    fireEvent.click(screen.getByLabelText(/I confirm that I am entitled/))
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    await screen.findByLabelText(/Preferred time window/)
    await settled()
    expect(viLines()).toEqual([])

    // Step 4: choose a time window to reach the deliverables/review step.
    const time = screen.getByLabelText(/Preferred time window/) as HTMLSelectElement
    await waitFor(() => expect(time.options.length).toBeGreaterThan(1))
    fireEvent.change(time, { target: { value: time.options[1].value } })
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    await screen.findByText('Result formats')
    await settled()
    expect(viLines()).toEqual([])

    // Step 5 and the confirmation dialog.
    fireEvent.click(screen.getByLabelText(/I confirm the monitoring purpose/))
    fireEvent.click(await screen.findByRole('button', { name: 'Submit request' }))
    await screen.findByRole('dialog')
    await settled()
    expect(viLines()).toEqual([])
  }, 15_000)

  it('CustomerCreateRequest (PortalLayout) is English', async () => {
    render(<CustomerCreateRequestPage />)
    expect(await screen.findByText('Tạo yêu cầu giám sát')).toBeInTheDocument()
    await settled()
    act(() => setLanguage('en'))
    expect(await screen.findByText('Create Monitoring Request')).toBeInTheDocument()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))
    await settled()
    expect(viLines()).toEqual([])
  })
})

/* ---------- Support pages reachable from the customer sidebar ---------- */

const TICKET: SupportTicketDto = {
  id: 'tk-1',
  ticketCode: 'TK-0001',
  customerId: 'u-1',
  customerName: 'Customer',
  orderId: 'cus-ord-003',
  missionId: 'msn-1',
  category: 'ORDERS',
  subject: 'Hỏi về lịch bay',
  description: 'Tôi có thể dời lịch bay không?',
  priority: 'HIGH',
  status: 'WAITING_FOR_CUSTOMER',
  assignedStaffName: 'Nguyễn Văn Hỗ Trợ',
  openedAt: '2026-09-20T08:00:00Z',
  messages: [
    {
      id: 'm-1',
      ticketId: 'tk-1',
      senderId: 'u-1',
      senderName: 'Customer',
      senderRole: 'CUSTOMER',
      content: 'Tôi có thể dời lịch bay không?',
      createdAt: '2026-09-20T08:00:00Z',
    },
    {
      id: 'm-2',
      ticketId: 'tk-1',
      senderId: 's-1',
      senderName: 'Nguyễn Văn Hỗ Trợ',
      senderRole: 'STAFF',
      content: 'Được, trước giờ bay tối đa hai tiếng.',
      attachmentUrl: 'https://example.com/a.png',
      createdAt: '2026-09-20T09:00:00Z',
    },
  ],
}

const SUPPORT_ROUTES = [
  {
    name: 'HelpCenterHome',
    hash: '#help',
    vi: 'Chúng tôi có thể hỗ trợ bạn như thế nào?',
    en: 'How can we help you?',
  },
  {
    name: 'CustomerTicketsList',
    hash: '#help/tickets',
    vi: 'Yêu cầu hỗ trợ của tôi',
    en: 'My support tickets',
  },
  {
    name: 'CustomerTicketDetail',
    hash: '#help/tickets/tk-1',
    vi: 'Lịch sử trao đổi',
    en: 'Conversation',
  },
]

describe('Support pages i18n (vi -> en)', () => {
  beforeEach(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock-customer-token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({ id: 'u-1', fullName: 'Customer', email: 'c@example.com', role: 'CUSTOMER' }),
    )
    vi.spyOn(supportApi, 'listTickets').mockResolvedValue([TICKET])
    vi.spyOn(supportApi, 'getTicketById').mockResolvedValue(TICKET)
    vi.spyOn(supportApi, 'getFaqArticles').mockResolvedValue([])
    vi.spyOn(supportApi, 'recordFaqFeedback').mockResolvedValue(undefined)
    vi.spyOn(supportApi, 'createTicket').mockResolvedValue({ ...TICKET, id: 'tk-2', ticketCode: 'TK-0002', status: 'OPEN' })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    window.location.hash = ''
  })

  it.each(SUPPORT_ROUTES)('$name has no Vietnamese left after switching to English', async (route) => {
    window.location.hash = route.hash
    render(<Router />)
    expect((await screen.findAllByText(route.vi, { exact: false })).length).toBeGreaterThan(0)
    await settled()
    expect(enLines()).toEqual([])

    act(() => setLanguage('en'))
    expect((await screen.findAllByText(route.en, { exact: false })).length).toBeGreaterThan(0)
    await settled()
    expect(viLines()).toEqual([])
  })

  it('help center: FAQ answers, feedback and empty search are English', async () => {
    window.location.hash = '#help'
    render(<Router />)
    await screen.findByText('Chúng tôi có thể hỗ trợ bạn như thế nào?')
    act(() => setLanguage('en'))
    fireEvent.click(await screen.findByRole('button', { name: /Why is my monitoring request still pending approval\?/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'No' }))
    await settled()
    expect(viLines()).toEqual([])

    fireEvent.change(screen.getByLabelText('Search for answers'), { target: { value: 'zzzzqqqq' } })
    expect(await screen.findByText('No articles found')).toBeInTheDocument()
    expect(viLines()).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Contact support' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await settled()
    expect(viLines()).toEqual([])
  })

  it('create ticket dialog: validation, options and success view are English', async () => {
    window.location.hash = '#help/tickets'
    render(<Router />)
    await screen.findAllByText('Yêu cầu hỗ trợ của tôi')
    act(() => setLanguage('en'))
    fireEvent.click(await screen.findByRole('button', { name: '+ New support ticket' }))
    await screen.findByRole('dialog')
    await settled()
    expect(viLines()).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Submit ticket' }))
    expect(await screen.findByText('Please enter a subject for your ticket.')).toBeInTheDocument()
    expect(viLines()).toEqual([])

    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'Need help' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit ticket' }))
    expect(await screen.findByText('Your support ticket has been created')).toBeInTheDocument()
    expect(viLines()).toEqual([])
  })

  it('ticket detail: reply failure and closed ticket notice are English', async () => {
    vi.spyOn(supportApi, 'addMessage').mockRejectedValue(new Error(''))
    window.location.hash = '#help/tickets/tk-1'
    render(<Router />)
    await screen.findByText('Lịch sử trao đổi')
    act(() => setLanguage('en'))
    fireEvent.change(await screen.findByLabelText('Your reply'), { target: { value: 'Thanks' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }))
    expect(await screen.findByText('Could not send your reply.')).toBeInTheDocument()
    expect(viLines()).toEqual([])

    vi.spyOn(supportApi, 'getTicketById').mockResolvedValue({ ...TICKET, status: 'RESOLVED' })
    cleanup()
    render(<Router />)
    expect(await screen.findByText(/This ticket is closed/)).toBeInTheDocument()
    expect(viLines()).toEqual([])
  })

  it('context help widget on order and mission pages is English', async () => {
    window.location.hash = '#portal/customer/orders/cus-ord-003'
    render(<CustomerApp />)
    await screen.findAllByText('Chi tiết đơn hàng', { exact: false })
    act(() => setLanguage('en'))
    fireEvent.click(await screen.findByRole('button', { name: /Why is my order still pending approval\?/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Create a ticket for/ }))
    await screen.findByRole('dialog')
    await settled()
    expect(viLines()).toEqual([])
  })
})
