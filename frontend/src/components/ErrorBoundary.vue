<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary-content">
      <div class="error-boundary-icon">
        <ExclamationTriangleIcon class="h-12 w-12 text-red-500" />
      </div>
      <h2 class="error-boundary-title">Something went wrong</h2>
      <p class="error-boundary-message">
        {{ error?.message || 'An unexpected error occurred' }}
      </p>
      <div class="error-boundary-actions">
        <button
          @click="retry"
          class="error-boundary-button primary"
        >
          Try Again
        </button>
        <button
          @click="reportError"
          class="error-boundary-button secondary"
        >
          Report Issue
        </button>
      </div>
      <details v-if="showDetails" class="error-boundary-details">
        <summary class="error-boundary-summary">Error Details</summary>
        <pre class="error-boundary-stack">{{ error?.stack }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface Props {
  fallback?: string
  showDetails?: boolean
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'Something went wrong',
  showDetails: false
})

const emit = defineEmits<{
  error: [error: Error]
}>()

const hasError = ref(false)
const error = ref<Error | null>(null)

const errorMessage = computed(() => {
  return error.value?.message || props.fallback
})

onErrorCaptured((err: Error) => {
  console.error('Error caught by boundary:', err)
  
  hasError.value = true
  error.value = err
  
  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err)
  }
  
  // Emit error event
  emit('error', err)
  
  // Prevent error from propagating
  return false
})

const retry = () => {
  hasError.value = false
  error.value = null
}

const reportError = () => {
  // In a real app, this would send error to logging service
  console.error('Reporting error:', error.value)
  
  // For development, show an alert
  if (import.meta.env.DEV) {
    alert('Error reported to development team!')
  }
}</script>

<style scoped>
.error-boundary {
  @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8;
}

.error-boundary-content {
  @apply max-w-md w-full space-y-8 text-center;
}

.error-boundary-icon {
  @apply mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100;
}

.error-boundary-title {
  @apply mt-6 text-3xl font-extrabold text-gray-900;
}

.error-boundary-message {
  @apply mt-2 text-sm text-gray-600;
}

.error-boundary-actions {
  @apply mt-8 space-y-3;
}

.error-boundary-button {
  @apply w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.error-boundary-button.primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.error-boundary-button.secondary {
  @apply text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500;
}

.error-boundary-details {
  @apply mt-6 text-left;
}

.error-boundary-summary {
  @apply cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900;
}

.error-boundary-stack {
  @apply mt-2 text-xs text-gray-500 bg-gray-100 p-3 rounded overflow-auto max-h-48;
}
</style>