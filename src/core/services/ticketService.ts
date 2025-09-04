import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/modules/firebase/config'
import { 
  Ticket, 
  TicketGroup, 
  Purchase, 
  TicketFilters, 
  TicketStats, 
  TicketStatus, 
  PurchaseStatus,
  QRCodeData 
} from '@/core/types/ticket'

export class TicketService {
  private readonly ticketsCollection = collection(db, 'tickets')
  private readonly ticketGroupsCollection = collection(db, 'ticketGroups')
  private readonly purchasesCollection = collection(db, 'purchases')

  /**
   * Get all tickets with optional filters
   */
  async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    try {
      let q = query(this.ticketsCollection, orderBy('purchaseDate', 'desc'))

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      if (filters?.eventId) {
        q = query(q, where('eventId', '==', filters.eventId))
      }

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId))
      }

      if (filters?.dateFrom) {
        q = query(q, where('purchaseDate', '>=', Timestamp.fromDate(filters.dateFrom)))
      }

      if (filters?.dateTo) {
        q = query(q, where('purchaseDate', '<=', Timestamp.fromDate(filters.dateTo)))
      }

      const snapshot = await getDocs(q)
      let tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchaseDate: doc.data().purchaseDate?.toDate() || doc.data().purchaseDate,
        usedDate: doc.data().usedDate?.toDate() || doc.data().usedDate,
        eventDate: doc.data().eventDate?.toDate() || doc.data().eventDate,
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
      })) as Ticket[]

      // Client-side filtering for search and invite code
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        tickets = tickets.filter(ticket => 
          ticket.inviteCode.toLowerCase().includes(searchLower) ||
          ticket.eventName?.toLowerCase().includes(searchLower) ||
          ticket.eventLocation?.toLowerCase().includes(searchLower) ||
          ticket.groupName?.toLowerCase().includes(searchLower)
        )
      }

      if (filters?.inviteCode) {
        tickets = tickets.filter(ticket => 
          ticket.inviteCode.toLowerCase().includes(filters.inviteCode!.toLowerCase())
        )
      }

      return tickets
    } catch (error) {
      console.error('Error getting tickets:', error)
      throw new Error('Failed to fetch tickets')
    }
  }

  /**
   * Get single ticket by ID
   */
  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const docRef = doc(this.ticketsCollection, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate() || data.purchaseDate,
          usedDate: data.usedDate?.toDate() || data.usedDate,
          eventDate: data.eventDate?.toDate() || data.eventDate,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
        } as Ticket
      }

      return null
    } catch (error) {
      console.error('Error getting ticket:', error)
      throw new Error('Failed to fetch ticket')
    }
  }

  /**
   * Get ticket by invite code
   */
  async getTicketByInviteCode(inviteCode: string): Promise<Ticket | null> {
    try {
      const q = query(this.ticketsCollection, where('inviteCode', '==', inviteCode))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate() || data.purchaseDate,
          usedDate: data.usedDate?.toDate() || data.usedDate,
          eventDate: data.eventDate?.toDate() || data.eventDate,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
        } as Ticket
      }

      return null
    } catch (error) {
      console.error('Error getting ticket by invite code:', error)
      throw new Error('Failed to fetch ticket')
    }
  }

  /**
   * Update ticket status (mark as used, cancelled, etc.)
   */
  async updateTicketStatus(id: string, status: TicketStatus, usedDate?: Date): Promise<void> {
    try {
      const docRef = doc(this.ticketsCollection, id)
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      }

      if (status === TicketStatus.USED && usedDate) {
        updateData.usedDate = Timestamp.fromDate(usedDate)
      }

      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error('Error updating ticket status:', error)
      throw new Error('Failed to update ticket status')
    }
  }

  /**
   * Mark ticket as used
   */
  async markTicketAsUsed(id: string): Promise<void> {
    await this.updateTicketStatus(id, TicketStatus.USED, new Date())
  }

  /**
   * Cancel ticket
   */
  async cancelTicket(id: string): Promise<void> {
    await this.updateTicketStatus(id, TicketStatus.CANCELLED)
  }

  /**
   * Get ticket groups
   */
  async getTicketGroups(filters?: { eventId?: string; userId?: string }): Promise<TicketGroup[]> {
    try {
      let q = query(this.ticketGroupsCollection, orderBy('purchaseDate', 'desc'))

      if (filters?.eventId) {
        q = query(q, where('eventId', '==', filters.eventId))
      }

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchaseDate: doc.data().purchaseDate?.toDate() || doc.data().purchaseDate,
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
      })) as TicketGroup[]
    } catch (error) {
      console.error('Error getting ticket groups:', error)
      throw new Error('Failed to fetch ticket groups')
    }
  }

  /**
   * Get purchases
   */
  async getPurchases(filters?: { eventId?: string; userId?: string; status?: PurchaseStatus }): Promise<Purchase[]> {
    try {
      let q = query(this.purchasesCollection, orderBy('createdAt', 'desc'))

      if (filters?.eventId) {
        q = query(q, where('eventId', '==', filters.eventId))
      }

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId))
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
      })) as Purchase[]
    } catch (error) {
      console.error('Error getting purchases:', error)
      throw new Error('Failed to fetch purchases')
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    try {
      const tickets = await this.getTickets()
      
      const stats: TicketStats = {
        totalTickets: tickets.length,
        activeTickets: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
        usedTickets: tickets.filter(t => t.status === TicketStatus.USED).length,
        cancelledTickets: tickets.filter(t => t.status === TicketStatus.CANCELLED).length,
        totalRevenue: tickets.reduce((sum, ticket) => sum + ticket.price, 0),
        averageTicketPrice: tickets.length > 0 
          ? tickets.reduce((sum, ticket) => sum + ticket.price, 0) / tickets.length 
          : 0,
        ticketsByEvent: tickets.reduce((acc, ticket) => {
          acc[ticket.eventId] = (acc[ticket.eventId] || 0) + 1
          return acc
        }, {} as { [eventId: string]: number }),
        ticketsByStatus: tickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1
          return acc
        }, {} as { [status: string]: number }),
      }

      return stats
    } catch (error) {
      console.error('Error getting ticket stats:', error)
      throw new Error('Failed to fetch ticket statistics')
    }
  }

  /**
   * Validate QR code data
   */
  validateQRCode(qrData: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrData) as QRCodeData
      
      // Validate required fields
      if (!data.ticketId || !data.inviteCode || !data.eventId || !data.userId) {
        return null
      }

      return data
    } catch (error) {
      console.error('Error validating QR code:', error)
      return null
    }
  }

  /**
   * Generate QR code data for ticket
   */
  generateQRCodeData(ticket: Ticket): QRCodeData {
    return {
      ticketId: ticket.id!,
      inviteCode: ticket.inviteCode,
      eventId: ticket.eventId,
      userId: ticket.userId,
      timestamp: Date.now(),
    }
  }
}

// Export singleton instance
export const ticketService = new TicketService()
