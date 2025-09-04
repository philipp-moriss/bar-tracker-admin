import { useEffect } from 'react'
import { useAuthStore } from '@/core/stores/authStore'

/**
 * Хук для инициализации аутентификации при запуске приложения
 */
export const useAuthInit = () => {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    // Инициализируем аутентификацию
    const unsubscribe = initializeAuth()

    // Cleanup функция для отписки от слушателя
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [initializeAuth])
}
