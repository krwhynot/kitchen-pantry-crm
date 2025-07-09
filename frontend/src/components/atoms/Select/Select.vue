<template>
  <div class="relative">
    <select
      :id="selectId"
      ref="selectRef"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :class="selectClasses"
      :aria-describedby="errorId"
      :aria-invalid="hasError"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    
    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
      <Icon name="chevron-down" class="h-5 w-5 text-gray-400" />
    </div>
    
    <div v-if="hasError" class="absolute inset-y-0 right-8 pr-3 flex items-center">
      <Icon name="exclamation-circle" class="h-5 w-5 text-red-500" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import Icon from '../Icon/Icon.vue'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  size?: 'sm' | 'md' | 'lg'
  touchOptimized?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  touchOptimized: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const selectRef = ref<HTMLSelectElement>()
const selectId = computed(() => props.id || `select-${Math.random().toString(36).substr(2, 9)}`)
const errorId = computed(() => `${selectId.value}-error`)
const hasError = computed(() => Boolean(props.error))

const selectClasses = computed(() => {
  const baseClasses = [
    'block w-full rounded-lg border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'appearance-none bg-white pr-10'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: props.touchOptimized ? 'px-4 py-3 text-base min-h-[48px]' : 'px-4 py-3 text-base',
    lg: props.touchOptimized ? 'px-5 py-4 text-lg min-h-[52px]' : 'px-5 py-4 text-lg'
  }

  // State classes
  const stateClasses = hasError.value
    ? 'border-red-300 text-red-900'
    : 'border-gray-300 text-gray-900'

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses
  ].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', event)
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
  selectRef.value?.focus()
}

const blur = () => {
  selectRef.value?.blur()
}

defineExpose({ focus, blur })
</script>