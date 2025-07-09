<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
    :aria-label="ariaLabel"
  >
    <Icon v-if="icon && !loading" :name="icon" :size="iconSize" />
    <LoadingSpinner v-if="loading" :size="iconSize" />
    <span v-if="$slots.default" :class="textClasses">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icon/Icon.vue'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
  touchOptimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  touchOptimized: true
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: props.touchOptimized ? 'px-4 py-2 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: props.touchOptimized ? 'px-6 py-3 text-lg min-h-[52px]' : 'px-6 py-3 text-lg',
    xl: props.touchOptimized ? 'px-8 py-4 text-xl min-h-[56px]' : 'px-8 py-4 text-xl'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant]
  ].join(' ')
})

const iconSize = computed(() => {
  const sizes = { sm: 16, md: 20, lg: 24, xl: 28 }
  return sizes[props.size]
})

const textClasses = computed(() => {
  return props.icon ? 'ml-2' : ''
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>