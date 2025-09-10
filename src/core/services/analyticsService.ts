import { analytics } from '@/modules/firebase/config'
import { logEvent } from 'firebase/analytics'

export const AnalyticsService = {
  logAdminLogin(): void {
    if (analytics) {
      logEvent(analytics, 'admin_login', {
        event_category: 'authentication',
        event_label: 'admin'
      })
    }
  },

  logAdminLogout(): void {
    if (analytics) {
      logEvent(analytics, 'admin_logout', {
        event_category: 'authentication',
        event_label: 'admin'
      })
    }
  },

  logAdminCreated(): void {
    if (analytics) {
      logEvent(analytics, 'admin_created', {
        event_category: 'setup',
        event_label: 'admin'
      })
    }
  },

  logAuthError(errorCode: string): void {
    if (analytics) {
      logEvent(analytics, 'auth_error', {
        event_category: 'authentication',
        event_label: errorCode
      })
    }
  },

  logPageView(pageName: string): void {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_title: pageName,
        page_location: window.location.href
      })
    }
  },

  logCustomEvent(eventName: string, parameters?: Record<string, unknown>): void {
    if (analytics) {
      logEvent(analytics, eventName, parameters as Record<string, any>)
    }
  },
} as const
