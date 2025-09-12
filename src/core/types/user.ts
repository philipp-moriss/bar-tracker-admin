import { Timestamp } from 'firebase/firestore'

// User types based on profiles collection
export interface User {
  id: string
  name: string
  email: string
  phoneNumber?: string
  dateOfBirth?: string
  photo?: string
  role: UserRole
  status: UserStatus
  isEmailPasswordProvider?: boolean
  lastLoginAt?: Timestamp | Date
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
  // Additional fields for admin management
  isBlocked?: boolean
  blockedAt?: Timestamp | Date
  blockedReason?: string
  totalEvents?: number
  totalTickets?: number
  totalSpent?: number
  // Bar assignment for bartenders
  barName?: string
  // Profile fields merged from profiles collection
  bio?: string
  location?: string
  preferences?: UserPreferences
  socialLinks?: SocialLinks
}

export interface UserProfile {
  id: string
  userId: string
  bio?: string
  location?: string
  preferences?: UserPreferences
  socialLinks?: SocialLinks
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    showEmail: boolean
    showPhone: boolean
    showEvents: boolean
  }
  language: string
  timezone: string
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  twitter?: string
  website?: string
}

export enum UserRole {
  USER = 'user',
  BARTENDER = 'bartender',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending'
}

// User filters
export interface UserFilters {
  role?: UserRole
  status?: UserStatus
  search?: string
  dateFrom?: Date
  dateTo?: Date
  isBlocked?: boolean
}

// User statistics
export interface UserStats {
  totalUsers: number
  activeUsers: number
  blockedUsers: number
  usersByRole: { [role: string]: number }
  usersByStatus: { [status: string]: number }
  newUsersThisMonth: number
  totalRevenue: number
  averageSpentPerUser: number
}

// User activity
export interface UserActivity {
  id: string
  userId: string
  action: UserAction
  description: string
  metadata?: { [key: string]: any }
  createdAt: Timestamp | Date
}

export enum UserAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  USER_CREATED = 'user_created',
  UPDATE_PROFILE = 'update_profile',
  BUY_TICKET = 'buy_ticket',
  JOIN_EVENT = 'join_event',
  LEAVE_EVENT = 'leave_event',
  BLOCK = 'block',
  UNBLOCK = 'unblock',
  CHANGE_ROLE = 'change_role'
}

// User creation/update data
export interface CreateUserData {
  name: string
  email: string
  phoneNumber?: string
  dateOfBirth?: string
  photo?: string
  role: UserRole
  status: UserStatus
  password?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  phoneNumber?: string
  dateOfBirth?: string
  photo?: string
  role?: UserRole
  status?: UserStatus
  isBlocked?: boolean
  blockedReason?: string
  barName?: string
}
