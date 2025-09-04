// Конфигурация переменных окружения
export const ENV_CONFIG = {
  // Данные администратора
  ADMIN: {
    EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'admin@bartrekker.com',
    PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'Admin123!',
    NAME: import.meta.env.VITE_ADMIN_NAME || 'Admin',
    ID: import.meta.env.VITE_ADMIN_ID || 'admin-001',
  },
  
  // Настройки приложения
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'BarTrekker Admin',
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  
  // Режим разработки
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const

// Типы для переменных окружения
export type EnvConfig = typeof ENV_CONFIG
