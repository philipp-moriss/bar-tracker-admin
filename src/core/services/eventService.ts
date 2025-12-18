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
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/modules/firebase/config'
import { Event, CreateEventData, UpdateEventData, EventFilters, EventStats, EventStatus } from '@/core/types/event'

const eventsCollection = collection(db, 'events')
const notificationSchedulesCollection = collection(db, 'notificationSchedules')

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
    console.log('🔵 createEvent: Starting event creation...')
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
    console.log('🔵 createEvent: Data sanitized')

    const eventToCreate = {
      ...sanitized,
      ...(eventData.startTime ? { startTime: Timestamp.fromDate(eventData.startTime) } : {}),
      status: eventData.status || (eventData.isRecurring ? EventStatus.PERMANENT : EventStatus.ACTIVE),
      rating: 0,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    }

    console.log('🔵 createEvent: Adding document to Firestore...')
    const docRef = await addDoc(eventsCollection, eventToCreate)
    console.log('🟢 createEvent: Document added successfully with ID:', docRef.id)

    // Create automatic location change notifications if event has route
    if (eventData.route?.locations && eventData.route.locations.length > 1) {
      try {
        await createLocationChangeNotifications(docRef.id, eventData);
      } catch (error) {
        console.error('Error creating location change notifications:', error);
        // Don't fail event creation if notifications fail
      }
    }

    return {
      id: docRef.id,
      ...eventData,
      status: eventData.status || (eventData.isRecurring ? EventStatus.PERMANENT : EventStatus.ACTIVE),
      rating: 0,
      createdAt: now,
      updatedAt: now,
    }
  } catch (error: any) {
    console.error('🔴 createEvent: Error creating event:', error)
    console.error('🔴 createEvent: Error details:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    })
    throw new Error(`Failed to create event: ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Update existing event
 */
async function updateEvent(eventData: UpdateEventData): Promise<void> {
  try {
    console.log('🟡 updateEvent: Starting update for event ID:', eventData.id)
    console.log('🟡 updateEvent: Called from:', new Error().stack?.split('\n')[2]) // Показываем откуда вызвана

    const { id, ...updateData } = eventData

    if (!id) {
      throw new Error('Event ID is required for update')
    }

    const docRef = doc(eventsCollection, id)

    // Deep clean undefined values from objects and arrays
    const cleanUndefined = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => cleanUndefined(item)).filter(item => item !== undefined);
      }
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, cleanUndefined(value)])
        );
      }
      return obj;
    };

    // Filter out undefined values (but keep empty arrays and null)
    const filteredData = cleanUndefined(updateData)

    const updatePayload: any = {
      ...filteredData,
      updatedAt: Timestamp.fromDate(new Date()),
    }

    // Convert Date to Timestamp if present
    if (updatePayload.startTime) {
      updatePayload.startTime = Timestamp.fromDate(updatePayload.startTime)
    }

    console.log('🟡 updateEvent: Payload prepared, updating Firestore...');
    console.log('📦 updateEvent: assignedBartenders:', updatePayload.assignedBartenders);

    await updateDoc(docRef, updatePayload)

    // Recreate location change notifications if route or notification settings changed
    if (updatePayload.route || updatePayload.notificationSettings || updatePayload.startTime) {
      try {
        // Get updated event data
        const updatedEventDoc = await getDoc(docRef);
        if (updatedEventDoc.exists()) {
          const updatedEvent = { id: updatedEventDoc.id, ...updatedEventDoc.data() } as Event;
          await createLocationChangeNotifications(id, updatedEvent);
        }
      } catch (error) {
        console.error('Error updating location change notifications:', error);
        // Don't fail event update if notifications fail
      }
    }

    console.log('🟢 updateEvent: Event updated successfully');
  } catch (error: any) {
    console.error('🔴 updateEvent: Error updating event:', error)
    console.error('🔴 updateEvent: Error details:', {
      code: error?.code,
      message: error?.message,
      eventId: eventData.id
    })
    throw new Error(`Failed to update event: ${error?.message || 'Unknown error'}`)
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
      permanentEvents: events.filter(e => e.status === EventStatus.PERMANENT).length,
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
 * Create automatic location change notifications for event route
 */
async function createLocationChangeNotifications(eventId: string, event: Event | CreateEventData): Promise<void> {
  try {
    // Check if event has route and notification settings
    if (!event.route?.locations || event.route.locations.length < 2) {
      return; // No route or only one location - no notifications needed
    }

    if (!event.notificationSettings?.locationReminders) {
      return; // No location reminders configured
    }

    if (!event.startTime) {
      return; // No start time - can't calculate location times
    }

    const startTime = event.startTime instanceof Date 
      ? event.startTime 
      : (event.startTime as any)?.toDate?.() || new Date(event.startTime);

    // Delete old location change notifications for this event
    const oldNotificationsQuery = query(
      notificationSchedulesCollection,
      where('eventId', '==', eventId),
      where('type', '==', 'location_change')
    );
    const oldNotifications = await getDocs(oldNotificationsQuery);
    const batch = writeBatch(db);
    oldNotifications.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Calculate timing for each location
    const locations = event.route.locations;
    const locationReminders = event.notificationSettings.locationReminders;
    const customLeavingTitle = event.notificationSettings.customLeavingTitle || 'Time to move!';
    const customLeavingBody = event.notificationSettings.customLeavingBody || 'We are moving to the next location.';

    // Create notifications for each location (except first one)
    for (let i = 1; i < locations.length; i++) {
      const location = locations[i];
      const previousLocation = locations[i - 1];

      // Calculate start time for this location
      const locationStartTime = new Date(startTime);
      for (let j = 0; j < i; j++) {
        locationStartTime.setMinutes(locationStartTime.getMinutes() + locations[j].stayDuration);
      }

      // Calculate notification time (locationReminders minutes before location starts)
      const notificationTime = new Date(locationStartTime);
      notificationTime.setMinutes(notificationTime.getMinutes() - locationReminders);

      // Skip if notification time is in the past
      if (notificationTime.getTime() <= Date.now()) {
        continue;
      }

      // Build map URL from coordinates
      const mapUrl = `${location.coordinates.latitude},${location.coordinates.longitude}`;

      // Create notification
      const notification = {
        eventId,
        title: customLeavingTitle,
        body: customLeavingBody,
        mapUrl,
        fireDate: Timestamp.fromDate(notificationTime),
        audienceUserIds: [], // Empty - system will find users by eventId
        sent: false,
        type: 'location_change',
        locationIndex: i,
        locationId: location.id,
        createdAt: Timestamp.now()
      };

      await addDoc(notificationSchedulesCollection, notification);
    }
  } catch (error) {
    console.error('Error creating location change notifications:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Auto-complete expired events (client-side check using local time)
 */
async function autoCompleteExpiredEvents(): Promise<number> {
  try {
    const events = await getEvents({ status: EventStatus.ACTIVE })
    const now = new Date()
    let count = 0

    console.log(`Checking expired events at local time: ${now.toLocaleString()}`)

    for (const event of events) {
      if (event.id && event.startTime) {
        let eventEndTime: Date
        const eventStartTime = event.startTime instanceof Date ? event.startTime : event.startTime.toDate()

        // Умная логика определения времени окончания по времени начала
        const hour = eventStartTime.getHours()
        let defaultDuration = 3 // по умолчанию 3 часа

        if (hour >= 18 && hour <= 22) defaultDuration = 4 // вечерние события (18:00-22:00) = 4 часа
        if (hour >= 10 && hour <= 17) defaultDuration = 3 // дневные события (10:00-17:00) = 3 часа  
        if (hour >= 23 || hour <= 6) defaultDuration = 6  // ночные события = 6 часов

        if (event.route?.totalDuration) {
          eventEndTime = new Date(eventStartTime.getTime() + event.route.totalDuration * 60 * 1000)
        } else {
          eventEndTime = new Date(eventStartTime.getTime() + defaultDuration * 60 * 60 * 1000)
        }

        const duration = event.route?.totalDuration ? `${event.route.totalDuration} min` : `${defaultDuration} hours (smart default)`
        console.log(`Event "${event.name}": startTime=${eventStartTime.toLocaleString()}, duration=${duration}, endTime=${eventEndTime.toLocaleString()}, now=${now.toLocaleString()}, expired=${eventEndTime < now}`)

        if (eventEndTime < now && event.status === EventStatus.ACTIVE) {
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
