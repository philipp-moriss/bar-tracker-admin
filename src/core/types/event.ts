import { Timestamp } from 'firebase/firestore'

// Event types based on mobile app structure
export interface Event {
  id?: string
  name: string
  price: string
  description: string
  imageURL: string
  rating?: number
  startLocation: {
    latitude: number
    longitude: number
  }
  startTime: Timestamp | Date
  country: string
  includedDescription: string
  startLocationName: string
  // Bar information embedded in event
  barName: string
  barAddress: string
  barCity: string
  barCountry: string
  barPhone?: string
  barEmail?: string
  barWebsite?: string
  status?: EventStatus
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  // Images
  images?: string[] // URLs of uploaded images
}

export interface CreateEventData {
  name: string
  price: string
  description: string
  imageURL: string
  startTime: Date
  country: string
  includedDescription: string
  startLocationName: string
  startLocation: {
    latitude: number
    longitude: number
  }
  // Bar information embedded in event
  barName: string
  barAddress: string
  barCity: string
  barCountry: string
  barPhone?: string
  barEmail?: string
  barWebsite?: string
  // Images
  images?: string[] // URLs of uploaded images
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string
}

export enum EventStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DRAFT = 'draft'
}

// Event filters
export interface EventFilters {
  status?: EventStatus
  country?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  sortBy?: 'startTime' | 'name' | 'price' | 'status' | 'createdAt' | 'startLocationName'
  sortDir?: 'asc' | 'desc'
}

// Event statistics
export interface EventStats {
  totalEvents: number
  activeEvents: number
  completedEvents: number
  cancelledEvents: number
  totalRevenue: number
  averageRating: number
}
