// Development utilities exports
export { MockDataGenerator, generateCompleteDataSet } from './mockData'
export { MockApiService, mockApi } from './mockApi'
export { default as DevUtils } from './devUtils'

// Re-export existing utilities
export { default as api } from './api'

// Development helpers
export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD
export const isTest = import.meta.env.MODE === 'test'

// Environment configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  environment: import.meta.env.MODE,
  isDev,
  isProd,
  isTest
}

// Development only exports
if (isDev) {
  // Make utilities available globally in development
  const devGlobals = {
    MockDataGenerator,
    mockApi,
    DevUtils,
    config
  }
  
  Object.assign(window, { dev: devGlobals })
}