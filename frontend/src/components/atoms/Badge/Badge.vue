<template>
  <span :class="badgeClasses">
    <Icon v-if="icon" :name="icon" :size="iconSize" class="mr-1" />
    <slot />
    <button
      v-if="dismissible"
      @click="handleDismiss"
      :class="dismissButtonClasses"
      aria-label="Dismiss"
    >
      <Icon name="x" :size="12" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icon/Icon.vue'

interface Props {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  dismissible?: boolean
  outlined?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  dismissible: false,
  outlined: false
})

const emit = defineEmits<{
  dismiss: []
}>()

const badgeClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center font-medium rounded-full',
    'transition-colors duration-200'
  ]

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  // Variant classes
  const variantClasses = {
    default: props.outlined 
      ? 'bg-gray-100 text-gray-800 border border-gray-300'
      : 'bg-gray-100 text-gray-800',
    primary: props.outlined
      ? 'bg-blue-50 text-blue-800 border border-blue-300'
      : 'bg-blue-100 text-blue-800',
    secondary: props.outlined
      ? 'bg-gray-50 text-gray-800 border border-gray-300'
      : 'bg-gray-200 text-gray-800',
    success: props.outlined
      ? 'bg-green-50 text-green-800 border border-green-300'
      : 'bg-green-100 text-green-800',
    warning: props.outlined
      ? 'bg-yellow-50 text-yellow-800 border border-yellow-300'
      : 'bg-yellow-100 text-yellow-800',
    danger: props.outlined
      ? 'bg-red-50 text-red-800 border border-red-300'
      : 'bg-red-100 text-red-800',
    info: props.outlined
      ? 'bg-blue-50 text-blue-800 border border-blue-300'
      : 'bg-blue-100 text-blue-800'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant]
  ].join(' ')
})

const dismissButtonClasses = computed(() => {
  const baseClasses = [
    'ml-1 inline-flex items-center justify-center rounded-full',
    'hover:bg-black hover:bg-opacity-20 focus:outline-none focus:ring-2',
    'focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
  ]

  // Size classes for dismiss button
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const iconSize = computed(() => {
  const sizes = { sm: 12, md: 14, lg: 16 }
  return sizes[props.size]
})

const handleDismiss = () => {
  emit('dismiss')
}
</script>