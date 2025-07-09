import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import { setupGlobalErrorHandler } from './composables/useErrorHandler'

const app = createApp(App)
const pinia = createPinia()

// Enable Vue DevTools in development
if (import.meta.env.DEV) {
  app.config.devtools = true
  app.config.performance = true
}

// Setup global error handling
setupGlobalErrorHandler()

// Global error handler for Vue components
app.config.errorHandler = (err, instance, info) => {
  console.error('Global Vue error:', err, info)
  
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Example: Send to error tracking service
    // errorTrackingService.captureError(err, { info, instance })
  }
}

app.use(pinia)
app.use(router)

app.mount('#app')