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
  Timestamp
} from 'firebase/firestore'
import { db } from '@/modules/firebase/config'
import { Event, CreateEventData, UpdateEventData, EventFilters, EventStats, EventStatus } from '@/core/types/event'

const eventsCollection = collection(db, 'events')

/**
 * Get all events with optional filters
 */
async function getEvents(filters?: EventFilters): Promise<Event[]> {
  try {
    let q = query(eventsCollection)

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
      events = events.filter(event => {
        const name = (event.name || '').toLowerCase()
        const description = (event.description || '').toLowerCase()
        const locationName = (event.startLocationName || '').toLowerCase()
        return (
          name.includes(searchLower) ||
          description.includes(searchLower) ||
          locationName.includes(searchLower)
        )
      })
    }

    // Client-side sorting
    if (filters?.sortBy) {
      const dir = filters.sortDir === 'asc' ? 1 : -1
      const field = filters.sortBy
      events.sort((a: any, b: any) => {
        const av = a[field]
        const bv = b[field]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (typeof av === 'string' && typeof bv === 'string') {
          return av.localeCompare(bv) * dir
        }
        return (av > bv ? 1 : av < bv ? -1 : 0) * dir
      })
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
async function getEventById(id: string): Promise<Event | null> {
  try {
    const docRef = doc(eventsCollection, id)
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
async function createEvent(eventData: CreateEventData): Promise<Event> {
  try {
    const now = new Date()
    // Remove undefined values deeply (objects/arrays)
    const removeUndefinedDeep = (input: any): any => {
      if (Array.isArray(input)) {
        return input
          .map(removeUndefinedDeep)
          .filter((v) => v !== undefined)
      }
      if (input && typeof input === 'object') {
        const out: Record<string, any> = {}
        Object.entries(input).forEach(([k, v]) => {
          const cleaned = removeUndefinedDeep(v)
          if (cleaned !== undefined) out[k] = cleaned
        })
        return out
      }
      return input === undefined ? undefined : input
    }

    const sanitized = removeUndefinedDeep(eventData)

    const eventToCreate = {
      ...sanitized,
      startTime: Timestamp.fromDate(eventData.startTime),
      status: EventStatus.ACTIVE,
      rating: 0,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    }

    const docRef = await addDoc(eventsCollection, eventToCreate)

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
async function updateEvent(eventData: UpdateEventData): Promise<void> {
  try {
    const { id, ...updateData } = eventData
    const docRef = doc(eventsCollection, id)

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
async function deleteEvent(id: string): Promise<void> {
  try {
    const docRef = doc(eventsCollection, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting event:', error)
    throw new Error('Failed to delete event')
  }
}

/**
 * Update event status
 */
async function updateEventStatus(id: string, status: EventStatus): Promise<void> {
  try {
    const docRef = doc(eventsCollection, id)
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
async function getEventStats(): Promise<EventStats> {
  try {
    const events = await getEvents()

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

/**
 * Auto-complete expired events (client-side check using local time)
 */
async function autoCompleteExpiredEvents(): Promise<number> {
  try {
    const events = await getEvents({ status: EventStatus.ACTIVE })
    // Используем локальное время компьютера
    const now = new Date()
    let count = 0

    console.log(`Checking expired events at local time: ${now.toLocaleString()}`)

    for (const event of events) {
      if (event.id && event.startTime) {
        // Определяем время окончания события
        let eventEndTime: Date
        const eventStartTime = event.startTime instanceof Date ? event.startTime : event.startTime.toDate()

        if (event.endTime) {
          // Если есть конкретное время окончания, используем его
          eventEndTime = event.endTime instanceof Date ? event.endTime : event.endTime.toDate()
        } else if (event.route?.totalDuration) {
          // Если есть общая продолжительность маршрута, используем её (в минутах)
          eventEndTime = new Date(eventStartTime.getTime() + event.route.totalDuration * 60 * 1000)
        } else {
          // Если нет времени окончания и продолжительности, добавляем 3 часа к времени начала (по умолчанию)
          eventEndTime = new Date(eventStartTime.getTime() + 3 * 60 * 60 * 1000) // +3 часа
        }

        const duration = event.route?.totalDuration ? `${event.route.totalDuration} мин` : '3 часа (по умолчанию)'
        console.log(`Event "${event.name}": startTime=${eventStartTime.toLocaleString()}, duration=${duration}, endTime=${eventEndTime.toLocaleString()}, now=${now.toLocaleString()}, expired=${eventEndTime < now}`)

        // Событие завершено, если время окончания прошло
        if (eventEndTime < now) {
          console.log(`Completing expired event: ${event.name}`)
          await updateEventStatus(event.id, EventStatus.COMPLETED)
          count++
        }
      }
    }

    console.log(`Completed ${count} expired events`)
    return count
  } catch (error) {
    console.error('Error auto-completing expired events:', error)
    throw new Error('Failed to auto-complete expired events')
  }
}

export const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventStats,
  autoCompleteExpiredEvents,
} as const
