<template>
  <div 
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center"
    :class="overlayClasses"
    role="dialog"
    aria-modal="true"
    :aria-label="ariaLabel"
  >
    <!-- Background overlay -->
    <div 
      class="absolute inset-0 transition-opacity duration-300"
      :class="backgroundClasses"
    ></div>
    
    <!-- Loader content -->
    <div class="relative flex flex-col items-center space-y-4 p-6">
      <!-- Loading spinner or custom content -->
      <div v-if="type === 'spinner'" class="flex items-center justify-center">
        <LoadingSpinner
          :size="spinnerSize"
          :color="spinnerColor"
          :variant="spinnerVariant"
        />
      </div>
      
      <!-- Progress bar -->
      <div v-else-if="type === 'progress'" class="w-64">
        <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            class="h-full transition-all duration-300 ease-out rounded-full"
            :class="progressClasses"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div v-if="showPercentage" class="text-center mt-2 text-sm text-gray-600">
          {{ Math.round(progress) }}%
        </div>
      </div>
      
      <!-- Skeleton loader -->
      <div v-else-if="type === 'skeleton'" class="space-y-3">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-300 rounded w-48 mb-2"></div>
          <div class="h-4 bg-gray-300 rounded w-32 mb-2"></div>
          <div class="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
      
      <!-- Dots loader -->
      <div v-else-if="type === 'dots'" class="flex space-x-1">
        <div 
          v-for="i in 3" 
          :key="i"
          class="w-2 h-2 rounded-full animate-bounce"
          :class="dotClasses"
          :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
        ></div>
      </div>
      
      <!-- Custom content slot -->
      <div v-else-if="type === 'custom'">
        <slot name="loader" />
      </div>
      
      <!-- Loading text/message -->
      <div v-if="showMessage" class="text-center">
        <div 
          v-if="title"
          class="font-medium mb-1"
          :class="titleClasses"
        >
          {{ title }}
        </div>
        <div 
          v-if="message"
          class="text-sm"
          :class="messageClasses"
        >
          {{ message }}
        </div>
      </div>
      
      <!-- Cancel button (optional) -->
      <Button
        v-if="showCancel"
        variant="outline"
        size="sm"
        @click="handleCancel"
        class="mt-4"
      >
        {{ cancelText }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { LoadingSpinner, Button } from '@/components/atoms'

interface Props {
  // Visibility
  visible?: boolean
  
  // Loader type
  type?: 'spinner' | 'progress' | 'skeleton' | 'dots' | 'custom'
  
  // Progress (for progress type)
  progress?: number
  showPercentage?: boolean
  
  // Spinner configuration
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  spinnerColor?: string
  spinnerVariant?: 'default' | 'primary' | 'secondary'
  
  // Overlay styling
  overlay?: 'transparent' | 'light' | 'dark' | 'blur'
  
  // Content
  title?: string
  message?: string
  showMessage?: boolean
  
  // Theme
  theme?: 'light' | 'dark'
  
  // Behavior
  showCancel?: boolean
  cancelText?: string
  preventScroll?: boolean
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  type: 'spinner',
  progress: 0,
  showPercentage: false,
  spinnerSize: 'lg',
  spinnerColor: 'text-blue-600',
  spinnerVariant: 'default',
  overlay: 'light',
  showMessage: true,
  theme: 'light',
  showCancel: false,
  cancelText: 'Cancel',
  preventScroll: true,
  ariaLabel: 'Loading content, please wait'
})

const emit = defineEmits<{
  'cancel': []
}>()

const overlayClasses = computed(() => {
  const classes = ['transition-opacity duration-300']
  
  if (!props.visible) {
    classes.push('opacity-0 pointer-events-none')
  } else {
    classes.push('opacity-100')
  }
  
  return classes.join(' ')
})

const backgroundClasses = computed(() => {
  const overlayStyles = {
    transparent: 'bg-transparent',
    light: 'bg-white bg-opacity-75',
    dark: 'bg-gray-900 bg-opacity-75',
    blur: 'bg-white bg-opacity-50 backdrop-blur-sm'
  }
  
  return overlayStyles[props.overlay]
})

const progressClasses = computed(() => {
  const themeStyles = {
    light: 'bg-blue-600',
    dark: 'bg-blue-400'
  }
  
  return themeStyles[props.theme]
})

const dotClasses = computed(() => {
  const themeStyles = {
    light: 'bg-blue-600',
    dark: 'bg-blue-400'
  }
  
  return themeStyles[props.theme]
})

const titleClasses = computed(() => {
  const themeStyles = {
    light: 'text-gray-900',
    dark: 'text-white'
  }
  
  return themeStyles[props.theme]
})

const messageClasses = computed(() => {
  const themeStyles = {
    light: 'text-gray-600',
    dark: 'text-gray-300'
  }
  
  return themeStyles[props.theme]
})

const handleCancel = () => {
  emit('cancel')
}

// Prevent scrolling when loader is visible
onMounted(() => {
  if (props.preventScroll && props.visible) {
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  if (props.preventScroll) {
    document.body.style.overflow = ''
  }
})

// Handle ESC key to cancel (if cancel is enabled)
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.showCancel) {
    handleCancel()
  }
}

onMounted(() => {
  if (props.showCancel) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (props.showCancel) {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}
</style>