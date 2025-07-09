<template>
  <div class="relative flex items-start">
    <div class="flex items-center h-5">
      <input
        :id="checkboxId"
        ref="checkboxRef"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        :indeterminate="indeterminate"
        :class="checkboxClasses"
        type="checkbox"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>
    
    <div v-if="$slots.default || label" class="ml-3 text-sm">
      <label
        :for="checkboxId"
        :class="labelClasses"
      >
        <slot>{{ label }}</slot>
      </label>
      
      <p v-if="description" :class="descriptionClasses">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'

interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  disabled?: boolean
  required?: boolean
  indeterminate?: boolean
  error?: string
  size?: 'sm' | 'md' | 'lg'
  touchOptimized?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  touchOptimized: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const checkboxRef = ref<HTMLInputElement>()
const checkboxId = computed(() => props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`)
const hasError = computed(() => Boolean(props.error))

const checkboxClasses = computed(() => {
  const baseClasses = [
    'rounded border-gray-300 text-blue-600 transition-colors duration-200',
    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'h-4 w-4' : 'h-3 w-3',
    md: props.touchOptimized ? 'h-5 w-5' : 'h-4 w-4',
    lg: props.touchOptimized ? 'h-6 w-6' : 'h-5 w-5'
  }

  // State classes
  const stateClasses = hasError.value
    ? 'border-red-300 text-red-600 focus:ring-red-500'
    : 'border-gray-300 text-blue-600 focus:ring-blue-500'

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses
  ].join(' ')
})

const labelClasses = computed(() => {
  const baseClasses = ['font-medium cursor-pointer']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // State classes
  const stateClasses = props.disabled
    ? 'text-gray-400 cursor-not-allowed'
    : hasError.value
      ? 'text-red-900'
      : 'text-gray-900'

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses
  ].join(' ')
})

const descriptionClasses = computed(() => {
  const baseClasses = ['mt-1']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // State classes
  const stateClasses = props.disabled
    ? 'text-gray-400'
    : hasError.value
      ? 'text-red-600'
      : 'text-gray-500'

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses
  ].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

// Watch for indeterminate changes
watch(() => props.indeterminate, (newVal) => {
  if (checkboxRef.value) {
    checkboxRef.value.indeterminate = newVal
  }
}, { immediate: true })

// Public methods
const focus = async () => {
  await nextTick()
  checkboxRef.value?.focus()
}

const blur = () => {
  checkboxRef.value?.blur()
}

defineExpose({ focus, blur })
</script>