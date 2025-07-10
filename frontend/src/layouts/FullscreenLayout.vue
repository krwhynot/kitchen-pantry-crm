<template>
  <div class="min-h-screen flex flex-col" :class="backgroundClasses">
    <!-- Page loading overlay -->
    <PageLoader v-if="loading" />
    
    <!-- Optional header -->
    <header v-if="showHeader" class="flex-shrink-0" :class="headerClasses">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <!-- Left section: Logo/title -->
        <div class="flex items-center space-x-4">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            :alt="logoAlt"
            class="h-8 w-auto"
          />
          <span v-else-if="appName" class="text-xl font-bold text-gray-900">
            {{ appName }}
          </span>
        </div>
        
        <!-- Center section: Title -->
        <div v-if="title" class="flex-1 text-center">
          <h1 class="text-lg font-semibold text-gray-900">{{ title }}</h1>
        </div>
        
        <!-- Right section: Actions -->
        <div class="flex items-center space-x-2">
          <Button
            v-for="action in headerActions"
            :key="action.key"
            :variant="action.variant || 'ghost'"
            :size="action.size || 'sm'"
            :icon="action.icon"
            :disabled="action.disabled"
            @click="handleHeaderAction(action.key)"
          >
            {{ action.label }}
          </Button>
          
          <!-- Close button -->
          <Button
            v-if="showCloseButton"
            variant="ghost"
            size="sm"
            icon="x-mark"
            @click="handleClose"
            :aria-label="'Close'"
          />
        </div>
      </div>
    </header>
    
    <!-- Main content area -->
    <main class="flex-1 flex flex-col" :class="contentClasses">
      <!-- Content container -->
      <div class="flex-1 flex flex-col" :class="containerClasses">
        <slot />
      </div>
    </main>
    
    <!-- Optional footer -->
    <footer v-if="showFooter" class="flex-shrink-0" :class="footerClasses">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Footer content -->
          <div v-if="footerContent" class="text-sm text-gray-600">
            {{ footerContent }}
          </div>
          
          <!-- Footer actions -->
          <div v-if="footerActions.length > 0" class="flex items-center space-x-2">
            <Button
              v-for="action in footerActions"
              :key="action.key"
              :variant="action.variant || 'outline'"
              :size="action.size || 'sm'"
              :icon="action.icon"
              :disabled="action.disabled"
              @click="handleFooterAction(action.key)"
            >
              {{ action.label }}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/atoms'
import PageLoader from '@/components/atoms/PageLoader/PageLoader.vue'

interface Action {
  key: string
  label: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
}

interface Props {
  // App configuration
  appName?: string
  logoSrc?: string
  logoAlt?: string
  title?: string
  
  // Layout configuration
  showHeader?: boolean
  showFooter?: boolean
  showCloseButton?: boolean
  
  // Styling
  theme?: 'light' | 'dark' | 'transparent'
  centered?: boolean
  padded?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  
  // Header configuration
  headerActions?: Action[]
  
  // Footer configuration
  footerContent?: string
  footerActions?: Action[]
  
  // Loading state
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Kitchen Pantry CRM',
  logoAlt: 'Kitchen Pantry CRM',
  showHeader: false,
  showFooter: false,
  showCloseButton: true,
  theme: 'light',
  centered: false,
  padded: true,
  maxWidth: 'full',
  headerActions: () => [],
  footerActions: () => [],
  loading: false
})

const emit = defineEmits<{
  'header-action': [action: string]
  'footer-action': [action: string]
  'close': []
}>()

const backgroundClasses = computed(() => {
  const themeClasses = {
    light: 'bg-white',
    dark: 'bg-gray-900',
    transparent: 'bg-transparent'
  }
  
  return themeClasses[props.theme]
})

const headerClasses = computed(() => {
  const themeClasses = {
    light: 'bg-white border-b border-gray-200',
    dark: 'bg-gray-800 border-b border-gray-700',
    transparent: 'bg-transparent'
  }
  
  return themeClasses[props.theme]
})

const footerClasses = computed(() => {
  const themeClasses = {
    light: 'bg-white border-t border-gray-200',
    dark: 'bg-gray-800 border-t border-gray-700',
    transparent: 'bg-transparent'
  }
  
  return themeClasses[props.theme]
})

const contentClasses = computed(() => {
  const classes = []
  
  if (props.centered) {
    classes.push('items-center justify-center')
  }
  
  if (props.padded) {
    classes.push('p-4 sm:p-6 lg:p-8')
  }
  
  return classes.join(' ')
})

const containerClasses = computed(() => {
  const classes = ['w-full']
  
  if (props.maxWidth !== 'full') {
    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl'
    }
    classes.push(maxWidthClasses[props.maxWidth], 'mx-auto')
  }
  
  return classes.join(' ')
})

const handleHeaderAction = (action: string) => {
  emit('header-action', action)
}

const handleFooterAction = (action: string) => {
  emit('footer-action', action)
}

const handleClose = () => {
  emit('close')
}
</script>