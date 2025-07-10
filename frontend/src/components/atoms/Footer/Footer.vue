<template>
  <footer class="bg-white" :class="containerClasses">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <!-- Left section: App info and links -->
        <div class="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
          <!-- App name and version -->
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-900">{{ appName }}</span>
            <span v-if="showVersion && version" class="text-xs text-gray-500">
              v{{ version }}
            </span>
          </div>
          
          <!-- Footer links -->
          <nav v-if="footerLinks.length > 0" class="flex flex-wrap gap-x-6 gap-y-2">
            <a
              v-for="link in footerLinks"
              :key="link.key"
              :href="link.href"
              :target="link.external ? '_blank' : undefined"
              :rel="link.external ? 'noopener noreferrer' : undefined"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              @click="handleLinkClick(link)"
            >
              {{ link.label }}
              <Icon 
                v-if="link.external" 
                name="arrow-top-right-on-square" 
                size="12" 
                class="inline ml-1" 
              />
            </a>
          </nav>
        </div>
        
        <!-- Right section: Copyright and system info -->
        <div class="flex flex-col space-y-2 lg:items-end lg:text-right">
          <!-- Copyright -->
          <div v-if="showCopyright && copyright" class="text-sm text-gray-500">
            {{ copyright }}
          </div>
          
          <!-- System information -->
          <div v-if="showSystemInfo" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <!-- Environment -->
            <span v-if="environment" class="flex items-center space-x-1">
              <Icon name="server" size="12" />
              <span>{{ environment }}</span>
            </span>
            
            <!-- Build info -->
            <span v-if="buildInfo" class="flex items-center space-x-1">
              <Icon name="code-bracket" size="12" />
              <span>{{ buildInfo }}</span>
            </span>
            
            <!-- Last updated -->
            <span v-if="lastUpdated" class="flex items-center space-x-1">
              <Icon name="clock" size="12" />
              <span>Updated {{ formatDate(lastUpdated) }}</span>
            </span>
            
            <!-- Status indicator -->
            <div v-if="showStatus" class="flex items-center space-x-1">
              <div 
                class="h-2 w-2 rounded-full"
                :class="statusClasses"
              ></div>
              <span>{{ statusText }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Legal section (if enabled) -->
      <div v-if="showLegalSection && legalLinks.length > 0" class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a
            v-for="link in legalLinks"
            :key="link.key"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noopener noreferrer' : undefined"
            class="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            @click="handleLegalLinkClick(link)"
          >
            {{ link.label }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@/components/atoms'

interface FooterLink {
  key: string
  label: string
  href: string
  external?: boolean
}

interface Props {
  // App information
  appName?: string
  version?: string
  copyright?: string
  
  // Links
  footerLinks?: FooterLink[]
  legalLinks?: FooterLink[]
  
  // Display options
  showVersion?: boolean
  showCopyright?: boolean
  showSystemInfo?: boolean
  showLegalSection?: boolean
  showStatus?: boolean
  
  // System information
  environment?: string
  buildInfo?: string
  lastUpdated?: string | Date
  
  // Status
  status?: 'online' | 'maintenance' | 'degraded' | 'offline'
  statusText?: string
  
  // Styling
  variant?: 'default' | 'minimal' | 'detailed'
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Kitchen Pantry CRM',
  version: '1.0.0',
  copyright: '© 2024 Kitchen Pantry CRM. All rights reserved.',
  footerLinks: () => [
    { key: 'about', label: 'About', href: '/about' },
    { key: 'contact', label: 'Contact', href: '/contact' },
    { key: 'help', label: 'Help', href: '/help' }
  ],
  legalLinks: () => [
    { key: 'privacy', label: 'Privacy Policy', href: '/privacy' },
    { key: 'terms', label: 'Terms of Service', href: '/terms' },
    { key: 'cookies', label: 'Cookie Policy', href: '/cookies' }
  ],
  showVersion: true,
  showCopyright: true,
  showSystemInfo: false,
  showLegalSection: false,
  showStatus: false,
  status: 'online',
  statusText: 'All systems operational',
  variant: 'default'
})

const emit = defineEmits<{
  'link-click': [link: FooterLink]
  'legal-link-click': [link: FooterLink]
}>()

const containerClasses = computed(() => {
  const variants = {
    default: 'border-t border-gray-200',
    minimal: '',
    detailed: 'border-t border-gray-200 bg-gray-50'
  }
  
  return variants[props.variant]
})

const statusClasses = computed(() => {
  const statusStyles = {
    online: 'bg-green-400',
    maintenance: 'bg-yellow-400',
    degraded: 'bg-orange-400',
    offline: 'bg-red-400'
  }
  
  return statusStyles[props.status]
})

const formatDate = (date: string | Date): string => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return dateObj.toLocaleDateString()
}

const handleLinkClick = (link: FooterLink) => {
  emit('link-click', link)
}

const handleLegalLinkClick = (link: FooterLink) => {
  emit('legal-link-click', link)
}
</script>