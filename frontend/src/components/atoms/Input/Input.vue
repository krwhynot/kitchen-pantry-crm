<template>
  <div class="relative">
    <input
      :id="inputId"
      ref="inputRef"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="inputClasses"
      :aria-describedby="errorId"
      :aria-invalid="hasError"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    
    <div v-if="icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon :name="icon" class="h-5 w-5 text-gray-400" />
    </div>
    
    <div v-if="hasError" class="absolute inset-y-0 right-0 pr-3 flex items-center">
      <Icon name="exclamation-circle" class="h-5 w-5 text-red-500" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import Icon from '../Icon/Icon.vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  icon?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  touchOptimized?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  touchOptimized: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  input: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputRef = ref<HTMLInputElement>()
const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)
const errorId = computed(() => `${inputId.value}-error`)
const hasError = computed(() => Boolean(props.error))

const inputClasses = computed(() => {
  const baseClasses = [
    'block w-full rounded-lg border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: props.touchOptimized ? 'px-4 py-3 text-base min-h-[48px]' : 'px-4 py-3 text-base',
    lg: props.touchOptimized ? 'px-5 py-4 text-lg min-h-[52px]' : 'px-5 py-4 text-lg'
  }

  // State classes
  const stateClasses = hasError.value
    ? 'border-red-300 text-red-900 placeholder-red-300'
    : 'border-gray-300 text-gray-900 placeholder-gray-400'

  // Icon padding
  const iconClasses = props.icon ? 'pl-10' : ''

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses,
    iconClasses
  ].join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? parseFloat(target.value) || 0 : target.value
  emit('update:modelValue', value)
  emit('input', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

// Public methods
const focus = async () => {
  await nextTick()
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

defineExpose({ focus, blur })
</script>