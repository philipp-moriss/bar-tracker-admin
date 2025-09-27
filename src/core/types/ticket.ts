import { Timestamp } from 'firebase/firestore'

export interface Ticket {
  id?: string
  eventId: string
  userId: string
  inviteCode: string
  qrCode?: string
  status: TicketStatus
  purchaseDate: Timestamp | Date
  usedDate?: Timestamp | Date
  price: number
  currency: string
  paymentIntentId?: string
  paymentId?: string
  mainTicketId?: string
  groupName?: string
  eventName?: string
  eventDate?: Timestamp | Date
  eventLocation?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export interface TicketGroup {
  id?: string
  eventId: string
  userId: string
  groupName: string
  ticketCount: number
  totalPrice: number
  currency: string
  status: TicketStatus
  tickets: Ticket[]
  purchaseDate: Timestamp | Date
  paymentIntentId?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export interface Purchase {
  id?: string
  paymentIntentId: string
  eventId: string
  userId: string
  amount: number
  currency: string
  status: PurchaseStatus
  ticketCount: number
  groupName?: string
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  SCANNED = 'scanned',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum PurchaseStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Ticket filters
export interface TicketFilters {
  status?: TicketStatus
  eventId?: string
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  inviteCode?: string
}

// Ticket statistics
export interface TicketStats {
  totalTickets: number
  activeTickets: number
  usedTickets: number
  cancelledTickets: number
  totalRevenue: number
  averageTicketPrice: number
  ticketsByEvent: { [eventId: string]: number }
  ticketsByStatus: { [status: string]: number }
}

// QR Code data structure
export interface QRCodeData {
  ticketId: string
  inviteCode: string
  eventId: string
  userId: string
  timestamp: number
}
