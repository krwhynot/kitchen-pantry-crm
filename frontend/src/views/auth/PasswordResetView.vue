<template>
  <AuthLayout
    :title="isResetMode ? 'Reset your password' : 'Forgot your password?'"
    :subtitle="isResetMode ? 'Enter your new password below.' : 'Enter your email address and we\'ll send you a reset link.'"
    :loading="loading"
    :footer-links="footerLinks"
    @link-click="handleLinkClick"
  >
    <!-- Email form (initial step) -->
    <form v-if="!isResetMode && !emailSent" @submit.prevent="handleEmailSubmit" class="space-y-6">
      <!-- Email field -->
      <FormField
        id="email"
        label="Email address"
        :required="true"
        :error="errors.email"
        helper-text="We'll send a password reset link to this email address."
      >
        <Input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="Enter your email address"
          :disabled="loading"
          :error="!!errors.email"
          @blur="validateField('email')"
        />
      </FormField>

      <!-- Submit button -->
      <Button
        type="submit"
        variant="primary"
        size="lg"
        :loading="loading"
        :disabled="!form.email || !!errors.email || loading"
        class="w-full"
      >
        {{ loading ? 'Sending...' : 'Send reset link' }}
      </Button>

      <!-- Error message -->
      <div v-if="error" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <Icon name="exclamation-triangle" size="20" class="text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Error sending reset link
            </h3>
            <div class="mt-2 text-sm text-red-700">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- Email sent confirmation -->
    <div v-else-if="emailSent && !isResetMode" class="text-center space-y-6">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <Icon name="check" size="24" class="text-green-600" />
      </div>
      
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Check your email
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          We've sent a password reset link to <span class="font-medium">{{ form.email }}</span>
        </p>
        <p class="text-xs text-gray-500">
          Didn't receive the email? Check your spam folder or try again.
        </p>
      </div>

      <div class="space-y-3">
        <Button
          variant="primary"
          size="lg"
          class="w-full"
          @click="handleResendEmail"
          :loading="resending"
          :disabled="resending || resendCooldown > 0"
        >
          {{ resending ? 'Resending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email' }}
        </Button>
      </div>
    </div>

    <!-- Password reset form -->
    <form v-else-if="isResetMode" @submit.prevent="handlePasswordReset" class="space-y-6">
      <!-- New password field -->
      <FormField
        id="newPassword"
        label="New password"
        :required="true"
        :error="errors.newPassword"
      >
        <Input
          id="newPassword"
          v-model="form.newPassword"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Enter your new password"
          :disabled="loading"
          :error="!!errors.newPassword"
          @blur="validateField('newPassword')"
        >
          <template #suffix>
            <Button
              variant="ghost"
              size="sm"
              :icon="showPassword ? 'eye-slash' : 'eye'"
              @click="togglePasswordVisibility"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            />
          </template>
        </Input>
        
        <!-- Password strength indicator -->
        <div v-if="form.newPassword" class="mt-2">
          <div class="flex space-x-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full"
              :class="getPasswordStrengthClass(i)"
            ></div>
          </div>
          <p class="text-xs mt-1" :class="getPasswordStrengthTextClass()">
            {{ passwordStrengthText }}
          </p>
        </div>
      </FormField>

      <!-- Confirm password field -->
      <FormField
        id="confirmPassword"
        label="Confirm new password"
        :required="true"
        :error="errors.confirmPassword"
      >
        <Input
          id="confirmPassword"
          v-model="form.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Confirm your new password"
          :disabled="loading"
          :error="!!errors.confirmPassword"
          @blur="validateField('confirmPassword')"
        >
          <template #suffix>
            <Button
              variant="ghost"
              size="sm"
              :icon="showConfirmPassword ? 'eye-slash' : 'eye'"
              @click="toggleConfirmPasswordVisibility"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            />
          </template>
        </Input>
      </FormField>

      <!-- Submit button -->
      <Button
        type="submit"
        variant="primary"
        size="lg"
        :loading="loading"
        :disabled="!isPasswordFormValid || loading"
        class="w-full"
      >
        {{ loading ? 'Updating password...' : 'Update password' }}
      </Button>

      <!-- Error message -->
      <div v-if="error" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <Icon name="exclamation-triangle" size="20" class="text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Password reset failed
            </h3>
            <div class="mt-2 text-sm text-red-700">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { FormField } from '@/components/molecules'
import { Button, Input, Icon } from '@/components/atoms'

interface PasswordResetForm {
  email: string
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  newPassword?: string
  confirmPassword?: string
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

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form state
const form = reactive<PasswordResetForm>({
  email: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = reactive<FormErrors>({})
const loading = ref(false)
const error = ref<string | null>(null)
const emailSent = ref(false)
const resending = ref(false)
const resendCooldown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Check if we're in reset mode (have token in URL)
const isResetMode = computed(() => {
  return !!route.query.token
})

// Footer links configuration
const footerLinks: LinkGroup[] = [
  {
    key: 'auth',
    links: [
      {
        key: 'login',
        label: 'Back to sign in',
        href: '/auth/login'
      },
      {
        key: 'register',
        label: 'Create new account',
        href: '/auth/register'
      }
    ]
  }
]

// Password strength computation
const passwordStrength = computed(() => {
  const password = form.newPassword
  if (!password) return 0
  
  let score = 0
  
  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z\d]/.test(password)) score++
  
  return Math.min(score, 4)
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  const texts = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  return texts[strength] || 'Very weak'
})

const isPasswordFormValid = computed(() => {
  return form.newPassword.length > 0 &&
         form.confirmPassword.length > 0 &&
         !errors.newPassword &&
         !errors.confirmPassword
})

// Methods
const getPasswordStrengthClass = (index: number) => {
  const strength = passwordStrength.value
  if (index <= strength) {
    if (strength <= 1) return 'bg-red-500'
    if (strength <= 2) return 'bg-yellow-500'
    if (strength <= 3) return 'bg-blue-500'
    return 'bg-green-500'
  }
  return 'bg-gray-200'
}

const getPasswordStrengthTextClass = () => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-red-600'
  if (strength <= 2) return 'text-yellow-600'
  if (strength <= 3) return 'text-blue-600'
  return 'text-green-600'
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  const timer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// Validation
const validateField = (field: keyof FormErrors) => {
  switch (field) {
    case 'email':
      if (!form.email) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Please enter a valid email address'
      } else {
        errors.email = undefined
      }
      break
      
    case 'newPassword':
      if (!form.newPassword) {
        errors.newPassword = 'Password is required'
      } else if (form.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters'
      } else {
        errors.newPassword = undefined
      }
      break
      
    case 'confirmPassword':
      if (!form.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (form.newPassword !== form.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      } else {
        errors.confirmPassword = undefined
      }
      break
  }
}

// Event handlers
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleEmailSubmit = async () => {
  validateField('email')
  if (errors.email) return

  loading.value = true
  error.value = null

  try {
    await authStore.requestPasswordReset(form.email)
    emailSent.value = true
    startResendCooldown()
  } catch (err: any) {
    error.value = err.message || 'Failed to send password reset email'
  } finally {
    loading.value = false
  }
}

const handleResendEmail = async () => {
  if (resendCooldown.value > 0) return

  resending.value = true
  error.value = null

  try {
    await authStore.requestPasswordReset(form.email)
    startResendCooldown()
  } catch (err: any) {
    error.value = err.message || 'Failed to resend password reset email'
  } finally {
    resending.value = false
  }
}

const handlePasswordReset = async () => {
  validateField('newPassword')
  validateField('confirmPassword')
  
  if (errors.newPassword || errors.confirmPassword) return

  loading.value = true
  error.value = null

  try {
    const token = route.query.token as string
    await authStore.resetPassword({
      token,
      newPassword: form.newPassword
    })

    // Redirect to success page
    await router.push('/auth/password-reset-success')
  } catch (err: any) {
    error.value = err.message || 'Failed to reset password'
  } finally {
    loading.value = false
  }
}

const handleLinkClick = (link: Link) => {
  router.push(link.href)
}

// Initialize form based on URL parameters
onMounted(() => {
  // If we have an email in query params, pre-fill it
  if (route.query.email) {
    form.email = route.query.email as string
  }
})
</script>