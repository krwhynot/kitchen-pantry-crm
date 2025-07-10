<template>
  <AuthLayout
    title="Sign in to your account"
    subtitle="Welcome back! Please enter your details."
    :loading="loading"
    :footer-links="footerLinks"
    :alternative-actions="alternativeActions"
    @link-click="handleLinkClick"
    @alternative-action="handleAlternativeAction"
  >
    <!-- Login form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Email field -->
      <FormField
        id="email"
        label="Email address"
        :required="true"
        :error="errors.email"
      >
        <Input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="Enter your email"
          :disabled="loading"
          :error="!!errors.email"
          @blur="validateField('email')"
        />
      </FormField>

      <!-- Password field -->
      <FormField
        id="password"
        label="Password"
        :required="true"
        :error="errors.password"
      >
        <Input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Enter your password"
          :disabled="loading"
          :error="!!errors.password"
          @blur="validateField('password')"
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
      </FormField>

      <!-- Remember me and forgot password -->
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <Checkbox
            id="remember"
            v-model="form.rememberMe"
            :disabled="loading"
          />
          <label for="remember" class="ml-2 text-sm text-gray-700">
            Remember me
          </label>
        </div>

        <div class="text-sm">
          <a
            href="/auth/forgot-password"
            class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            @click="handleForgotPassword"
          >
            Forgot your password?
          </a>
        </div>
      </div>

      <!-- Submit button -->
      <Button
        type="submit"
        variant="primary"
        size="lg"
        :loading="loading"
        :disabled="!isFormValid || loading"
        class="w-full"
      >
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </Button>

      <!-- Error message -->
      <div v-if="error" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <Icon name="exclamation-triangle" size="20" class="text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Sign in failed
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
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { FormField } from '@/components/molecules'
import { Button, Input, Checkbox, Icon } from '@/components/atoms'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
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

interface AlternativeAction {
  key: string
  label: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

const router = useRouter()
const authStore = useAuthStore()

// Form state
const form = reactive<LoginForm>({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive<FormErrors>({})
const loading = ref(false)
const error = ref<string | null>(null)
const showPassword = ref(false)

// Footer links configuration
const footerLinks: LinkGroup[] = [
  {
    key: 'signup',
    links: [
      {
        key: 'register',
        label: "Don't have an account? Sign up",
        href: '/auth/register'
      }
    ]
  }
]

// Alternative login methods
const alternativeActions: AlternativeAction[] = [
  {
    key: 'google',
    label: 'Continue with Google',
    icon: 'google',
    variant: 'outline'
  },
  {
    key: 'microsoft',
    label: 'Continue with Microsoft',
    icon: 'microsoft',
    variant: 'outline'
  }
]

// Computed properties
const isFormValid = computed(() => {
  return form.email.length > 0 && 
         form.password.length > 0 && 
         !errors.email && 
         !errors.password
})

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
      
    case 'password':
      if (!form.password) {
        errors.password = 'Password is required'
      } else if (form.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      } else {
        errors.password = undefined
      }
      break
  }
}

const validateForm = (): boolean => {
  validateField('email')
  validateField('password')
  return !errors.email && !errors.password
}

// Event handlers
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = null

  try {
    await authStore.login({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe
    })

    // Redirect to intended page or dashboard
    const redirectTo = router.currentRoute.value.query.redirect as string
    await router.push(redirectTo || '/dashboard')
  } catch (err: any) {
    error.value = err.message || 'An error occurred during sign in'
  } finally {
    loading.value = false
  }
}

const handleLinkClick = (link: Link) => {
  router.push(link.href)
}

const handleForgotPassword = (event: Event) => {
  event.preventDefault()
  router.push('/auth/forgot-password')
}

const handleAlternativeAction = async (action: string) => {
  loading.value = true
  error.value = null

  try {
    switch (action) {
      case 'google':
        await authStore.loginWithProvider('google')
        break
      case 'microsoft':
        await authStore.loginWithProvider('microsoft')
        break
      default:
        throw new Error(`Unknown authentication method: ${action}`)
    }

    // Redirect after successful login
    const redirectTo = router.currentRoute.value.query.redirect as string
    await router.push(redirectTo || '/dashboard')
  } catch (err: any) {
    error.value = err.message || `Failed to sign in with ${action}`
  } finally {
    loading.value = false
  }
}
</script>