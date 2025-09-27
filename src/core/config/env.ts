export const ENV_CONFIG = {
  ADMIN: {
    EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'admin@bartrekker.com',
    PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'Admin123!',
    NAME: import.meta.env.VITE_ADMIN_NAME || 'Admin',
    ID: import.meta.env.VITE_ADMIN_ID || 'admin-001',
  },
  
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'BarTrekker Admin',
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const

export type EnvConfig = typeof ENV_CONFIG
