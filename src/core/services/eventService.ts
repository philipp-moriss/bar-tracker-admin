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
import { Event, CreateEventData, UpdateEventData, EventFilters, EventStats, EventStatus } from '@/core/types/event'

export class EventService {
  private readonly eventsCollection = collection(db, 'events')

  /**
   * Get all events with optional filters
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    try {
      let q = query(this.eventsCollection, orderBy('startTime', 'desc'))

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }

      if (filters?.country) {
        q = query(q, where('country', '==', filters.country))
      }

      if (filters?.dateFrom) {
        q = query(q, where('startTime', '>=', Timestamp.fromDate(filters.dateFrom)))
      }

      if (filters?.dateTo) {
        q = query(q, where('startTime', '<=', Timestamp.fromDate(filters.dateTo)))
      }

      const snapshot = await getDocs(q)
      let events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || doc.data().startTime,
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
      })) as Event[]

      // Client-side filtering for search
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        events = events.filter(event => 
          event.name.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.startLocationName.toLowerCase().includes(searchLower)
        )
      }

      return events
    } catch (error) {
      console.error('Error getting events:', error)
      throw new Error('Failed to fetch events')
    }
  }

  /**
   * Get single event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    try {
      const docRef = doc(this.eventsCollection, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          startTime: data.startTime?.toDate() || data.startTime,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
        } as Event
      }

      return null
    } catch (error) {
      console.error('Error getting event:', error)
      throw new Error('Failed to fetch event')
    }
  }

  /**
   * Create new event
   */
  async createEvent(eventData: CreateEventData): Promise<Event> {
    try {
      const now = new Date()
      const eventToCreate = {
        ...eventData,
        startTime: Timestamp.fromDate(eventData.startTime),
        status: EventStatus.ACTIVE,
        rating: 0,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      }

      const docRef = await addDoc(this.eventsCollection, eventToCreate)
      
      return {
        id: docRef.id,
        ...eventData,
        status: EventStatus.ACTIVE,
        rating: 0,
        createdAt: now,
        updatedAt: now,
      }
    } catch (error) {
      console.error('Error creating event:', error)
      throw new Error('Failed to create event')
    }
  }

  /**
   * Update existing event
   */
  async updateEvent(eventData: UpdateEventData): Promise<void> {
    try {
      const { id, ...updateData } = eventData
      const docRef = doc(this.eventsCollection, id)

      const updatePayload: any = {
        ...updateData,
        updatedAt: Timestamp.fromDate(new Date()),
      }

      // Convert Date to Timestamp if present
      if (updateData.startTime) {
        updatePayload.startTime = Timestamp.fromDate(updateData.startTime)
      }

      await updateDoc(docRef, updatePayload)
    } catch (error) {
      console.error('Error updating event:', error)
      throw new Error('Failed to update event')
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      const docRef = doc(this.eventsCollection, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting event:', error)
      throw new Error('Failed to delete event')
    }
  }

  /**
   * Update event status
   */
  async updateEventStatus(id: string, status: EventStatus): Promise<void> {
    try {
      const docRef = doc(this.eventsCollection, id)
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      })
    } catch (error) {
      console.error('Error updating event status:', error)
      throw new Error('Failed to update event status')
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<EventStats> {
    try {
      const events = await this.getEvents()
      
      const stats: EventStats = {
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === EventStatus.ACTIVE).length,
        completedEvents: events.filter(e => e.status === EventStatus.COMPLETED).length,
        cancelledEvents: events.filter(e => e.status === EventStatus.CANCELLED).length,
        totalRevenue: events.reduce((sum, event) => sum + parseFloat(event.price || '0'), 0),
        averageRating: events.length > 0 
          ? events.reduce((sum, event) => sum + (event.rating || 0), 0) / events.length 
          : 0,
      }

      return stats
    } catch (error) {
      console.error('Error getting event stats:', error)
      throw new Error('Failed to fetch event statistics')
    }
  }
}

// Export singleton instance
export const eventService = new EventService()
