<template>
  <div class="error-fallback">
    <div class="error-fallback-icon">
      <ExclamationTriangleIcon class="h-8 w-8 text-yellow-500" />
    </div>
    <div class="error-fallback-content">
      <h3 class="error-fallback-title">{{ title }}</h3>
      <p class="error-fallback-message">{{ message }}</p>
      <button
        v-if="showRetry"
        @click="$emit('retry')"
        class="error-fallback-button"
      >
        {{ retryText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface Props {
  title?: string
  message?: string
  showRetry?: boolean
  retryText?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  message: 'Please try again or contact support if the problem persists.',
  showRetry: true,
  retryText: 'Try Again'
})

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.error-fallback {
  @apply flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg;
}

.error-fallback-icon {
  @apply flex-shrink-0 mr-3;
}

.error-fallback-content {
  @apply flex-1;
}

.error-fallback-title {
  @apply text-sm font-medium text-yellow-800;
}

.error-fallback-message {
  @apply mt-1 text-sm text-yellow-700;
}

.error-fallback-button {
  @apply mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline;
}
</style>