import {
  collection,
  doc,
  getDocs,
  getDoc,
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
  private readonly ticketsCollection = collection(db, 'ticketGroups')
  private readonly ticketGroupsCollection = collection(db, 'ticketGroups')
  private readonly purchasesCollection = collection(db, 'purchases')

  /**
   * Get all tickets with optional filters
   */
  async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    try {
      const [ticketGroupsSnapshot, ticketsSnapshot] = await Promise.all([
        getDocs(query(this.ticketGroupsCollection, orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'tickets'), orderBy('createdAt', 'desc')))
      ]);

      const ticketsMap = new Map();
      ticketsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.paymentId) {
          ticketsMap.set(data.paymentId, {
            id: doc.id,
            ...data,
            purchaseDate: data.purchaseDate?.toDate() || data.createdAt?.toDate() || new Date(),
            usedDate: data.status === 'scanned' ? (data.scannedAt?.toDate() || new Date()) : undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        }
      });

      const ticketGroups = ticketGroupsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const ticketData = ticketsMap.get(data.paymentId);
        
        if (ticketData) {
          return {
            id: ticketData.id,
            eventId: ticketData.eventId || '',
            userId: ticketData.userId || '',
            inviteCode: ticketData.inviteCode || '',
            qrCode: ticketData.qrCode || '',
            status: ticketData.status === 'scanned' ? TicketStatus.SCANNED :
              ticketData.status === 'unscanned' ? TicketStatus.ACTIVE :
                ticketData.status === 'paid' ? TicketStatus.ACTIVE :
                  ticketData.status === 'confirmed' ? TicketStatus.ACTIVE :
                    TicketStatus.ACTIVE,
            purchaseDate: ticketData.purchaseDate,
            usedDate: ticketData.usedDate,
            price: ticketData.price || ticketData.amount || 0,
            currency: ticketData.currency || 'GBP',
            paymentIntentId: ticketData.paymentIntentId || ticketData.paymentId || '',
            paymentId: ticketData.paymentId || '',
            mainTicketId: ticketData.mainTicketId || '',
            groupName: ticketData.groupName || '',
            eventName: ticketData.eventName || '',
            eventDate: ticketData.eventDate?.toDate() || undefined,
            eventLocation: ticketData.eventLocation || '',
            createdAt: ticketData.createdAt,
            updatedAt: ticketData.updatedAt,
          } as Ticket;
        } else {
          return {
            id: doc.id,
            eventId: data.eventId || '',
            userId: data.pusherUserId || '',
            inviteCode: data.inviteCode || '',
            qrCode: data.qrCode || '',
            status: data.isScanned ? TicketStatus.SCANNED : TicketStatus.ACTIVE,
            purchaseDate: data.createdAt?.toDate() || new Date(),
            usedDate: data.scannedAt?.toDate() || undefined,
            price: 0,
            currency: 'GBP',
            paymentIntentId: data.paymentId || '',
            paymentId: data.paymentId || '',
            mainTicketId: data.mainTicketId || '',
            groupName: '',
            eventName: 'Unknown Event',
            eventDate: undefined,
            eventLocation: '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.createdAt?.toDate() || new Date(),
          } as Ticket;
        }
      });

      const ticketGroupPaymentIds = new Set(
        ticketGroupsSnapshot.docs.map((d) => (d.data() as any).paymentId).filter(Boolean)
      );

      const orphanTickets = ticketsSnapshot.docs
        .filter((t) => {
          const data: any = t.data();
          const pid = data.paymentId;
          return !pid || !ticketGroupPaymentIds.has(pid);
        })
        .map((t) => {
          const td: any = t.data();
          return {
            id: t.id,
            eventId: td.eventId || '',
            userId: td.userId || '',
            inviteCode: td.inviteCode || '',
            qrCode: td.qrCode || '',
            status: td.status === 'scanned' ? TicketStatus.SCANNED :
              td.status === 'unscanned' ? TicketStatus.ACTIVE :
                td.status === 'paid' ? TicketStatus.ACTIVE :
                  td.status === 'confirmed' ? TicketStatus.ACTIVE :
                    TicketStatus.ACTIVE,
            purchaseDate: td.purchaseDate?.toDate() || td.createdAt?.toDate() || new Date(),
            usedDate: td.status === 'scanned' ? (td.scannedAt?.toDate() || new Date()) : undefined,
            price: td.price || td.amount || 0,
            currency: (td.currency || 'GBP').toString().toUpperCase(),
            paymentIntentId: td.paymentIntentId || td.paymentId || '',
            paymentId: td.paymentId || '',
            mainTicketId: td.mainTicketId || '',
            groupName: td.groupName || '',
            eventName: td.eventName || '',
            eventDate: td.eventDate?.toDate() || undefined,
            eventLocation: td.eventLocation || '',
            createdAt: td.createdAt?.toDate() || new Date(),
            updatedAt: td.updatedAt?.toDate() || new Date(),
          } as Ticket;
        });

      let allTickets = [...ticketGroups, ...orphanTickets];

      if (filters?.status) {
        allTickets = allTickets.filter(ticket => ticket.status === filters.status);
      }

      if (filters?.eventId) {
        allTickets = allTickets.filter(ticket => ticket.eventId === filters.eventId);
      }

      if (filters?.userId) {
        allTickets = allTickets.filter(ticket => ticket.userId === filters.userId);
      }

      if (filters?.dateFrom) {
        allTickets = allTickets.filter(ticket => ticket.purchaseDate >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        allTickets = allTickets.filter(ticket => ticket.purchaseDate <= filters.dateTo!);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        allTickets = allTickets.filter(ticket =>
          ticket.inviteCode.toLowerCase().includes(searchLower) ||
          ticket.eventName?.toLowerCase().includes(searchLower) ||
          ticket.eventLocation?.toLowerCase().includes(searchLower) ||
          ticket.groupName?.toLowerCase().includes(searchLower)
        )
      }

      if (filters?.inviteCode) {
        allTickets = allTickets.filter(ticket =>
          ticket.inviteCode.toLowerCase().includes(filters.inviteCode!.toLowerCase())
        )
      }

      return allTickets;
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
          eventId: data.eventId || '',
          userId: data.userId || data.pusherUserId || '',
          inviteCode: data.inviteCode || '',
          qrCode: data.qrCode || '',
          status: data.status === 'active' ? TicketStatus.ACTIVE :
            data.status === 'used' ? TicketStatus.USED :
              data.status === 'cancelled' ? TicketStatus.CANCELLED :
                data.status === 'expired' ? TicketStatus.EXPIRED :
                  !data.status ? TicketStatus.ACTIVE :
                    TicketStatus.ACTIVE,
          purchaseDate: data.purchaseDate?.toDate() || data.createdAt?.toDate() || new Date(),
          usedDate: data.usedDate?.toDate() || undefined,
          price: data.price || 0,
          currency: data.currency || 'GBP',
          paymentIntentId: data.paymentIntentId || data.paymentId || '',
          paymentId: data.paymentId || '',
          mainTicketId: data.mainTicketId || '',
          groupName: data.groupName || '',
          eventName: data.eventName || '',
          eventDate: data.eventDate?.toDate() || undefined,
          eventLocation: data.eventLocation || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
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
          eventId: data.eventId || '',
          userId: data.userId || data.pusherUserId || '',
          inviteCode: data.inviteCode || '',
          qrCode: data.qrCode || '',
          status: data.status === 'active' ? TicketStatus.ACTIVE :
            data.status === 'used' ? TicketStatus.USED :
              data.status === 'cancelled' ? TicketStatus.CANCELLED :
                data.status === 'expired' ? TicketStatus.EXPIRED :
                  !data.status ? TicketStatus.ACTIVE :
                    TicketStatus.ACTIVE,
          purchaseDate: data.purchaseDate?.toDate() || data.createdAt?.toDate() || new Date(),
          usedDate: data.usedDate?.toDate() || undefined,
          price: data.price || 0,
          currency: data.currency || 'GBP',
          paymentIntentId: data.paymentIntentId || data.paymentId || '',
          paymentId: data.paymentId || '',
          mainTicketId: data.mainTicketId || '',
          groupName: data.groupName || '',
          eventName: data.eventName || '',
          eventDate: data.eventDate?.toDate() || undefined,
          eventLocation: data.eventLocation || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
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
      
      let docRef;
      let updateData: any = {
        updatedAt: Timestamp.fromDate(new Date()),
      };

      try {
        docRef = doc(this.ticketGroupsCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          if (status === TicketStatus.USED || status === TicketStatus.SCANNED) {
            updateData.isScanned = true;
            if (usedDate) {
              updateData.scannedAt = Timestamp.fromDate(usedDate);
            }
          } else if (status === TicketStatus.ACTIVE) {
            updateData.isScanned = false;
          }

          await updateDoc(docRef, updateData);
          
          const data = docSnap.data();
          if (data.paymentId) {
            try {
              const ticketQuery = query(collection(db, 'tickets'), where('paymentId', '==', data.paymentId));
              const ticketSnapshot = await getDocs(ticketQuery);
              if (!ticketSnapshot.empty) {
                const ticketDoc = ticketSnapshot.docs[0];
                const ticketUpdateData: any = {
                  updatedAt: Timestamp.fromDate(new Date()),
                };
                
                if (status === TicketStatus.USED || status === TicketStatus.SCANNED) {
                  ticketUpdateData.status = 'scanned';
                  if (usedDate) {
                    ticketUpdateData.scannedAt = Timestamp.fromDate(usedDate);
                  }
                } else if (status === TicketStatus.ACTIVE) {
                  ticketUpdateData.status = 'unscanned';
                }
                
                await updateDoc(doc(collection(db, 'tickets'), ticketDoc.id), ticketUpdateData);
              }
            } catch (error) {
              
            }
          }
          
          return;
        }
      } catch (error) {
        
      }

      try {
        docRef = doc(collection(db, 'tickets'), id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          if (status === TicketStatus.USED || status === TicketStatus.SCANNED) {
            updateData.status = 'scanned';
            if (usedDate) {
              updateData.scannedAt = Timestamp.fromDate(usedDate);
            }
          } else if (status === TicketStatus.ACTIVE) {
            updateData.status = 'unscanned';
          } else if (status === TicketStatus.CANCELLED) {
            updateData.status = 'cancelled';
          } else {
            updateData.status = status.toLowerCase();
          }

          try {
            await updateDoc(docRef, updateData);
          } catch (e) {
            
          }
          
          const data = docSnap.data();
          if (data.paymentId) {
            try {
              const ticketGroupQuery = query(this.ticketGroupsCollection, where('paymentId', '==', data.paymentId));
              const ticketGroupSnapshot = await getDocs(ticketGroupQuery);
              if (!ticketGroupSnapshot.empty) {
                const ticketGroupDoc = ticketGroupSnapshot.docs[0];
                const ticketGroupUpdateData: any = {
                  updatedAt: Timestamp.fromDate(new Date()),
                };
                
                if (status === TicketStatus.USED || status === TicketStatus.SCANNED) {
                  ticketGroupUpdateData.isScanned = true;
                  if (usedDate) {
                    ticketGroupUpdateData.scannedAt = Timestamp.fromDate(usedDate);
                  }
                } else if (status === TicketStatus.ACTIVE) {
                  ticketGroupUpdateData.isScanned = false;
                }
                
                await updateDoc(doc(this.ticketGroupsCollection, ticketGroupDoc.id), ticketGroupUpdateData);
              }
            } catch (error) {
              
            }
          }
          
          return;
        }
      } catch (error) {
        
      }

      throw new Error(`Ticket with ID ${id} not found in any collection`);

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
   * Restore cancelled ticket to active
   */
  async restoreTicket(id: string): Promise<void> {
    await this.updateTicketStatus(id, TicketStatus.ACTIVE)
  }

  /**
   * Restore used ticket to active
   */
  async restoreUsedTicket(id: string): Promise<void> {
    await this.updateTicketStatus(id, TicketStatus.ACTIVE)
  }

  /**
   * Delete ticket
   */
  async deleteTicket(id: string): Promise<void> {
    try {
      try {
        const docRef = doc(this.ticketGroupsCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          await deleteDoc(docRef);
          return;
        }
      } catch (error) {
      }

      try {
        const docRef = doc(collection(db, 'tickets'), id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          await deleteDoc(docRef);
          return;
        }
      } catch (error) {
      }

      throw new Error(`Ticket with ID ${id} not found in any collection`);

    } catch (error) {
      console.error('Error deleting ticket:', error)
      throw new Error('Failed to delete ticket')
    }
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
        usedTickets: tickets.filter(t => t.status === TicketStatus.USED || t.status === TicketStatus.SCANNED).length,
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
