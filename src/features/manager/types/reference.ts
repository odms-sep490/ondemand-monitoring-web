export type ServiceResponse = {
  id: string
  name: string
  description: string
  basePrice: number
  imageUrl?: string | null
  fallbackImageUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PreferredTimeResponse = {
  id: string
  code: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
  name: string
  startTime: string
  endTime: string
}

export type CategoryServiceResponse = {
  id: string
  name: string
  description: string
}

export type CategoryServiceRequest = {
  name: string
  description: string
}

export type DeliverableTypeResponse = {
  id: string
  name: string
  description: string
  defaultFormat: string
  createdAt: string
  updatedAt: string
}

export type DeliverableTypeRequest = {
  name: string
  description: string
  defaultFormat: string
}

export type ServiceRequest = {
  name: string
  description: string
  basePrice: number
  isActive: boolean
}

export type PreferredTimeCreateRequest = {
  code: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
  name: string
  startTime: string
  endTime: string
}

export type PreferredTimeUpdateRequest = PreferredTimeCreateRequest

export type ServiceDeliverableResponse = {
  id: string
  serviceId: string
  serviceName: string
  deliverableTypeId: string
  deliverableTypeName: string
  createdAt: string
}

export type ServiceDeliverableRequest = {
  serviceId: string
  deliverableTypeId: string
}
