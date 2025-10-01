import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/core/services/authService'

export interface AdminUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  sessionExpired: boolean
  isLoading: boolean
  login: (user: AdminUser) => void
  logout: () => Promise<void>
  setSessionExpired: (expired: boolean) => void
  checkAuth: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sessionExpired: false,
      isLoading: false,

      login: (user: AdminUser) => {
        set({
          user,
          isAuthenticated: true,
          sessionExpired: false,
          isLoading: false,
        })
      },

      logout: async () => {
        try {
          set({ isLoading: true })
          await authService.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            sessionExpired: false,
            isLoading: false,
          })
          localStorage.removeItem('auth-storage')
        }
      },

      setSessionExpired: (expired: boolean) => {
        set({ sessionExpired: expired })
      },

      checkAuth: () => {
        const { user } = get()
        if (user) {
          set({ isAuthenticated: true })
        } else {
          set({ isAuthenticated: false })
        }
      },

      initializeAuth: () => {
        set({ isLoading: true })
        
        const unsubscribe = authService.onAuthStateChanged((user) => {
          if (user) {
            set({
              user,
              isAuthenticated: true,
              sessionExpired: false,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              sessionExpired: false,
              isLoading: false,
            })
          }
        })

        return unsubscribe
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
