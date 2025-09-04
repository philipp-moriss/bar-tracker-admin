import { analytics } from '@/modules/firebase/config'
import { logEvent } from 'firebase/analytics'

export class AnalyticsService {
  /**
   * Логирует событие входа администратора
   */
  static logAdminLogin() {
    if (analytics) {
      logEvent(analytics, 'admin_login', {
        event_category: 'authentication',
        event_label: 'admin'
      })
    }
  }

  /**
   * Логирует событие выхода администратора
   */
  static logAdminLogout() {
    if (analytics) {
      logEvent(analytics, 'admin_logout', {
        event_category: 'authentication',
        event_label: 'admin'
      })
    }
  }

  /**
   * Логирует создание администратора
   */
  static logAdminCreated() {
    if (analytics) {
      logEvent(analytics, 'admin_created', {
        event_category: 'setup',
        event_label: 'admin'
      })
    }
  }

  /**
   * Логирует ошибку аутентификации
   */
  static logAuthError(errorCode: string) {
    if (analytics) {
      logEvent(analytics, 'auth_error', {
        event_category: 'authentication',
        event_label: errorCode
      })
    }
  }

  /**
   * Логирует посещение страницы
   */
  static logPageView(pageName: string) {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_title: pageName,
        page_location: window.location.href
      })
    }
  }

  /**
   * Логирует пользовательское событие
   */
  static logCustomEvent(eventName: string, parameters?: Record<string, any>) {
    if (analytics) {
      logEvent(analytics, eventName, parameters)
    }
  }
}
