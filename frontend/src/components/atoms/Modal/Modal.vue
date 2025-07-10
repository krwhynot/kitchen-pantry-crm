<template>
  <Teleport to="body">
    <Transition
      name="modal"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="handleBackdropClick"
        @keydown.esc="handleEscape"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        <!-- Modal Container -->
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            ref="modalRef"
            :class="modalClasses"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
            @click.stop
          >
            <!-- Modal Header -->
            <div v-if="title || $slots.header || showCloseButton" :class="headerClasses">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- Title Slot or Prop -->
                  <slot name="header">
                    <h3 v-if="title" :id="titleId" :class="titleClasses">
                      {{ title }}
                    </h3>
                  </slot>
                </div>
                
                <!-- Close Button -->
                <div v-if="showCloseButton" class="ml-3 flex h-7 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="handleClose"
                    :aria-label="closeLabel"
                  >
                    <Icon name="x-mark" class="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <!-- Modal Body -->
            <div :class="bodyClasses">
              <slot>
                <p v-if="description" :id="descriptionId" class="text-sm text-gray-600">
                  {{ description }}
                </p>
              </slot>
            </div>

            <!-- Modal Footer -->
            <div v-if="$slots.footer || actions.length > 0" :class="footerClasses">
              <slot name="footer">
                <div class="flex justify-end space-x-3">
                  <Button
                    v-for="action in actions"
                    :key="action.key"
                    :variant="action.variant || 'secondary'"
                    :loading="action.loading"
                    :disabled="action.disabled"
                    @click="handleAction(action)"
                  >
                    <Icon v-if="action.icon" :name="action.icon" class="w-4 h-4 mr-2" />
                    {{ action.label }}
                  </Button>
                </div>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Button, Icon } from '@/components/atoms'

interface ModalAction {
  key: string
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: string
  loading?: boolean
  disabled?: boolean
}

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  closeLabel?: string
  actions?: ModalAction[]
  scrollable?: boolean
  centered?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  closeLabel: 'Close modal',
  actions: () => [],
  scrollable: true,
  centered: true,
  persistent: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  action: [action: ModalAction]
  opened: []
  closed: []
}>()

// Refs
const modalRef = ref<HTMLElement>()

// Computed
const titleId = computed(() => 'modal-title-' + Math.random().toString(36).substr(2, 9))
const descriptionId = computed(() => 'modal-description-' + Math.random().toString(36).substr(2, 9))

const modalClasses = computed(() => {
  const classes = [
    'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all',
    'w-full'
  ]
  
  // Size classes
  const sizeClasses = {
    xs: 'sm:max-w-xs',
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full: 'sm:max-w-full sm:m-4'
  }
  classes.push(sizeClasses[props.size])
  
  return classes.join(' ')
})

const headerClasses = computed(() => {
  const classes = ['px-4 py-3 sm:px-6 sm:py-4']
  
  if (!props.title && !props.description) {
    classes.push('border-b border-gray-200')
  }
  
  return classes.join(' ')
})

const titleClasses = computed(() => {
  return 'text-lg font-semibold text-gray-900'
})

const bodyClasses = computed(() => {
  const classes = ['px-4 py-3 sm:px-6 sm:py-4']
  
  if (props.scrollable) {
    classes.push('max-h-96 overflow-y-auto')
  }
  
  return classes.join(' ')
})

const footerClasses = computed(() => {
  return 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'
})

// Focus management
let previousActiveElement: Element | null = null

const trapFocus = () => {
  if (!modalRef.value) return
  
  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }
  
  document.addEventListener('keydown', handleTabKey)
  
  // Focus first element
  nextTick(() => {
    firstElement?.focus()
  })
  
  return () => {
    document.removeEventListener('keydown', handleTabKey)
  }
}

// Event handlers
const handleClose = () => {
  if (props.persistent) return
  
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

const handleEscape = () => {
  if (props.closeOnEscape) {
    handleClose()
  }
}

const handleAction = (action: ModalAction) => {
  emit('action', action)
}

// Transition handlers
const onEnter = () => {
  previousActiveElement = document.activeElement
  document.body.style.overflow = 'hidden'
}

const onAfterEnter = () => {
  const cleanup = trapFocus()
  emit('opened')
  
  // Store cleanup function for later
  if (modalRef.value) {
    (modalRef.value as any)._focusCleanup = cleanup
  }
}

const onBeforeLeave = () => {
  // Cleanup focus trap
  if (modalRef.value) {
    const cleanup = (modalRef.value as any)._focusCleanup
    if (cleanup) {
      cleanup()
    }
  }
}

const onAfterLeave = () => {
  document.body.style.overflow = ''
  
  // Restore focus
  if (previousActiveElement) {
    (previousActiveElement as HTMLElement).focus()
  }
  
  emit('closed')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      modalRef.value?.focus()
    })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.25s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>