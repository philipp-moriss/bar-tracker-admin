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
  // Custom notification messages
  customReminderTitle?: string
  customReminderBody?: string
  customLeavingTitle?: string
  customLeavingBody?: string
  customMapConfirmMessage?: string
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
  startTime?: Timestamp | Date // Optional for recurring events
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
  // Recurring event fields
  isRecurring?: boolean // Whether this is a recurring event
  recurringTime?: string // Time for recurring events (e.g., "19:00")
  recurringDays?: number[] // Days of week for recurring events (0=Sunday, 1=Monday, etc.)
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
  startTime?: Date // Optional for recurring events
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
  // Recurring event fields
  isRecurring?: boolean // Whether this is a recurring event
  recurringTime?: string // Time for recurring events (e.g., "19:00")
  recurringDays?: number[] // Days of week for recurring events (0=Sunday, 1=Monday, etc.)
  // Status
  status?: EventStatus // Event status (DRAFT, ACTIVE, PERMANENT, etc.)
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
  DRAFT = 'draft',
  PERMANENT = 'permanent'
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
  permanentEvents: number
  totalRevenue: number
  averageRating: number
}
