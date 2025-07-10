<template>
  <AuthLayout
    :title="errorTitle"
    :subtitle="errorSubtitle"
    :footer-links="footerLinks"
    @link-click="handleLinkClick"
  >
    <!-- Error content -->
    <div class="text-center space-y-6">
      <!-- Error icon -->
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full" :class="iconBackgroundClass">
        <Icon :name="errorIcon" size="32" :class="iconClass" />
      </div>
      
      <!-- Error details -->
      <div class="space-y-4">
        <!-- Error message -->
        <div class="text-sm text-gray-600">
          {{ errorMessage }}
        </div>
        
        <!-- Error code (if available) -->
        <div v-if="errorCode" class="text-xs text-gray-500 font-mono bg-gray-50 rounded px-3 py-2">
          Error Code: {{ errorCode }}
        </div>
        
        <!-- Troubleshooting steps -->
        <div v-if="showTroubleshooting" class="text-left bg-gray-50 rounded-lg p-4 mt-6">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Troubleshooting steps:</h4>
          <ul class="text-sm text-gray-600 space-y-2">
            <li v-for="step in troubleshootingSteps" :key="step" class="flex items-start">
              <span class="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2"></span>
              {{ step }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="space-y-3">
        <!-- Primary action -->
        <Button
          :variant="primaryAction.variant || 'primary'"
          size="lg"
          class="w-full"
          :loading="actionLoading"
          @click="handlePrimaryAction"
        >
          {{ primaryAction.label }}
        </Button>
        
        <!-- Secondary actions -->
        <div v-if="secondaryActions.length > 0" class="space-y-2">
          <Button
            v-for="action in secondaryActions"
            :key="action.key"
            :variant="action.variant || 'outline'"
            size="md"
            class="w-full"
            @click="handleSecondaryAction(action.key)"
          >
            {{ action.label }}
          </Button>
        </div>
      </div>
      
      <!-- Support contact -->
      <div v-if="showSupport" class="pt-6 border-t border-gray-200">
        <p class="text-sm text-gray-600 mb-3">
          Still having trouble?
        </p>
        <div class="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            icon="envelope"
            @click="handleContactSupport"
          >
            Contact Support
          </Button>
          <div class="text-xs text-gray-500">
            Our support team is here to help you resolve this issue.
          </div>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { Button, Icon } from '@/components/atoms'

interface Action {
  key: string
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

interface Link {
  key: string
  label: string
  href: string
}

interface LinkGroup {
  key: string
  title?: string
  links: Link[]
}

interface Props {
  // Error configuration
  errorType?: 'authentication' | 'authorization' | 'network' | 'server' | 'validation' | 'expired' | 'generic'
  errorCode?: string
  errorMessage?: string
  
  // Display options
  showTroubleshooting?: boolean
  showSupport?: boolean
  
  // Actions
  primaryAction?: Action
  secondaryActions?: Action[]
  
  // Support configuration
  supportEmail?: string
  supportUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  errorType: 'generic',
  showTroubleshooting: true,
  showSupport: true,
  primaryAction: () => ({ key: 'retry', label: 'Try Again', variant: 'primary' }),
  secondaryActions: () => [
    { key: 'login', label: 'Back to Sign In', variant: 'outline' },
    { key: 'home', label: 'Go to Home', variant: 'ghost' }
  ],
  supportEmail: 'support@kitchenpantrycrm.com',
  supportUrl: '/support'
})

const router = useRouter()
const route = useRoute()

const actionLoading = ref(false)

// Error configuration based on type
const errorConfig = computed(() => {
  const configs = {
    authentication: {
      title: 'Authentication Failed',
      subtitle: 'We couldn\'t verify your identity',
      message: 'Your login session has expired or your credentials are invalid. Please sign in again.',
      icon: 'shield-exclamation',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      troubleshooting: [
        'Check that your email and password are correct',
        'Clear your browser cache and cookies',
        'Try signing in from a different browser or device',
        'Reset your password if you\'ve forgotten it'
      ]
    },
    authorization: {
      title: 'Access Denied',
      subtitle: 'You don\'t have permission to access this resource',
      message: 'Your account doesn\'t have the required permissions to view this page. Contact your administrator for access.',
      icon: 'lock-closed',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      troubleshooting: [
        'Contact your system administrator',
        'Verify you have the correct role assigned',
        'Try accessing a different section of the application',
        'Sign out and sign back in to refresh your permissions'
      ]
    },
    network: {
      title: 'Connection Problem',
      subtitle: 'Unable to connect to our servers',
      message: 'There seems to be a problem with your internet connection. Please check your connection and try again.',
      icon: 'wifi',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      troubleshooting: [
        'Check your internet connection',
        'Try refreshing the page',
        'Disable any VPN or proxy connections',
        'Try again in a few minutes'
      ]
    },
    server: {
      title: 'Server Error',
      subtitle: 'Something went wrong on our end',
      message: 'We\'re experiencing technical difficulties. Our team has been notified and is working to resolve the issue.',
      icon: 'server',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      troubleshooting: [
        'Try refreshing the page',
        'Wait a few minutes and try again',
        'Clear your browser cache',
        'Contact support if the problem persists'
      ]
    },
    validation: {
      title: 'Invalid Request',
      subtitle: 'The information provided is not valid',
      message: 'The data you submitted contains errors or is incomplete. Please review and correct the information.',
      icon: 'exclamation-triangle',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      troubleshooting: [
        'Check all required fields are filled',
        'Verify the format of email addresses and phone numbers',
        'Ensure passwords meet the minimum requirements',
        'Remove any special characters that might cause issues'
      ]
    },
    expired: {
      title: 'Session Expired',
      subtitle: 'Your login session has timed out',
      message: 'For your security, you\'ve been signed out due to inactivity. Please sign in again to continue.',
      icon: 'clock',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      troubleshooting: [
        'Sign in again with your credentials',
        'Enable "Remember me" for longer sessions',
        'Consider upgrading to a premium account for extended sessions',
        'Contact support if sessions expire too quickly'
      ]
    },
    generic: {
      title: 'Something Went Wrong',
      subtitle: 'An unexpected error occurred',
      message: 'We encountered an unexpected problem. Please try again or contact support if the issue persists.',
      icon: 'exclamation-circle',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      troubleshooting: [
        'Try refreshing the page',
        'Clear your browser cache and cookies',
        'Try using a different browser',
        'Contact support with details about what you were doing'
      ]
    }
  }
  
  return configs[props.errorType] || configs.generic
})

// Computed properties
const errorTitle = computed(() => errorConfig.value.title)
const errorSubtitle = computed(() => errorConfig.value.subtitle)
const errorMessage = computed(() => props.errorMessage || errorConfig.value.message)
const errorIcon = computed(() => errorConfig.value.icon)
const iconBackgroundClass = computed(() => errorConfig.value.iconBg)
const iconClass = computed(() => errorConfig.value.iconColor)
const troubleshootingSteps = computed(() => errorConfig.value.troubleshooting)

// Footer links configuration
const footerLinks: LinkGroup[] = [
  {
    key: 'help',
    links: [
      {
        key: 'support',
        label: 'Contact Support',
        href: '/support'
      },
      {
        key: 'status',
        label: 'System Status',
        href: '/status'
      }
    ]
  }
]

// Event handlers
const handlePrimaryAction = async () => {
  actionLoading.value = true
  
  try {
    switch (props.primaryAction.key) {
      case 'retry':
        // Go back to previous page or refresh
        if (window.history.length > 1) {
          router.back()
        } else {
          window.location.reload()
        }
        break
      case 'login':
        await router.push('/auth/login')
        break
      case 'home':
        await router.push('/')
        break
      default:
        window.location.reload()
    }
  } catch (error) {
    console.error('Error handling primary action:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleSecondaryAction = async (actionKey: string) => {
  switch (actionKey) {
    case 'login':
      await router.push('/auth/login')
      break
    case 'register':
      await router.push('/auth/register')
      break
    case 'home':
      await router.push('/')
      break
    case 'support':
      handleContactSupport()
      break
    case 'refresh':
      window.location.reload()
      break
    default:
      console.warn(`Unknown action: ${actionKey}`)
  }
}

const handleLinkClick = (link: Link) => {
  if (link.key === 'support') {
    handleContactSupport()
  } else {
    router.push(link.href)
  }
}

const handleContactSupport = () => {
  // Prepare support email with error details
  const subject = encodeURIComponent(`Support Request: ${errorTitle.value}`)
  const body = encodeURIComponent(`
Hi Support Team,

I encountered an error while using Kitchen Pantry CRM:

Error Type: ${props.errorType}
Error Code: ${props.errorCode || 'N/A'}
Error Message: ${errorMessage.value}
Current URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please help me resolve this issue.

Thank you!
  `.trim())
  
  if (props.supportEmail) {
    window.location.href = `mailto:${props.supportEmail}?subject=${subject}&body=${body}`
  } else {
    router.push(props.supportUrl)
  }
}

// Initialize error from URL parameters
onMounted(() => {
  // Check for error parameters in URL
  const urlError = route.query.error as string
  const urlCode = route.query.code as string
  const urlMessage = route.query.message as string
  
  if (urlError && !props.errorType) {
    // Set error type from URL if not provided as prop
  }
  
  if (urlCode && !props.errorCode) {
    // Set error code from URL if not provided as prop
  }
  
  if (urlMessage && !props.errorMessage) {
    // Set error message from URL if not provided as prop
  }
})
</script>