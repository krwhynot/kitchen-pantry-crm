<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <!-- Page loading overlay -->
    <PageLoader v-if="loading" />
    
    <!-- Header section -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo and app name -->
      <div class="text-center">
        <img
          v-if="logoSrc"
          :src="logoSrc"
          :alt="logoAlt"
          class="mx-auto h-12 w-auto"
        />
        <h1 v-else class="text-3xl font-bold text-gray-900">
          {{ appName }}
        </h1>
        
        <!-- Page title -->
        <h2 v-if="title" class="mt-6 text-2xl font-bold text-gray-900">
          {{ title }}
        </h2>
        
        <!-- Page subtitle -->
        <p v-if="subtitle" class="mt-2 text-sm text-gray-600">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Main content area -->
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Content slot -->
        <slot />
        
        <!-- Footer links -->
        <div v-if="footerLinks.length > 0" class="mt-6 space-y-4">
          <div v-for="linkGroup in footerLinks" :key="linkGroup.key" class="text-center">
            <div v-if="linkGroup.title" class="text-sm font-medium text-gray-700 mb-2">
              {{ linkGroup.title }}
            </div>
            <div class="space-x-4">
              <a
                v-for="link in linkGroup.links"
                :key="link.key"
                :href="link.href"
                :class="linkClasses"
                @click="handleLinkClick(link)"
              >
                {{ link.label }}
              </a>
            </div>
          </div>
        </div>
        
        <!-- Alternative actions -->
        <div v-if="alternativeActions.length > 0" class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">{{ alternativeText }}</span>
            </div>
          </div>
          
          <div class="mt-6 grid grid-cols-1 gap-3">
            <Button
              v-for="action in alternativeActions"
              :key="action.key"
              :variant="action.variant || 'outline'"
              :size="action.size || 'md'"
              :icon="action.icon"
              :disabled="action.disabled"
              class="w-full justify-center"
              @click="handleAlternativeAction(action.key)"
            >
              {{ action.label }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="showFooter" class="mt-8 text-center text-sm text-gray-600">
      <div v-if="copyright" class="mb-2">
        {{ copyright }}
      </div>
      <div v-if="systemLinks.length > 0" class="space-x-4">
        <a
          v-for="link in systemLinks"
          :key="link.key"
          :href="link.href"
          :class="linkClasses"
          @click="handleSystemLinkClick(link)"
        >
          {{ link.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/atoms'
import PageLoader from '@/components/atoms/PageLoader/PageLoader.vue'

interface Link {
  key: string
  label: string
  href: string
  external?: boolean
}

interface LinkGroup {
  key: string
  title?: string
  links: Link[]
}

interface AlternativeAction {
  key: string
  label: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
}

interface Props {
  // App configuration
  appName?: string
  logoSrc?: string
  logoAlt?: string
  
  // Page content
  title?: string
  subtitle?: string
  
  // Footer configuration
  showFooter?: boolean
  copyright?: string
  footerLinks?: LinkGroup[]
  systemLinks?: Link[]
  
  // Alternative actions (e.g., social login, different auth methods)
  alternativeText?: string
  alternativeActions?: AlternativeAction[]
  
  // Loading state
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Kitchen Pantry CRM',
  logoAlt: 'Kitchen Pantry CRM',
  showFooter: true,
  copyright: '© 2024 Kitchen Pantry CRM. All rights reserved.',
  footerLinks: () => [],
  systemLinks: () => [
    { key: 'privacy', label: 'Privacy Policy', href: '/privacy' },
    { key: 'terms', label: 'Terms of Service', href: '/terms' },
    { key: 'support', label: 'Support', href: '/support' }
  ],
  alternativeText: 'Or continue with',
  alternativeActions: () => [],
  loading: false
})

const emit = defineEmits<{
  'link-click': [link: Link]
  'system-link-click': [link: Link]
  'alternative-action': [action: string]
}>()

const linkClasses = computed(() => [
  'text-indigo-600 hover:text-indigo-500',
  'font-medium transition-colors duration-200',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
  'rounded'
].join(' '))

const handleLinkClick = (link: Link) => {
  emit('link-click', link)
}

const handleSystemLinkClick = (link: Link) => {
  emit('system-link-click', link)
}

const handleAlternativeAction = (action: string) => {
  emit('alternative-action', action)
}
</script>