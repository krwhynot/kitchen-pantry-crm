<template>
  <div :class="fieldClasses">
    <label
      v-if="label"
      :for="fieldId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="mt-1 relative">
      <slot
        :id="fieldId"
        :error="error"
        :aria-describedby="helpId"
        :aria-invalid="Boolean(error)"
      >
        <Input
          :id="fieldId"
          v-model="modelValue"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :error="error"
          :size="size"
          :touch-optimized="touchOptimized"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
        />
      </slot>
    </div>
    
    <div v-if="helpText || error" class="mt-2">
      <p v-if="error" :id="helpId" :class="errorClasses">
        <Icon name="exclamation-circle" class="h-4 w-4 mr-1" />
        {{ error }}
      </p>
      <p v-else-if="helpText" :id="helpId" :class="helpClasses">
        {{ helpText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Input, Icon } from '@/components/atoms'

interface Props {
  modelValue?: string | number
  label?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'
  placeholder?: string
  helpText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
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

const fieldId = computed(() => props.id || `field-${Math.random().toString(36).substr(2, 9)}`)
const helpId = computed(() => `${fieldId.value}-help`)

const fieldClasses = computed(() => {
  const baseClasses = ['form-field']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const labelClasses = computed(() => {
  const baseClasses = ['block font-medium text-gray-700']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // State classes
  const stateClasses = props.disabled ? 'text-gray-400' : 'text-gray-700'

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses
  ].join(' ')
})

const helpClasses = computed(() => {
  const baseClasses = ['text-gray-500']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const errorClasses = computed(() => {
  const baseClasses = ['text-red-600 flex items-center']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
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
</script>