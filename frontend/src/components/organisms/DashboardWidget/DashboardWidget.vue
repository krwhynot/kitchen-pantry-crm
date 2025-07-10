<template>
  <div
    :class="widgetClasses"
    :data-widget="title?.toLowerCase().replace(/\s+/g, '-')"
  >
    <!-- Widget Header -->
    <div v-if="title || $slots['header-actions']" class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <div v-if="$slots['header-actions']" class="flex items-center space-x-2">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <!-- Widget Content -->
    <div :class="contentClasses">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center">
        <div class="space-y-4 w-full">
          <div v-if="size === 'small'" class="space-y-3">
            <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div class="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="i in (size === 'large' ? 5 : 3)" :key="i" class="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-8">
        <Icon name="exclamation-triangle" class="h-12 w-12 text-red-400 mb-4" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">Failed to load data</h4>
        <p class="text-sm text-gray-600 mb-4 text-center">{{ error }}</p>
        <Button variant="secondary" @click="retry">
          <Icon name="arrow-path" class="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>

      <!-- Widget Content -->
      <div v-else>
        <slot />
      </div>
    </div>

    <!-- Widget Footer -->
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button, Icon } from '@/components/atoms'

interface Props {
  title?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  loading?: boolean
  error?: string | null
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: boolean
  border?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  loading: false,
  error: null,
  padding: 'md',
  shadow: true,
  border: true,
  rounded: true
})

const emit = defineEmits<{
  retry: []
}>()

// Computed classes
const widgetClasses = computed(() => {
  const classes = ['bg-white']
  
  if (props.shadow) {
    classes.push('shadow-sm hover:shadow-md transition-shadow duration-200')
  }
  
  if (props.border) {
    classes.push('border border-gray-200')
  }
  
  if (props.rounded) {
    classes.push('rounded-lg')
  }
  
  return classes.join(' ')
})

const contentClasses = computed(() => {
  const classes = []
  
  // Add padding based on size and padding prop
  if (props.padding === 'none') {
    // No padding
  } else if (props.padding === 'sm') {
    classes.push('p-4')
  } else if (props.padding === 'md') {
    classes.push('p-6')
  } else if (props.padding === 'lg') {
    classes.push('p-8')
  }
  
  // Adjust height based on size
  if (props.size === 'small') {
    classes.push('min-h-[120px]')
  } else if (props.size === 'medium') {
    classes.push('min-h-[200px]')
  } else if (props.size === 'large') {
    classes.push('min-h-[300px]')
  }
  
  return classes.join(' ')
})

// Event handlers
const retry = () => {
  emit('retry')
}
</script>