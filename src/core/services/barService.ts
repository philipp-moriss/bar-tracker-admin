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
    Bar,
    CreateBarData,
    UpdateBarData,
    BarFilters,
    BarStats
} from '@/core/types/bar'

export class BarService {
    private readonly barsCollection = collection(db, 'bars')

    // Remove undefined values to satisfy Firestore constraints
    private sanitizeForFirestore<T extends Record<string, any>>(data: T): T {
        const sanitized: Record<string, any> = {}
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) sanitized[key] = value
        }
        return sanitized as T
    }

    // Helper function to safely get date from Firestore timestamp or Date
    private getDate(date: any): Date {
        if (!date) return new Date(0) // Default to epoch if no date
        return date instanceof Date ? date : date.toDate()
    }

    /**
     * Get all bars with optional filters
     */
    async getBars(filters: BarFilters = {}): Promise<Bar[]> {
        try {
            let q = query(this.barsCollection)

            // Apply filters
            if (filters.city) {
                q = query(q, where('city', '==', filters.city))
            }
            if (filters.country) {
                q = query(q, where('country', '==', filters.country))
            }
            if (filters.isActive !== undefined) {
                q = query(q, where('isActive', '==', filters.isActive))
            }

            // Order by name (now supported by index)
            q = query(q, orderBy('name'))

            const snapshot = await getDocs(q)
            let bars = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: this.getDate(doc.data().createdAt),
                updatedAt: this.getDate(doc.data().updatedAt),
            })) as Bar[]

            // Apply search filter client-side (for text search)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                bars = bars.filter(bar =>
                    bar.name.toLowerCase().includes(searchTerm) ||
                    bar.city.toLowerCase().includes(searchTerm) ||
                    bar.country.toLowerCase().includes(searchTerm) ||
                    bar.address.toLowerCase().includes(searchTerm)
                )
            }

            return bars
        } catch (error) {
            console.error('Error getting bars:', error)
            throw new Error('Failed to fetch bars')
        }
    }

    /**
     * Get single bar by ID
     */
    async getBarById(id: string): Promise<Bar | null> {
        try {
            const docRef = doc(this.barsCollection, id)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data = docSnap.data()
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: this.getDate(data.createdAt),
                    updatedAt: this.getDate(data.updatedAt),
                } as Bar
            }

            return null
        } catch (error) {
            console.error('Error getting bar:', error)
            throw new Error('Failed to fetch bar')
        }
    }

    /**
     * Create new bar
     */
    async createBar(barData: CreateBarData): Promise<string> {
        try {
            const newBar = {
                ...barData,
                isActive: barData.isActive ?? true,
                totalEvents: 0,
                totalRevenue: 0,
                averageRating: 0,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
            }

            const sanitizedData = this.sanitizeForFirestore(newBar)
            const docRef = await addDoc(this.barsCollection, sanitizedData)
            return docRef.id
        } catch (error) {
            console.error('Error creating bar:', error)
            throw new Error('Failed to create bar')
        }
    }

    /**
     * Update existing bar
     */
    async updateBar(id: string, barData: UpdateBarData): Promise<void> {
        try {
            const docRef = doc(this.barsCollection, id)
            const updateData = {
                ...barData,
                updatedAt: Timestamp.fromDate(new Date()),
            }

            const sanitizedData = this.sanitizeForFirestore(updateData)
            await updateDoc(docRef, sanitizedData)
        } catch (error) {
            console.error('Error updating bar:', error)
            throw new Error('Failed to update bar')
        }
    }

    /**
     * Delete bar
     */
    async deleteBar(id: string): Promise<void> {
        try {
            const docRef = doc(this.barsCollection, id)
            await deleteDoc(docRef)
        } catch (error) {
            console.error('Error deleting bar:', error)
            throw new Error('Failed to delete bar')
        }
    }

    /**
     * Get bar statistics
     */
    async getBarStats(): Promise<BarStats> {
        try {
            const bars = await this.getBars()

            const stats: BarStats = {
                totalBars: bars.length,
                activeBars: bars.filter(bar => bar.isActive).length,
                inactiveBars: bars.filter(bar => !bar.isActive).length,
                barsByCountry: {},
                barsByCity: {},
                totalEvents: bars.reduce((sum, bar) => sum + (bar.totalEvents || 0), 0),
                totalRevenue: bars.reduce((sum, bar) => sum + (bar.totalRevenue || 0), 0),
            }

            // Count by country and city
            bars.forEach(bar => {
                stats.barsByCountry[bar.country] = (stats.barsByCountry[bar.country] || 0) + 1
                stats.barsByCity[bar.city] = (stats.barsByCity[bar.city] || 0) + 1
            })

            return stats
        } catch (error) {
            console.error('Error getting bar stats:', error)
            throw new Error('Failed to fetch bar statistics')
        }
    }
}

export const barService = new BarService()