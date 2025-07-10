<template>
  <div :class="containerClasses">
    <!-- Icon or Illustration -->
    <div v-if="icon" :class="iconContainerClasses">
      <Icon :name="icon" :class="iconClasses" />
    </div>
    
    <!-- Custom illustration slot -->
    <div v-else-if="$slots.illustration" class="mb-4">
      <slot name="illustration" />
    </div>

    <!-- Content -->
    <div :class="contentClasses">
      <!-- Title -->
      <h3 v-if="title" :class="titleClasses">
        {{ title }}
      </h3>
      
      <!-- Description -->
      <p v-if="description" :class="descriptionClasses">
        {{ description }}
      </p>
      
      <!-- Custom content slot -->
      <div v-if="$slots.content" class="mt-4">
        <slot name="content" />
      </div>
    </div>

    <!-- Action Button or Custom Actions -->
    <div v-if="$slots.default || action" :class="actionClasses">
      <slot>
        <Button
          v-if="action"
          :variant="actionVariant"
          :size="actionSize"
          @click="handleActionClick"
        >
          <Icon v-if="actionIcon" :name="actionIcon" class="w-4 h-4 mr-2" />
          {{ action }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button, Icon } from '@/components/atoms'

interface Props {
  // Content
  title?: string
  description?: string
  icon?: string
  
  // Action
  action?: string
  actionIcon?: string
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  
  // Styling
  size?: 'sm' | 'md' | 'lg'
  textAlign?: 'left' | 'center' | 'right'
  spacing?: 'tight' | 'normal' | 'loose'
  
  // Layout
  fullHeight?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  textAlign: 'center',
  spacing: 'normal',
  actionVariant: 'primary',
  fullHeight: false,
  padding: 'md'
})

const emit = defineEmits<{
  action: []
}>()

// Computed classes
const containerClasses = computed(() => {
  const classes = ['flex flex-col items-center justify-center']
  
  // Text alignment
  if (props.textAlign === 'left') {
    classes.push('items-start text-left')
  } else if (props.textAlign === 'right') {
    classes.push('items-end text-right')
  } else {
    classes.push('items-center text-center')
  }
  
  // Full height
  if (props.fullHeight) {
    classes.push('min-h-full')
  }
  
  // Padding
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  classes.push(paddingClasses[props.padding])
  
  return classes.join(' ')
})

const iconContainerClasses = computed(() => {
  const spacing = {
    tight: 'mb-2',
    normal: 'mb-4',
    loose: 'mb-6'
  }
  
  return spacing[props.spacing]
})

const iconClasses = computed(() => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }
  
  return `${sizes[props.size]} text-gray-400`
})

const contentClasses = computed(() => {
  const spacing = {
    tight: 'space-y-1',
    normal: 'space-y-2',
    loose: 'space-y-4'
  }
  
  return spacing[props.spacing]
})

const titleClasses = computed(() => {
  const sizes = {
    sm: 'text-base font-medium',
    md: 'text-lg font-medium',
    lg: 'text-xl font-semibold'
  }
  
  return `${sizes[props.size]} text-gray-900`
})

const descriptionClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }
  
  return `${sizes[props.size]} ${maxWidths[props.size]} text-gray-600`
})

const actionClasses = computed(() => {
  const spacing = {
    tight: 'mt-3',
    normal: 'mt-4',
    loose: 'mt-6'
  }
  
  return spacing[props.spacing]
})

const actionSize = computed(() => {
  return props.size === 'sm' ? 'sm' : 'md'
})

// Event handlers
const handleActionClick = () => {
  emit('action')
}
</script>