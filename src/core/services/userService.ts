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
  private readonly usersCollection = collection(db, 'users')
  private readonly userProfilesCollection = collection(db, 'userProfiles')
  private readonly userActivitiesCollection = collection(db, 'userActivities')

  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      // Use the most basic query possible - no orderBy, no where clauses
      const q = query(this.usersCollection)
      const snapshot = await getDocs(q)
      
      let users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
        lastLoginAt: doc.data().lastLoginAt?.toDate() || doc.data().lastLoginAt,
        blockedAt: doc.data().blockedAt?.toDate() || doc.data().blockedAt,
      })) as User[]

      // Sort client-side by createdAt (newest first)
      users = users.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate()
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate()
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
          const userDate = user.createdAt instanceof Date ? user.createdAt : user.createdAt.toDate()
          return userDate >= dateFrom
        })
      }
      if (filters?.dateTo) {
        const dateTo = filters.dateTo
        users = users.filter(user => {
          const userDate = user.createdAt instanceof Date ? user.createdAt : user.createdAt.toDate()
          return userDate <= dateTo
        })
      }

      return users
    } catch (error) {
      console.error('Error getting users:', error)
      
      // If no users collection exists, return empty array instead of throwing error
      if ((error as any)?.code === 'failed-precondition' || (error as any)?.message?.includes('index')) {
        console.warn('Users collection may not exist or require index. Returning empty array.')
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

      await addDoc(this.usersCollection, userDoc)

      // Log activity
      await this.logUserActivity(
        firebaseUser.uid, 
        UserAction.USER_CREATED, 
        'User account created by admin',
        { createdBy: 'admin', tempPassword: true }
      )

      return {
        id: firebaseUser.uid,
        ...userDoc,
        createdAt: userDoc.createdAt.toDate(),
        updatedAt: userDoc.updatedAt.toDate(),
        lastLoginAt: undefined,
        blockedAt: userDoc.blockedAt?.toDate() || undefined,
      } as User

    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }
  }

  /**
   * Sync users from other collections to users collection
   * This method looks for user data in other collections and creates users collection entries
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
                
                // Check if user already exists in users collection
                const existingUser = await this.getUserById(userId)
                if (!existingUser) {
                  // Create user document
                  const userDoc = {
                    id: userId,
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

                  await addDoc(this.usersCollection, userDoc)
                  synced++
                  console.log(`Synced user: ${userDoc.name} (${userDoc.email})`)
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
      const docRef = doc(this.usersCollection, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate() || data.lastLoginAt,
          blockedAt: data.blockedAt?.toDate() || data.blockedAt,
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
      const q = query(this.usersCollection, where('email', '==', email))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate() || data.lastLoginAt,
          blockedAt: data.blockedAt?.toDate() || data.blockedAt,
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
      const docRef = doc(this.usersCollection, id)
      const updateData = {
        ...userData,
        updatedAt: Timestamp.fromDate(new Date()),
      }

      await updateDoc(docRef, updateData)
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
      const docRef = doc(this.usersCollection, id)
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
      const docRef = doc(this.usersCollection, id)
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
      const docRef = doc(this.usersCollection, id)
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
      const docRef = doc(this.usersCollection, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const q = query(this.userProfilesCollection, where('userId', '==', userId))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
        } as UserProfile
      }

      return null
    } catch (error) {
      console.error('Error getting user profile:', error)
      // Return null instead of throwing error for optional profile
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
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
      })) as UserActivity[]

      // Sort client-side and limit
      activities = activities
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate()
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate()
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
   * Get user statistics
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
          const userDate = user.createdAt instanceof Date ? user.createdAt : user.createdAt.toDate()
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
