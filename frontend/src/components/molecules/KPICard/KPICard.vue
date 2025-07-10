<template>
  <div
    class="group cursor-pointer transition-all duration-200 hover:scale-105"
    @click="handleClick"
  >
    <div class="flex items-center justify-between mb-4">
      <div :class="iconClasses">
        <Icon :name="icon" class="h-6 w-6" />
      </div>
      <div v-if="trend" class="flex items-center space-x-1">
        <Icon
          :name="trendIcon"
          :class="trendIconClasses"
          class="h-4 w-4"
        />
        <span :class="changeClasses" class="text-sm font-medium">
          {{ change }}
        </span>
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
        {{ formattedValue }}
      </div>
      
      <div v-if="subtitle" class="text-sm text-gray-600">
        {{ subtitle }}
      </div>
      
      <div v-if="description" class="text-xs text-gray-500">
        {{ description }}
      </div>
    </div>

    <!-- Additional metrics row -->
    <div v-if="$slots.metrics" class="mt-4 pt-4 border-t border-gray-100">
      <slot name="metrics" />
    </div>

    <!-- Action button or link -->
    <div v-if="actionLabel" class="mt-4">
      <span class="text-sm text-blue-600 group-hover:text-blue-800 font-medium transition-colors">
        {{ actionLabel }} →
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@/components/atoms'

interface Props {
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald' | 'indigo'
  change?: string
  trend?: 'up' | 'down' | 'stable'
  subtitle?: string
  description?: string
  actionLabel?: string
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  trend: undefined,
  change: undefined
})

const emit = defineEmits<{
  click: []
}>()

// Computed properties
const formattedValue = computed(() => {
  let value = props.value.toString()
  
  if (props.prefix) {
    value = props.prefix + value
  }
  
  if (props.suffix) {
    value = value + props.suffix
  }
  
  return value
})

const iconClasses = computed(() => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg p-3'
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  }
  
  return `${baseClasses} ${colorClasses[props.color]}`
})

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'arrow-trending-up'
    case 'down':
      return 'arrow-trending-down'
    case 'stable':
      return 'minus'
    default:
      return 'minus'
  }
})

const trendIconClasses = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'text-green-500'
    case 'down':
      return 'text-red-500'
    case 'stable':
      return 'text-gray-400'
    default:
      return 'text-gray-400'
  }
})

const changeClasses = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'stable':
      return 'text-gray-500'
    default:
      return 'text-gray-500'
  }
})

// Event handlers
const handleClick = () => {
  emit('click')
}
</script>