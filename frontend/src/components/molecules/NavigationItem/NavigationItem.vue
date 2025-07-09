<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :class="itemClasses"
    @click="handleClick"
    :aria-current="isActive ? 'page' : undefined"
  >
    <Icon v-if="icon" :name="icon" :size="iconSize" :class="iconClasses" />
    
    <span :class="textClasses">
      <slot>{{ label }}</slot>
    </span>
    
    <Badge
      v-if="badge"
      :variant="badgeVariant"
      size="sm"
      :class="badgeClasses"
    >
      {{ badge }}
    </Badge>
    
    <Icon
      v-if="hasSubitems"
      name="chevron-down"
      :size="12"
      :class="chevronClasses"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon, Badge } from '@/components/atoms'

interface Props {
  label?: string
  icon?: string
  to?: string
  href?: string
  active?: boolean
  disabled?: boolean
  badge?: string | number
  badgeVariant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'pill'
  hasSubitems?: boolean
  touchOptimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  badgeVariant: 'default',
  touchOptimized: true
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const tag = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})

const isActive = computed(() => {
  // In a real app, this would check the current route
  return props.active
})

const itemClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center font-medium rounded-md transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'px-2 py-1 text-sm min-h-[40px]' : 'px-2 py-1 text-sm',
    md: props.touchOptimized ? 'px-3 py-2 text-base min-h-[44px]' : 'px-3 py-2 text-base',
    lg: props.touchOptimized ? 'px-4 py-3 text-lg min-h-[48px]' : 'px-4 py-3 text-lg'
  }

  // Variant classes
  const variantClasses = {
    default: 'w-full justify-start',
    compact: 'justify-center',
    pill: 'justify-center rounded-full'
  }

  // State classes
  const stateClasses = isActive.value
    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    : props.disabled
      ? 'text-gray-400 cursor-not-allowed'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'

  return [
    ...baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant],
    stateClasses
  ].join(' ')
})

const iconClasses = computed(() => {
  const baseClasses = ['flex-shrink-0']
  
  // Spacing classes
  const spacingClasses = props.variant === 'compact' ? '' : 'mr-2'
  
  // Color classes
  const colorClasses = isActive.value
    ? 'text-blue-600'
    : props.disabled
      ? 'text-gray-400'
      : 'text-gray-500'

  return [
    ...baseClasses,
    spacingClasses,
    colorClasses
  ].join(' ')
})

const textClasses = computed(() => {
  const baseClasses = ['truncate']
  
  // Hide text in compact variant
  if (props.variant === 'compact') {
    baseClasses.push('sr-only')
  }
  
  return baseClasses.join(' ')
})

const badgeClasses = computed(() => {
  const baseClasses = ['ml-auto']
  
  // Hide badge in compact variant
  if (props.variant === 'compact') {
    baseClasses.push('hidden')
  }
  
  return baseClasses.join(' ')
})

const chevronClasses = computed(() => {
  const baseClasses = ['ml-auto transition-transform duration-200']
  
  // Hide chevron in compact variant
  if (props.variant === 'compact') {
    baseClasses.push('hidden')
  }
  
  // Color classes
  const colorClasses = isActive.value
    ? 'text-blue-600'
    : props.disabled
      ? 'text-gray-400'
      : 'text-gray-500'

  return [
    ...baseClasses,
    colorClasses
  ].join(' ')
})

const iconSize = computed(() => {
  const sizes = { sm: 16, md: 20, lg: 24 }
  return sizes[props.size]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>