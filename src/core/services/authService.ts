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

// Инициализация Firebase Auth
const auth = getAuth(firebaseApp)

// Данные единственного админа из переменных окружения
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
   * Вход в систему через Firebase Auth
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Проверяем, что это админские учетные данные
      if (
        credentials.email !== ADMIN_CREDENTIALS.email ||
        credentials.password !== ADMIN_CREDENTIALS.password
      ) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Входим через Firebase
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

      // Логируем успешный вход
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

      // Логируем ошибку аутентификации
      AnalyticsService.logAuthError(error.code || 'unknown')

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Выход из системы через Firebase
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth)
      // Логируем выход
      AnalyticsService.logAdminLogout()
    } catch (error) {
      console.error('Firebase logout error:', error)
      throw error
    }
  }

  /**
   * Проверяет, существует ли уже админ в системе
   */
  async checkAdminExists(): Promise<boolean> {
    try {
      // Пытаемся войти с админскими данными
      await signInWithEmailAndPassword(
        auth,
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      )
      // Если успешно, выходим
      await signOut(auth)
      return true
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return false
      }
      // Другие ошибки (например, неверный пароль) означают, что пользователь существует
      return true
    }
  }

  /**
   * Создает единственного админа через Firebase
   */
  async createAdmin(): Promise<{ success: boolean; message: string }> {
    try {
      // Проверяем, существует ли уже админ
      const exists = await this.checkAdminExists()
      if (exists) {
        return {
          success: true,
          message: 'Administrator already exists in the system'
        }
      }

      // Создаем админа через Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      )

      console.log('Admin created successfully:', userCredential.user.uid)

      // Логируем создание администратора
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
   * Получает данные админа по ID
   */
  async getAdminById(id: string): Promise<AdminUser | null> {
    try {
      // В Firebase мы можем получить текущего пользователя
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
   * Слушает изменения состояния аутентификации
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

// Экспортируем единственный экземпляр сервиса
export const authService = new AuthService()
