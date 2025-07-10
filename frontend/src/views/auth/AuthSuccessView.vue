<template>
  <AuthLayout
    :title="successTitle"
    :subtitle="successSubtitle"
    :footer-links="footerLinks"
    @link-click="handleLinkClick"
  >
    <!-- Success content -->
    <div class="text-center space-y-6">
      <!-- Success icon -->
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full" :class="iconBackgroundClass">
        <Icon :name="successIcon" size="32" :class="iconClass" />
      </div>
      
      <!-- Success details -->
      <div class="space-y-4">
        <!-- Main message -->
        <div class="text-sm text-gray-600">
          {{ successMessage }}
        </div>
        
        <!-- Additional information -->
        <div v-if="additionalInfo" class="text-xs text-gray-500 bg-gray-50 rounded-lg p-4">
          {{ additionalInfo }}
        </div>
        
        <!-- Next steps -->
        <div v-if="showNextSteps && nextSteps.length > 0" class="text-left bg-blue-50 rounded-lg p-4 mt-6">
          <h4 class="text-sm font-medium text-blue-900 mb-3">Next steps:</h4>
          <ol class="text-sm text-blue-700 space-y-2">
            <li v-for="(step, index) in nextSteps" :key="step" class="flex items-start">
              <span class="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mt-0.5 mr-3">
                {{ index + 1 }}
              </span>
              {{ step }}
            </li>
          </ol>
        </div>
        
        <!-- Auto-redirect countdown -->
        <div v-if="autoRedirect && countdown > 0" class="text-xs text-gray-500">
          Redirecting automatically in {{ countdown }} seconds...
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
      
      <!-- Additional help -->
      <div v-if="showHelp" class="pt-6 border-t border-gray-200">
        <p class="text-sm text-gray-600 mb-3">
          Need help getting started?
        </p>
        <div class="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            icon="book-open"
            @click="handleHelp"
          >
            View User Guide
          </Button>
          <div class="text-xs text-gray-500">
            Learn how to make the most of Kitchen Pantry CRM.
          </div>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  // Success configuration
  successType?: 'registration' | 'verification' | 'password-reset' | 'account-activated' | 'email-verified' | 'generic'
  successMessage?: string
  additionalInfo?: string
  
  // Display options
  showNextSteps?: boolean
  showHelp?: boolean
  
  // Actions
  primaryAction?: Action
  secondaryActions?: Action[]
  
  // Auto-redirect
  autoRedirect?: boolean
  redirectDelay?: number
  redirectTo?: string
  
  // Help configuration
  helpUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  successType: 'generic',
  showNextSteps: true,
  showHelp: true,
  primaryAction: () => ({ key: 'continue', label: 'Continue', variant: 'primary' }),
  secondaryActions: () => [],
  autoRedirect: false,
  redirectDelay: 5,
  redirectTo: '/dashboard',
  helpUrl: '/help'
})

const router = useRouter()
const route = useRoute()

const actionLoading = ref(false)
const countdown = ref(props.redirectDelay)
let redirectTimer: NodeJS.Timeout | null = null

// Success configuration based on type
const successConfig = computed(() => {
  const configs = {
    registration: {
      title: 'Welcome to Kitchen Pantry CRM!',
      subtitle: 'Your account has been created successfully',
      message: 'Thank you for joining Kitchen Pantry CRM. We\'ve sent a verification email to your inbox.',
      icon: 'check-circle',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      nextSteps: [
        'Check your email for a verification link',
        'Complete your profile setup',
        'Explore the dashboard and features',
        'Import your existing customer data'
      ],
      additionalInfo: 'You can start using Kitchen Pantry CRM right away, but some features require email verification.',
      primaryAction: { key: 'dashboard', label: 'Go to Dashboard', variant: 'primary' },
      secondaryActions: [
        { key: 'profile', label: 'Complete Profile', variant: 'outline' },
        { key: 'resend', label: 'Resend Verification Email', variant: 'ghost' }
      ]
    },
    verification: {
      title: 'Email Verified!',
      subtitle: 'Your email address has been confirmed',
      message: 'Great! Your email address has been verified. You now have full access to all Kitchen Pantry CRM features.',
      icon: 'shield-check',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      nextSteps: [
        'Complete your profile setup',
        'Set up your organization details',
        'Start adding customer contacts',
        'Explore reporting features'
      ],
      primaryAction: { key: 'dashboard', label: 'Go to Dashboard', variant: 'primary' },
      secondaryActions: [
        { key: 'profile', label: 'Complete Profile', variant: 'outline' }
      ]
    },
    'password-reset': {
      title: 'Password Updated!',
      subtitle: 'Your password has been changed successfully',
      message: 'Your password has been updated. You can now sign in with your new password.',
      icon: 'key',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      nextSteps: [
        'Sign in with your new password',
        'Update any saved passwords in your browser',
        'Consider enabling two-factor authentication',
        'Review your account security settings'
      ],
      primaryAction: { key: 'login', label: 'Sign In', variant: 'primary' },
      secondaryActions: [
        { key: 'security', label: 'Security Settings', variant: 'outline' }
      ]
    },
    'account-activated': {
      title: 'Account Activated!',
      subtitle: 'Your account is now active and ready to use',
      message: 'Your Kitchen Pantry CRM account has been activated. You have full access to all features.',
      icon: 'user-check',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      nextSteps: [
        'Complete your profile information',
        'Set up your organization',
        'Invite team members',
        'Import your customer database'
      ],
      primaryAction: { key: 'dashboard', label: 'Get Started', variant: 'primary' },
      secondaryActions: [
        { key: 'setup', label: 'Account Setup', variant: 'outline' }
      ]
    },
    'email-verified': {
      title: 'Email Confirmed!',
      subtitle: 'Your email change has been verified',
      message: 'Your new email address has been confirmed and updated in your account.',
      icon: 'envelope-check',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      nextSteps: [
        'Update your email in any connected applications',
        'Check your notification preferences',
        'Ensure you can receive important updates',
        'Consider updating your contact information'
      ],
      primaryAction: { key: 'dashboard', label: 'Continue', variant: 'primary' },
      secondaryActions: [
        { key: 'settings', label: 'Account Settings', variant: 'outline' }
      ]
    },
    generic: {
      title: 'Success!',
      subtitle: 'Your action was completed successfully',
      message: 'The operation completed successfully. You can now continue using Kitchen Pantry CRM.',
      icon: 'check-circle',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      nextSteps: [
        'Continue with your workflow',
        'Check your dashboard for updates',
        'Review any notifications',
        'Contact support if you need help'
      ],
      primaryAction: { key: 'dashboard', label: 'Continue', variant: 'primary' },
      secondaryActions: []
    }
  }
  
  return configs[props.successType] || configs.generic
})

// Computed properties
const successTitle = computed(() => successConfig.value.title)
const successSubtitle = computed(() => successConfig.value.subtitle)
const successMessage = computed(() => props.successMessage || successConfig.value.message)
const successIcon = computed(() => successConfig.value.icon)
const iconBackgroundClass = computed(() => successConfig.value.iconBg)
const iconClass = computed(() => successConfig.value.iconColor)
const nextSteps = computed(() => successConfig.value.nextSteps)

const primaryAction = computed(() => props.primaryAction || successConfig.value.primaryAction)
const secondaryActions = computed(() => {
  return props.secondaryActions.length > 0 ? props.secondaryActions : successConfig.value.secondaryActions
})

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
        key: 'docs',
        label: 'Documentation',
        href: '/docs'
      }
    ]
  }
]

// Auto-redirect functionality
const startAutoRedirect = () => {
  if (!props.autoRedirect) return
  
  redirectTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(redirectTimer!)
      router.push(props.redirectTo)
    }
  }, 1000)
}

const stopAutoRedirect = () => {
  if (redirectTimer) {
    clearInterval(redirectTimer)
    redirectTimer = null
  }
}

// Event handlers
const handlePrimaryAction = async () => {
  stopAutoRedirect()
  actionLoading.value = true
  
  try {
    switch (primaryAction.value.key) {
      case 'dashboard':
        await router.push('/dashboard')
        break
      case 'login':
        await router.push('/auth/login')
        break
      case 'profile':
        await router.push('/profile')
        break
      case 'setup':
        await router.push('/setup')
        break
      case 'continue':
        await router.push(props.redirectTo)
        break
      default:
        await router.push('/dashboard')
    }
  } catch (error) {
    console.error('Error handling primary action:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleSecondaryAction = async (actionKey: string) => {
  stopAutoRedirect()
  
  switch (actionKey) {
    case 'profile':
      await router.push('/profile')
      break
    case 'settings':
      await router.push('/settings')
      break
    case 'security':
      await router.push('/settings/security')
      break
    case 'setup':
      await router.push('/setup')
      break
    case 'resend':
      // Handle resend verification email
      // This would typically call an API endpoint
      console.log('Resending verification email...')
      break
    default:
      console.warn(`Unknown action: ${actionKey}`)
  }
}

const handleLinkClick = (link: Link) => {
  stopAutoRedirect()
  router.push(link.href)
}

const handleHelp = () => {
  stopAutoRedirect()
  router.push(props.helpUrl)
}

// Lifecycle
onMounted(() => {
  if (props.autoRedirect) {
    startAutoRedirect()
  }
})

onUnmounted(() => {
  stopAutoRedirect()
})
</script>