<template>
  <div :class="avatarClasses">
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt"
      :class="imageClasses"
      @error="handleImageError"
    />
    
    <div v-else-if="initials" :class="initialsClasses">
      {{ initials }}
    </div>
    
    <Icon v-else name="user" :size="iconSize" :class="iconClasses" />
    
    <!-- Status indicator -->
    <div v-if="status" :class="statusClasses">
      <div :class="statusDotClasses" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'

interface Props {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  initials?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  rounded?: 'full' | 'lg' | 'md' | 'sm'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  rounded: 'full'
})

const imageError = ref(false)

const avatarClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-center bg-gray-500 overflow-hidden relative',
    'flex-shrink-0'
  ]

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
    '2xl': 'w-16 h-16'
  }

  // Rounded classes
  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    sm: 'rounded-sm'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    roundedClasses[props.rounded]
  ].join(' ')
})

const imageClasses = computed(() => {
  return 'w-full h-full object-cover'
})

const initialsClasses = computed(() => {
  const baseClasses = ['text-white font-medium select-none']

  // Size classes for initials
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const iconClasses = computed(() => {
  return 'text-white'
})

const iconSize = computed(() => {
  const sizes = { xs: 12, sm: 16, md: 20, lg: 24, xl: 28, '2xl': 32 }
  return sizes[props.size]
})

const statusClasses = computed(() => {
  const baseClasses = ['absolute bottom-0 right-0 rounded-full ring-2 ring-white']

  // Size classes for status indicator
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-4 h-4'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const statusDotClasses = computed(() => {
  const baseClasses = ['w-full h-full rounded-full']

  // Status color classes
  const statusClasses = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400'
  }

  return [
    ...baseClasses,
    statusClasses[props.status!]
  ].join(' ')
})

const handleImageError = () => {
  imageError.value = true
}

// Generate initials from name
const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

defineExpose({ generateInitials })
</script>