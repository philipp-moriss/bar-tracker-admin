import { Timestamp } from 'firebase/firestore'

export interface Bar {
    id: string
    name: string
    address: string
    city: string
    country: string
    phone?: string
    email?: string
    website?: string
    description?: string
    imageUrl?: string
    isActive: boolean
    createdAt: Timestamp | Date
    updatedAt?: Timestamp | Date
    // Images
    images?: string[] // URLs of uploaded images
    // Statistics
    totalEvents?: number
    totalRevenue?: number
    averageRating?: number
}

export interface CreateBarData {
    name: string
    address: string
    city: string
    country: string
    phone?: string
    email?: string
    website?: string
    description?: string
    imageUrl?: string
    isActive?: boolean
    // Images
    images?: string[] // URLs of uploaded images
}

export interface UpdateBarData {
    name?: string
    address?: string
    city?: string
    country?: string
    phone?: string
    email?: string
    website?: string
    description?: string
    imageUrl?: string
    isActive?: boolean
    // Images
    images?: string[] // URLs of uploaded images
}

export interface BarFilters {
    search?: string
    city?: string
    country?: string
    isActive?: boolean
}

export interface BarStats {
    totalBars: number
    activeBars: number
    inactiveBars: number
    barsByCountry: { [country: string]: number }
    barsByCity: { [city: string]: number }
    totalEvents: number
    totalRevenue: number
}