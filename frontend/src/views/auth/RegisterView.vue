<template>
  <AuthLayout
    title="Create your account"
    subtitle="Join Kitchen Pantry CRM and streamline your business."
    :loading="loading"
    :footer-links="footerLinks"
    :alternative-actions="alternativeActions"
    @link-click="handleLinkClick"
    @alternative-action="handleAlternativeAction"
  >
    <!-- Registration form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Name fields -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          id="firstName"
          label="First name"
          :required="true"
          :error="errors.firstName"
        >
          <Input
            id="firstName"
            v-model="form.firstName"
            type="text"
            autocomplete="given-name"
            placeholder="Enter your first name"
            :disabled="loading"
            :error="!!errors.firstName"
            @blur="validateField('firstName')"
          />
        </FormField>

        <FormField
          id="lastName"
          label="Last name"
          :required="true"
          :error="errors.lastName"
        >
          <Input
            id="lastName"
            v-model="form.lastName"
            type="text"
            autocomplete="family-name"
            placeholder="Enter your last name"
            :disabled="loading"
            :error="!!errors.lastName"
            @blur="validateField('lastName')"
          />
        </FormField>
      </div>

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
          placeholder="Enter your email address"
          :disabled="loading"
          :error="!!errors.email"
          @blur="validateField('email')"
        />
      </FormField>

      <!-- Company field -->
      <FormField
        id="company"
        label="Company name"
        :required="false"
        :error="errors.company"
        helper-text="Optional: Your organization or business name"
      >
        <Input
          id="company"
          v-model="form.company"
          type="text"
          autocomplete="organization"
          placeholder="Enter your company name"
          :disabled="loading"
          :error="!!errors.company"
          @blur="validateField('company')"
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
          autocomplete="new-password"
          placeholder="Create a secure password"
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
        
        <!-- Password strength indicator -->
        <div v-if="form.password" class="mt-2">
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
        label="Confirm password"
        :required="true"
        :error="errors.confirmPassword"
      >
        <Input
          id="confirmPassword"
          v-model="form.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Confirm your password"
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

      <!-- Terms and conditions -->
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <Checkbox
            id="agreeToTerms"
            v-model="form.agreeToTerms"
            :disabled="loading"
            :error="!!errors.agreeToTerms"
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="agreeToTerms" class="text-gray-700">
            I agree to the
            <a href="/terms" class="font-medium text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </a>
            and
            <a href="/privacy" class="font-medium text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </a>
          </label>
          <p v-if="errors.agreeToTerms" class="mt-1 text-red-600 text-xs">
            {{ errors.agreeToTerms }}
          </p>
        </div>
      </div>

      <!-- Marketing consent -->
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <Checkbox
            id="marketingConsent"
            v-model="form.marketingConsent"
            :disabled="loading"
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="marketingConsent" class="text-gray-700">
            I would like to receive product updates and marketing communications
          </label>
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
        {{ loading ? 'Creating account...' : 'Create account' }}
      </Button>

      <!-- Error message -->
      <div v-if="error" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <Icon name="exclamation-triangle" size="20" class="text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Registration failed
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

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  company: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  marketingConsent: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  password?: string
  confirmPassword?: string
  agreeToTerms?: string
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
const form = reactive<RegisterForm>({
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  marketingConsent: false
})

const errors = reactive<FormErrors>({})
const loading = ref(false)
const error = ref<string | null>(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Footer links configuration
const footerLinks: LinkGroup[] = [
  {
    key: 'signin',
    links: [
      {
        key: 'login',
        label: 'Already have an account? Sign in',
        href: '/auth/login'
      }
    ]
  }
]

// Alternative registration methods
const alternativeActions: AlternativeAction[] = [
  {
    key: 'google',
    label: 'Sign up with Google',
    icon: 'google',
    variant: 'outline'
  },
  {
    key: 'microsoft',
    label: 'Sign up with Microsoft',
    icon: 'microsoft',
    variant: 'outline'
  }
]

// Password strength computation
const passwordStrength = computed(() => {
  const password = form.password
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

// Computed properties
const isFormValid = computed(() => {
  return form.firstName.length > 0 &&
         form.lastName.length > 0 &&
         form.email.length > 0 &&
         form.password.length > 0 &&
         form.confirmPassword.length > 0 &&
         form.agreeToTerms &&
         Object.keys(errors).every(key => !errors[key as keyof FormErrors])
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

// Validation
const validateField = (field: keyof FormErrors) => {
  switch (field) {
    case 'firstName':
      errors.firstName = form.firstName ? undefined : 'First name is required'
      break
      
    case 'lastName':
      errors.lastName = form.lastName ? undefined : 'Last name is required'
      break
      
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
      } else if (form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
      } else {
        errors.password = undefined
      }
      break
      
    case 'confirmPassword':
      if (!form.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      } else {
        errors.confirmPassword = undefined
      }
      break
      
    case 'agreeToTerms':
      errors.agreeToTerms = form.agreeToTerms ? undefined : 'You must agree to the terms and conditions'
      break
  }
}

const validateForm = (): boolean => {
  validateField('firstName')
  validateField('lastName')
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  validateField('agreeToTerms')
  
  return Object.keys(errors).every(key => !errors[key as keyof FormErrors])
}

// Event handlers
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = null

  try {
    await authStore.register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      company: form.company || undefined,
      password: form.password,
      marketingConsent: form.marketingConsent
    })

    // Redirect to email verification or dashboard
    await router.push('/auth/verify-email')
  } catch (err: any) {
    error.value = err.message || 'An error occurred during registration'
  } finally {
    loading.value = false
  }
}

const handleLinkClick = (link: Link) => {
  router.push(link.href)
}

const handleAlternativeAction = async (action: string) => {
  loading.value = true
  error.value = null

  try {
    switch (action) {
      case 'google':
        await authStore.registerWithProvider('google')
        break
      case 'microsoft':
        await authStore.registerWithProvider('microsoft')
        break
      default:
        throw new Error(`Unknown registration method: ${action}`)
    }

    // Redirect after successful registration
    await router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || `Failed to register with ${action}`
  } finally {
    loading.value = false
  }
}
</script>