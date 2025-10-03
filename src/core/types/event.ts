import { Timestamp } from 'firebase/firestore'

export interface EventLocation {
  id: string
  name: string
  address: string
  coordinates: {
    latitude: number
    longitude: number
  }
  order: number
  stayDuration: number
  description?: string
  barName?: string
  barAddress?: string
  barPhone?: string
  barEmail?: string
}

export interface EventRoute {
  locations: EventLocation[]
  totalDuration: number
  isActive: boolean
}

export interface EventNotificationSettings {
  startReminder: number
  locationReminders: number
  arrivalNotifications: boolean
  departureNotifications: boolean
}

// Event types based on mobile app structure
export interface Event {
  id?: string
  name: string
  price: string
  currency: string
  description: string
  imageURL: string
  rating?: number
  startLocation: {
    latitude: number
    longitude: number
  }
  startTime: Timestamp | Date
  endTime?: Timestamp | Date
  country: string
  timezone?: string // e.g., 'Europe/Warsaw', 'Europe/London'
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
  // Bartender assignment
  assignedBartenders?: string[] // Array of bartender user IDs assigned to this event
  status?: EventStatus
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  // Images
  images?: string[] // URLs of uploaded images
  route?: EventRoute
  notificationSettings?: EventNotificationSettings
}

export interface CreateEventData {
  name: string
  price: string
  currency: string
  description: string
  imageURL: string
  startTime: Date
  endTime?: Date
  country: string
  timezone?: string // e.g., 'Europe/Warsaw', 'Europe/London'
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
  // Bartender assignment
  assignedBartenders?: string[] // Array of bartender user IDs assigned to this event
  // Images
  images?: string[] // URLs of uploaded images
  route?: EventRoute
  notificationSettings?: EventNotificationSettings
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string
  status?: EventStatus
  assignedBartenders?: string[] // Array of bartender user IDs assigned to this event
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
