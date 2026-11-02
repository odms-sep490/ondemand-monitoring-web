import { apiRequest } from '../../../shared/api/httpClient'

export type TicketResultReviewResponse = {
  ticketId: string
  ticketCode: string
  orderId: string
  reviewRoundId: string
  roundNumber: number
  roundVersion: number
  publishedAt: string
  generalNote: string | null
  submittedAt: string
  items: {
    roundItemId: string
    orderChecklistItemId: string
    title: string
    description: string | null
    executionSteps: string[]
    inputRequirements: string[]
    expectedOutputs: string[]
    missionId: string | null
    missionCode: string | null
    reasonCode:
      | 'MISSING_EVIDENCE'
      | 'POOR_QUALITY'
      | 'WRONG_LOCATION'
      | 'REQUIREMENT_NOT_MET'
      | 'OTHER'
    note: string
    roundEvidenceIds: string[]
    evidence: {
      roundEvidenceId: string
      mediaAssetId: string
      type: string
      fileName: string
      size: number
      capturedAt: string | null
      url: string | null
      urlExpiresAt: string | null
      downloadable: boolean
      accessReason: 'RETENTION_EXPIRED' | 'MEDIA_UNAVAILABLE' | null
    }[]
  }[]
}

export type SupportTicketDto = {
  id: string
  ticketCode: string
  customerId: string
  customerName: string
  orderId?: string
  missionId?: string
  category: string
  subject: string
  description?: string
  priority: 'NORMAL' | 'HIGH' | 'URGENT'
  status:
    | 'OPEN'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'WAITING_FOR_CUSTOMER'
    | 'WAITING_FOR_STAFF'
    | 'RESOLVED'
    | 'CLOSED'
    | 'CANCELLED'
  assignedStaffId?: string
  assignedStaffName?: string
  openedAt: string
  resolvedAt?: string
  resolutionNotes?: string
  messages?: SupportMessageDto[]
}

export type SupportMessageDto = {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'SYSTEM'
  content: string
  attachmentUrl?: string
  createdAt: string
}

export type CreateSupportTicketRequest = {
  customerId?: string
  customerName?: string
  orderId?: string
  missionId?: string
  category: string
  subject: string
  description?: string
  priority?: 'NORMAL' | 'HIGH' | 'URGENT'
  attachmentUrl?: string
}

export type AddMessageRequest = {
  senderId?: string
  senderName?: string
  senderRole?: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'SYSTEM'
  content: string
  attachmentUrl?: string
}

export type UpdateTicketStatusRequest = {
  status?: string
  assignedStaffId?: string
  assignedStaffName?: string
  priority?: string
  resolutionNotes?: string
}

export type StaffAgent = {
  id: string
  fullName: string
}

export type FaqFeedbackRequest = {
  articleId: string
  articleQuestion?: string
  articleCategory?: string
  customerId?: string
  isHelpful?: boolean
}

export type TopFaqDto = {
  articleId: string
  articleQuestion: string
  votesCount: number
}

export type SupportAnalyticsDto = {
  totalHelpfulVotes: number
  totalTickets: number
  deflectionRate: number
  avgResponseTimeMins: number
  slaComplianceRate: number
  topHelpfulArticles: TopFaqDto[]
  categoryBreakdown: Record<string, number>
}

export type FaqArticleBackendDto = {
  id: string
  articleId: string
  category:
    'ORDERS' | 'MISSIONS' | 'RESULTS' | 'MEDIA' | 'SCHEDULING' | 'ACCOUNT'
  categoryLabel: string
  question: string
  answer: string
  keywords: string[]
}

export const supportApi = {
  getResultReview: async (
    ticketId: string,
    signal?: AbortSignal,
  ): Promise<TicketResultReviewResponse> =>
    apiRequest<TicketResultReviewResponse>(
      `/api/support/tickets/${encodeURIComponent(ticketId)}/result-review`,
      { signal },
    ),
  listTickets: async (
    customerId?: string,
    status?: string,
    signal?: AbortSignal,
  ): Promise<SupportTicketDto[]> => {
    const params = new URLSearchParams()
    if (customerId) params.append('customerId', customerId)
    if (status) params.append('status', status)
    const queryStr = params.toString()
    return apiRequest<SupportTicketDto[]>(
      `/api/support-tickets${queryStr ? '?' + queryStr : ''}`,
      { signal },
    )
  },

  getTicketById: async (
    id: string,
    signal?: AbortSignal,
  ): Promise<SupportTicketDto> => {
    return apiRequest<SupportTicketDto>(`/api/support-tickets/${id}`, {
      signal,
    })
  },

  createTicket: async (
    req: CreateSupportTicketRequest,
  ): Promise<SupportTicketDto> => {
    return apiRequest<SupportTicketDto>('/api/support-tickets', {
      method: 'POST',
      body: req,
    })
  },

  addMessage: async (
    id: string,
    req: AddMessageRequest,
  ): Promise<SupportMessageDto> => {
    return apiRequest<SupportMessageDto>(
      `/api/support-tickets/${id}/messages`,
      { method: 'POST', body: req },
    )
  },

  updateTicketStatus: async (
    id: string,
    req: UpdateTicketStatusRequest,
  ): Promise<SupportTicketDto> => {
    return apiRequest<SupportTicketDto>(`/api/support-tickets/${id}/status`, {
      method: 'PATCH',
      body: req,
    })
  },

  getStaffAgents: async (signal?: AbortSignal): Promise<StaffAgent[]> => {
    return apiRequest<StaffAgent[]>('/api/support-tickets/staff-agents', {
      signal,
    })
  },

  recordFaqFeedback: async (req: FaqFeedbackRequest): Promise<void> => {
    return apiRequest<void>('/api/support-tickets/faq-feedback', {
      method: 'POST',
      body: req,
    })
  },

  getAnalytics: async (signal?: AbortSignal): Promise<SupportAnalyticsDto> => {
    return apiRequest<SupportAnalyticsDto>('/api/support-tickets/analytics', {
      signal,
    })
  },

  getFaqArticles: async (
    category?: string,
    search?: string,
    signal?: AbortSignal,
  ): Promise<FaqArticleBackendDto[]> => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (search) params.append('search', search)
    const queryStr = params.toString()
    return apiRequest<FaqArticleBackendDto[]>(
      `/api/support-tickets/faq-articles${queryStr ? '?' + queryStr : ''}`,
      { signal },
    )
  },
}
