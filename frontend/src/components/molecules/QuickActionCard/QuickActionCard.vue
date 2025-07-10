<template>
  <div
    class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    @click="handleClick"
  >
    <!-- Background Gradient -->
    <div :class="backgroundClasses" />
    
    <!-- Content -->
    <div class="relative p-6">
      <!-- Icon -->
      <div :class="iconContainerClasses">
        <Icon :name="icon" class="h-6 w-6" />
      </div>
      
      <!-- Content -->
      <div class="mt-4">
        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
          {{ title }}
        </h3>
        <p class="mt-2 text-sm text-gray-600 group-hover:text-gray-500 transition-colors">
          {{ description }}
        </p>
      </div>
      
      <!-- Action Arrow -->
      <div class="mt-4 flex items-center justify-end">
        <Icon
          name="arrow-right"
          class="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200"
        />
      </div>
    </div>
    
    <!-- Hover Effect -->
    <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@/components/atoms'

interface Props {
  title: string
  description: string
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald' | 'indigo' | 'pink'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  disabled: false
})

const emit = defineEmits<{
  click: []
}>()

// Computed properties
const backgroundClasses = computed(() => {
  const gradients: Record<string, string> = {
    blue: 'absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-50',
    green: 'absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-50',
    purple: 'absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 opacity-50',
    orange: 'absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-50',
    red: 'absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 opacity-50',
    emerald: 'absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 opacity-50',
    indigo: 'absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100 opacity-50',
    pink: 'absolute inset-0 bg-gradient-to-br from-pink-50 to-pink-100 opacity-50'
  }
  
  return gradients[props.color] || gradients.blue
})

const iconContainerClasses = computed(() => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg p-3'
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    pink: 'bg-pink-500 text-white'
  }
  
  return `${baseClasses} ${colorClasses[props.color]}`
})

// Event handlers
const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>