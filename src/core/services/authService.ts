import { AdminUser } from '@/core/stores/authStore'
import { ENV_CONFIG } from '@/core/config/env'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { firebaseApp } from '@/modules/firebase/config'
import { AnalyticsService } from './analyticsService'

const auth = getAuth(firebaseApp)

const ADMIN_CREDENTIALS = {
  email: ENV_CONFIG.ADMIN.EMAIL,
  password: ENV_CONFIG.ADMIN.PASSWORD,
  name: ENV_CONFIG.ADMIN.NAME,
  id: ENV_CONFIG.ADMIN.ID
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: AdminUser
  error?: string
}

export class AuthService {
  /**
   * Login to system via Firebase Auth
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      if (
        credentials.email !== ADMIN_CREDENTIALS.email ||
        credentials.password !== ADMIN_CREDENTIALS.password
      ) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      const firebaseUser = userCredential.user
      const adminUser: AdminUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        isAdmin: true
      }

      AnalyticsService.logAdminLogin()

      return {
        success: true,
        user: adminUser
      }
    } catch (error: any) {
      console.error('Firebase login error:', error)
      
      let errorMessage = 'Error logging into the system'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Wrong password'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later'
      }

      AnalyticsService.logAuthError(error.code || 'unknown')

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Logout from system via Firebase
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth)
      AnalyticsService.logAdminLogout()
    } catch (error) {
      console.error('Firebase logout error:', error)
      throw error
    }
  }

  /**
   * Checks if admin already exists in the system
   */
  async checkAdminExists(): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(
        auth,
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      )
      await signOut(auth)
      return true
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return false
      }
      return true
    }
  }

  /**
   * Creates single admin via Firebase
   */
  async createAdmin(): Promise<{ success: boolean; message: string }> {
    try {
      const exists = await this.checkAdminExists()
      if (exists) {
        return {
          success: true,
          message: 'Administrator already exists in the system'
        }
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      )

      console.log('Admin created successfully:', userCredential.user.uid)

      AnalyticsService.logAdminCreated()

      return {
        success: true,
        message: 'Administrator created successfully'
      }
    } catch (error: any) {
      console.error('Firebase create admin error:', error)
      
      let errorMessage = 'Error creating administrator'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Administrator already exists'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format'
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  /**
   * Gets admin data by ID
   */
  async getAdminById(id: string): Promise<AdminUser | null> {
    try {
      const currentUser = auth.currentUser
      if (currentUser && currentUser.uid === id) {
        return {
          id: currentUser.uid,
          email: currentUser.email || ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          isAdmin: true
        }
      }
      return null
    } catch (error) {
      console.error('Get admin by ID error:', error)
      return null
    }
  }

  /**
   * Listens to authentication state changes
   */
  onAuthStateChanged(callback: (user: AdminUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email === ADMIN_CREDENTIALS.email) {
        const adminUser: AdminUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          isAdmin: true
        }
        callback(adminUser)
      } else {
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()
