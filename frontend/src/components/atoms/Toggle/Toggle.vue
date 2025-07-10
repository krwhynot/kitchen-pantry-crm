<template>
  <label :class="labelClasses">
    <!-- Hidden Input -->
    <input
      :id="id"
      ref="input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="sr-only"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <!-- Toggle Switch -->
    <div :class="switchClasses" :aria-describedby="describedBy">
      <!-- Toggle Circle -->
      <div :class="circleClasses">
        <!-- Loading Spinner -->
        <div v-if="loading" class="flex items-center justify-center">
          <div class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
        
        <!-- Icons -->
        <template v-else-if="showIcons">
          <Icon
            v-if="modelValue"
            :name="onIcon"
            :class="iconClasses"
          />
          <Icon
            v-else
            :name="offIcon"
            :class="iconClasses"
          />
        </template>
      </div>
    </div>
    
    <!-- Label Text -->
    <div v-if="label || $slots.default" :class="textClasses">
      <slot>{{ label }}</slot>
    </div>
    
    <!-- Description -->
    <div v-if="description || helpText" :class="descriptionClasses">
      {{ description || helpText }}
    </div>
  </label>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@/components/atoms'

interface Props {
  modelValue: boolean
  id?: string
  label?: string
  description?: string
  helpText?: string
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  showIcons?: boolean
  onIcon?: string
  offIcon?: string
  labelPosition?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'blue',
  showIcons: false,
  onIcon: 'check',
  offIcon: 'x-mark',
  labelPosition: 'right'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// Refs
const input = ref<HTMLInputElement>()
const isFocused = ref(false)

// Computed
const describedBy = computed(() => {
  if (props.description || props.helpText) {
    return `${props.id}-description`
  }
  return undefined
})

const labelClasses = computed(() => {
  const classes = ['relative inline-flex items-center cursor-pointer']
  
  if (props.disabled) {
    classes.push('cursor-not-allowed opacity-50')
  }
  
  if (props.labelPosition === 'left') {
    classes.push('flex-row-reverse')
  }
  
  return classes.join(' ')
})

const switchClasses = computed(() => {
  const classes = ['relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus-within:outline-none']
  
  // Size classes
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-14'
  }
  classes.push(sizeClasses[props.size])
  
  // State and color classes
  if (props.disabled) {
    classes.push('bg-gray-200')
  } else if (props.modelValue) {
    const activeColors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-600',
      red: 'bg-red-600'
    }
    classes.push(activeColors[props.color])
  } else {
    classes.push('bg-gray-200')
  }
  
  // Focus ring
  if (isFocused.value) {
    const focusColors = {
      blue: 'ring-2 ring-blue-500 ring-offset-2',
      green: 'ring-2 ring-green-500 ring-offset-2',
      purple: 'ring-2 ring-purple-500 ring-offset-2',
      orange: 'ring-2 ring-orange-500 ring-offset-2',
      red: 'ring-2 ring-red-500 ring-offset-2'
    }
    classes.push(focusColors[props.color])
  }
  
  return classes.join(' ')
})

const circleClasses = computed(() => {
  const classes = ['pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 flex items-center justify-center']
  
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  classes.push(sizeClasses[props.size])
  
  // Position classes
  if (props.modelValue) {
    const translateClasses = {
      sm: 'translate-x-4',
      md: 'translate-x-5',
      lg: 'translate-x-7'
    }
    classes.push(translateClasses[props.size])
  } else {
    classes.push('translate-x-0')
  }
  
  return classes.join(' ')
})

const iconClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  }
  
  const colorClass = props.modelValue ? 'text-blue-600' : 'text-gray-400'
  
  return `${sizeClasses[props.size]} ${colorClass}`
})

const textClasses = computed(() => {
  const classes = ['text-sm font-medium text-gray-900']
  
  const spacingClasses = {
    left: props.labelPosition === 'left' ? 'mr-3' : 'ml-3',
    right: props.labelPosition === 'right' ? 'ml-3' : 'mr-3'
  }
  classes.push(spacingClasses[props.labelPosition])
  
  return classes.join(' ')
})

const descriptionClasses = computed(() => {
  const classes = ['text-xs text-gray-500 mt-1']
  
  if (props.labelPosition === 'left') {
    classes.push('mr-3')
  } else {
    classes.push('ml-3')
  }
  
  return classes.join(' ')
})

// Event handlers
const handleChange = (event: Event) => {
  if (props.disabled || props.loading) return
  
  const target = event.target as HTMLInputElement
  const value = target.checked
  
  emit('update:modelValue', value)
  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

// Public methods
const focus = () => {
  input.value?.focus()
}

const blur = () => {
  input.value?.blur()
}

defineExpose({
  focus,
  blur
})
</script>