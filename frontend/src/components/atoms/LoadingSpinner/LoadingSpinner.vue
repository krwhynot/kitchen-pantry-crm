<template>
  <div
    :class="spinnerClasses"
    role="status"
    :aria-label="ariaLabel"
  >
    <svg
      :class="svgClasses"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        :class="circleClasses"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        :class="pathClasses"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span v-if="showText" :class="textClasses">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  showText?: boolean
  text?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  showText: false,
  text: 'Loading...',
  ariaLabel: 'Loading'
})

const spinnerClasses = computed(() => {
  const baseClasses = ['inline-flex items-center']
  
  if (props.showText) {
    baseClasses.push('space-x-2')
  }
  
  return baseClasses.join(' ')
})

const svgClasses = computed(() => {
  const baseClasses = ['animate-spin']
  
  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  
  // Color classes
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  }
  
  return [
    ...baseClasses,
    sizeClasses[props.size],
    colorClasses[props.color]
  ].join(' ')
})

const circleClasses = computed(() => {
  return 'opacity-25'
})

const pathClasses = computed(() => {
  return 'opacity-75'
})

const textClasses = computed(() => {
  const baseClasses = ['text-sm']
  
  // Color classes for text
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  }
  
  return [
    ...baseClasses,
    colorClasses[props.color]
  ].join(' ')
})
</script>