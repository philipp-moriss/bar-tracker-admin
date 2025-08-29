import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
    user: {
        email: string
        userId: number
        access_token: string
        refresh_token: string
    } | null
    sessionExpired: boolean
    setSessionExpired: (status: boolean) => void
    setUser: (user: { email: string; userId: number; access_token: string, refresh_token: string }) => void
    clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            sessionExpired: false,
            setSessionExpired: (status) => set({ sessionExpired: status }),
            setUser: (user) => set({ user, sessionExpired: false }),
            clearUser: () => set({ user: null, sessionExpired: true }),
        }),
        {
            name: 'auth-storage'
        }
    )
)
