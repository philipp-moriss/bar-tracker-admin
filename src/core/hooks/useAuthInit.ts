import { useEffect } from 'react'
import { useAuthStore } from '@/core/stores/authStore'

/**
 * Hook for authentication initialization on app startup
 */
export const useAuthInit = () => {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    const unsubscribe = initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [initializeAuth])
}
