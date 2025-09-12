import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { db, auth } from '@/modules/firebase/config'
import {
  User,
  UserProfile,
  UserFilters,
  UserStats,
  UserActivity,
  UserRole,
  UserStatus,
  UserAction,
  CreateUserData,
  UpdateUserData
} from '@/core/types/user'

export class UserService {
  private readonly profilesCollection = collection(db, 'profiles')
  private readonly userActivitiesCollection = collection(db, 'userActivities')

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
   * Get all users with optional filters
   */
  async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      // Use the most basic query possible - no orderBy, no where clauses
      const q = query(this.profilesCollection)
      const snapshot = await getDocs(q)

      let users = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          createdAt: this.getDate(data.createdAt),
          updatedAt: this.getDate(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? this.getDate(data.lastLoginAt) : undefined,
          blockedAt: data.blockedAt ? this.getDate(data.blockedAt) : undefined,
          id: doc.id,
        }
      }) as User[]

      // Sort client-side by createdAt (newest first)
      users = users.sort((a, b) => {
        const dateA = this.getDate(a.createdAt)
        const dateB = this.getDate(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })

      // Apply all filters client-side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        users = users.filter(user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phoneNumber?.toLowerCase().includes(searchLower)
        )
      }

      if (filters?.role) {
        users = users.filter(user => user.role === filters.role)
      }

      if (filters?.status) {
        users = users.filter(user => user.status === filters.status)
      }

      if (filters?.isBlocked !== undefined) {
        users = users.filter(user => user.isBlocked === filters.isBlocked)
      }

      // Date filtering
      if (filters?.dateFrom) {
        const dateFrom = filters.dateFrom
        users = users.filter(user => {
          const userDate = this.getDate(user.createdAt)
          return userDate >= dateFrom
        })
      }
      if (filters?.dateTo) {
        const dateTo = filters.dateTo
        users = users.filter(user => {
          const userDate = this.getDate(user.createdAt)
          return userDate <= dateTo
        })
      }

      return users
    } catch (error) {
      console.error('Error getting users:', error)

      // If no profiles collection exists, return empty array instead of throwing error
      if ((error as any)?.code === 'failed-precondition' || (error as any)?.message?.includes('index')) {
        console.warn('Profiles collection may not exist or require index. Returning empty array.')
        return []
      }

      throw new Error('Failed to fetch users')
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Generate a temporary password (user will need to reset it)
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        tempPassword
      )

      const firebaseUser = userCredential.user

      // Update the display name
      await updateProfile(firebaseUser, {
        displayName: userData.name
      })

      // Create user document in Firestore
      const userDoc = {
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber || '',
        role: userData.role,
        status: userData.status,
        isBlocked: userData.status === 'blocked',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLoginAt: null,
        blockedAt: userData.status === 'blocked' ? Timestamp.now() : null,
        // Additional fields
        dateOfBirth: userData.dateOfBirth || undefined,
        photo: userData.photo || undefined,
        totalSpent: 0,
        totalTickets: 0,
        totalEvents: 0,
      }

      const sanitizedUserDoc = this.sanitizeForFirestore(userDoc)
      await setDoc(doc(this.profilesCollection, firebaseUser.uid), sanitizedUserDoc)

      // Log activity
      await this.logUserActivity(
        firebaseUser.uid,
        UserAction.USER_CREATED,
        'User account created by admin',
        { createdBy: 'admin', tempPassword: true }
      )

      return {
        id: firebaseUser.uid,
        ...sanitizedUserDoc,
        createdAt: this.getDate(sanitizedUserDoc.createdAt),
        updatedAt: this.getDate(sanitizedUserDoc.updatedAt),
        lastLoginAt: undefined,
        blockedAt: sanitizedUserDoc.blockedAt ? this.getDate(sanitizedUserDoc.blockedAt) : undefined,
      } as User

    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }
  }

  /**
   * Sync users from other collections to profiles collection
   * This method looks for user data in other collections and creates profiles collection entries
   */
  async syncUsersFromOtherCollections(): Promise<{ synced: number; errors: string[] }> {
    try {
      const errors: string[] = []
      let synced = 0

      // Check if there are any collections that might contain user data
      const possibleCollections = ['userProfiles', 'profiles', 'userData', 'accounts']

      for (const collectionName of possibleCollections) {
        try {
          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)

          if (!snapshot.empty) {
            console.log(`Found ${snapshot.docs.length} documents in ${collectionName} collection`)

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data()

              // Check if this looks like user data
              if (data.email || data.userId || data.uid) {
                const userId = data.userId || data.uid || docSnap.id

                // Check if user already exists in profiles collection
                const existingUser = await this.getUserById(userId)
                // Dedupe: also check by email if id-based document not found
                const email: string | undefined = data.email || ''
                const existingByEmail = email ? await this.getUserByEmail(email) : null
                if (!existingUser && !existingByEmail) {
                  // Create user document
                  const userDoc = {
                    name: data.name || data.displayName || 'Unknown User',
                    email: data.email || '',
                    phoneNumber: data.phoneNumber || data.phone || '',
                    role: data.role || 'user',
                    status: data.status || 'active',
                    isBlocked: data.isBlocked || false,
                    createdAt: data.createdAt || Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    lastLoginAt: data.lastLoginAt || null,
                    blockedAt: data.blockedAt || null,
                    dateOfBirth: data.dateOfBirth || undefined,
                    photo: data.photo || data.photoURL || undefined,
                    totalSpent: data.totalSpent || 0,
                    totalTickets: data.totalTickets || 0,
                    totalEvents: data.totalEvents || 0,
                  }

                  const sanitizedUserDoc = this.sanitizeForFirestore(userDoc)
                  await setDoc(doc(this.profilesCollection, userId), sanitizedUserDoc)
                  synced++
                  console.log(`Synced user: ${sanitizedUserDoc.name} (${sanitizedUserDoc.email})`)
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Could not access collection ${collectionName}:`, error)
          errors.push(`Could not access collection ${collectionName}`)
        }
      }

      return { synced, errors }
    } catch (error) {
      console.error('Error syncing users:', error)
      return { synced: 0, errors: ['Failed to sync users'] }
    }
  }

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(this.profilesCollection, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: this.getDate(data.createdAt),
          updatedAt: this.getDate(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? this.getDate(data.lastLoginAt) : undefined,
          blockedAt: data.blockedAt ? this.getDate(data.blockedAt) : undefined,
        } as User
      }

      return null
    } catch (error) {
      console.error('Error getting user:', error)
      throw new Error('Failed to fetch user')
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(this.profilesCollection, where('email', '==', email))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: this.getDate(data.createdAt),
          updatedAt: this.getDate(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? this.getDate(data.lastLoginAt) : undefined,
          blockedAt: data.blockedAt ? this.getDate(data.blockedAt) : undefined,
        } as User
      }

      return null
    } catch (error) {
      console.error('Error getting user by email:', error)
      throw new Error('Failed to fetch user')
    }
  }



  /**
   * Update existing user
   */
  async updateUser(id: string, userData: UpdateUserData): Promise<void> {
    try {
      const docRef = doc(this.profilesCollection, id)
      const updateData = {
        ...userData,
        updatedAt: Timestamp.fromDate(new Date()),
      }

      // Remove undefined values to avoid Firebase error
      const sanitizedData = this.sanitizeForFirestore(updateData)

      await updateDoc(docRef, sanitizedData)
    } catch (error) {
      console.error('Error updating user:', error)
      throw new Error('Failed to update user')
    }
  }

  /**
   * Block user
   */
  async blockUser(id: string, reason?: string): Promise<void> {
    try {
      const docRef = doc(this.profilesCollection, id)
      await updateDoc(docRef, {
        isBlocked: true,
        status: UserStatus.BLOCKED,
        blockedAt: Timestamp.fromDate(new Date()),
        blockedReason: reason || 'Blocked by administrator',
        updatedAt: Timestamp.fromDate(new Date()),
      })

      // Log activity
      await this.logUserActivity(id, UserAction.BLOCK, 'User blocked by administrator', { reason })
    } catch (error) {
      console.error('Error blocking user:', error)
      throw new Error('Failed to block user')
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(id: string): Promise<void> {
    try {
      const docRef = doc(this.profilesCollection, id)
      await updateDoc(docRef, {
        isBlocked: false,
        status: UserStatus.ACTIVE,
        blockedAt: null,
        blockedReason: null,
        updatedAt: Timestamp.fromDate(new Date()),
      })

      // Log activity
      await this.logUserActivity(id, UserAction.UNBLOCK, 'User unblocked by administrator')
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw new Error('Failed to unblock user')
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(id: string, newRole: UserRole): Promise<void> {
    try {
      const docRef = doc(this.profilesCollection, id)
      await updateDoc(docRef, {
        role: newRole,
        updatedAt: Timestamp.fromDate(new Date()),
      })

      // Log activity
      await this.logUserActivity(id, UserAction.CHANGE_ROLE, `User role changed to ${newRole}`, { newRole })
    } catch (error) {
      console.error('Error changing user role:', error)
      throw new Error('Failed to change user role')
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const docRef = doc(this.profilesCollection, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }

  /**
   * Get user profile (now merged with user data)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return null

      return {
        id: user.id,
        userId: user.id,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      // Simple query without orderBy to avoid index requirements
      const q = query(
        this.userActivitiesCollection,
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)

      let activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.getDate(doc.data().createdAt),
      })) as UserActivity[]

      // Sort client-side and limit
      activities = activities
        .sort((a, b) => {
          const dateA = this.getDate(a.createdAt)
          const dateB = this.getDate(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, limit)

      return activities
    } catch (error) {
      console.error('Error getting user activities:', error)
      throw new Error('Failed to fetch user activities')
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(userId: string, action: UserAction, description: string, metadata?: { [key: string]: any }): Promise<void> {
    try {
      await addDoc(this.userActivitiesCollection, {
        userId,
        action,
        description,
        metadata,
        createdAt: Timestamp.fromDate(new Date()),
      })
    } catch (error) {
      console.error('Error logging user activity:', error)
      // Don't throw error for logging failures
    }
  }

  /**
   * Remove duplicate users based on email from profiles collection
   * Keeps the first user with each email, removes the rest
   */
  async removeDuplicateUsers(): Promise<{ removed: number; errors: string[] }> {
    try {
      const errors: string[] = []
      let removed = 0

      // Get all users
      const users = await this.getUsers()

      // Group users by email
      const usersByEmail = new Map<string, User[]>()
      users.forEach(user => {
        if (user.email) {
          if (!usersByEmail.has(user.email)) {
            usersByEmail.set(user.email, [])
          }
          usersByEmail.get(user.email)!.push(user)
        }
      })

      // Process each email group
      for (const [, userGroup] of usersByEmail) {
        if (userGroup.length > 1) {
          // Sort by createdAt to keep the oldest (first created)
          const sortedUsers = userGroup.sort((a, b) => {
            const dateA = this.getDate(a.createdAt)
            const dateB = this.getDate(b.createdAt)
            return dateA.getTime() - dateB.getTime()
          })

          // Keep the first user, remove the rest
          const usersToRemove = sortedUsers.slice(1)

          for (const userToRemove of usersToRemove) {
            try {
              await this.deleteUser(userToRemove.id)
              removed++
              console.log(`Removed duplicate user: ${userToRemove.name} (${userToRemove.email})`)
            } catch (error) {
              console.error(`Error removing duplicate user ${userToRemove.id}:`, error)
              errors.push(`Failed to remove user ${userToRemove.id}`)
            }
          }
        }
      }

      return { removed, errors }
    } catch (error) {
      console.error('Error removing duplicates:', error)
      return { removed: 0, errors: ['Failed to remove duplicates'] }
    }
  }

  /**
   * Get user statistics from profiles collection
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const users = await this.getUsers()

      const stats: UserStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === UserStatus.ACTIVE).length,
        blockedUsers: users.filter(u => u.isBlocked).length,
        usersByRole: users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as { [role: string]: number }),
        usersByStatus: users.reduce((acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1
          return acc
        }, {} as { [status: string]: number }),
        newUsersThisMonth: users.filter(user => {
          const userDate = this.getDate(user.createdAt)
          const now = new Date()
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return userDate >= monthAgo
        }).length,
        totalRevenue: users.reduce((sum, user) => sum + (user.totalSpent || 0), 0),
        averageSpentPerUser: users.length > 0
          ? users.reduce((sum, user) => sum + (user.totalSpent || 0), 0) / users.length
          : 0,
      }

      return stats
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw new Error('Failed to fetch user statistics')
    }
  }
}

// Export singleton instance
export const userService = new UserService()
