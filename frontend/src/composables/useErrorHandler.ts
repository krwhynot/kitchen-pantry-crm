import { ref, onErrorCaptured, type Ref } from 'vue'

export interface ErrorInfo {
  message: string
  stack?: string
  timestamp: Date
  component?: string
  route?: string
}

export interface UseErrorHandlerOptions {
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  fallbackMessage?: string
  showDetails?: boolean
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    onError,
    fallbackMessage = 'An unexpected error occurred',
    showDetails = false
  } = options

  const hasError = ref(false)
  const error = ref<Error | null>(null)
  const errorInfo = ref<ErrorInfo | null>(null)

  const handleError = (err: Error, componentName?: string) => {
    console.error('Error handled:', err)
    
    hasError.value = true
    error.value = err
    errorInfo.value = {
      message: err.message || fallbackMessage,
      stack: err.stack,
      timestamp: new Date(),
      component: componentName,
      route: window.location.pathname
    }

    if (onError) {
      onError(err, errorInfo.value)
    }

    // Send to error tracking service in production
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureError(err, errorInfo.value)
    }
  }

  const clearError = () => {
    hasError.value = false
    error.value = null
    errorInfo.value = null
  }

  const retry = (retryFn?: () => void) => {
    clearError()
    if (retryFn) {
      try {
        retryFn()
      } catch (err) {
        handleError(err as Error)
      }
    }
  }

  // Capture errors in the component tree
  onErrorCaptured((err: Error, info: string) => {
    handleError(err, info)
    return false // Prevent error from propagating
  })

  return {
    hasError: hasError as Ref<boolean>,
    error: error as Ref<Error | null>,
    errorInfo: errorInfo as Ref<ErrorInfo | null>,
    handleError,
    clearError,
    retry
  }
}

// Global error handler for uncaught errors
export function setupGlobalErrorHandler() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Send to error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureError(event.error, {
      //   message: event.message,
      //   filename: event.filename,
      //   lineno: event.lineno,
      //   colno: event.colno,
      //   timestamp: new Date()
      // })
    }
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Send to error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureError(event.reason, {
      //   message: 'Unhandled promise rejection',
      //   timestamp: new Date()
      // })
    }
  })
}

// Async error handler for promises
export async function withErrorHandler<T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | null> {
  try {
    return await asyncFn()
  } catch (error) {
    console.error('Async error:', error)
    
    if (errorHandler) {
      errorHandler(error as Error)
    }
    
    return null
  }
}

// Error boundary higher-order component
export function withErrorBoundary<T extends Record<string, any>>(
  component: T,
  errorHandler?: (error: Error) => void
): T {
  return {
    ...component,
    errorCaptured(err: Error, info: string) {
      console.error('Error boundary caught:', err, info)
      
      if (errorHandler) {
        errorHandler(err)
      }
      
      return false
    }
  }
}