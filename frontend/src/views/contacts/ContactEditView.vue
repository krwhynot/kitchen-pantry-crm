<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Breadcrumb -->
    <nav class="flex mb-8" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-3">
        <li class="inline-flex items-center">
          <router-link
            to="/contacts"
            class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <Icon name="users" class="w-4 h-4 mr-2" />
            Contacts
          </router-link>
        </li>
        <li>
          <div class="flex items-center">
            <Icon name="chevron-right" class="w-6 h-6 text-gray-400" />
            <router-link
              :to="`/contacts/${contactId}`"
              class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
            >
              {{ currentContact?.name || 'Contact' }}
            </router-link>
          </div>
        </li>
        <li>
          <div class="flex items-center">
            <Icon name="chevron-right" class="w-6 h-6 text-gray-400" />
            <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">
              Edit
            </span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="isInitialLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-gray-600">Loading contact...</span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="fetchError"
      class="mb-6 rounded-md bg-red-50 p-4 border border-red-200"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <Icon name="x-circle" class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Error loading contact
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ fetchError }}</p>
          </div>
          <div class="mt-4">
            <div class="-mx-2 -my-1.5 flex">
              <Button
                variant="ghost"
                size="sm"
                class="text-red-800 hover:bg-red-100"
                @click="retryFetch"
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-red-800 hover:bg-red-100"
                @click="goToList"
              >
                Back to Contacts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="currentContact">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Edit Contact</h1>
        <p class="mt-2 text-gray-600">
          Update the information for {{ currentContact.name }}.
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="showSuccess"
        class="mb-6 rounded-md bg-green-50 p-4 border border-green-200"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <Icon name="check-circle" class="h-5 w-5 text-green-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Contact updated successfully!
            </h3>
            <div class="mt-2 text-sm text-green-700">
              <p>The contact changes have been saved.</p>
            </div>
            <div class="mt-4">
              <div class="-mx-2 -my-1.5 flex">
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-green-800 hover:bg-green-100"
                  @click="viewContact"
                >
                  View Contact
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-green-800 hover:bg-green-100"
                  @click="dismissSuccess"
                >
                  Continue Editing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Error Message -->
      <div
        v-if="updateError"
        class="mb-6 rounded-md bg-red-50 p-4 border border-red-200"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <Icon name="x-circle" class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Error updating contact
            </h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ updateError }}</p>
            </div>
            <div class="mt-4">
              <Button
                variant="ghost"
                size="sm"
                class="text-red-800 hover:bg-red-100"
                @click="clearUpdateError"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Contact Information</h2>
            <p class="mt-1 text-sm text-gray-500">
              Update the contact's basic information and role details.
            </p>
          </div>
          
          <div class="px-6 py-4 space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                v-model="form.firstName"
                label="First Name"
                placeholder="Enter first name"
                :error="errors.firstName"
                required
                @blur="validateField('firstName')"
              />
              
              <FormField
                v-model="form.lastName"
                label="Last Name"
                placeholder="Enter last name"
                :error="errors.lastName"
                required
                @blur="validateField('lastName')"
              />
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                v-model="form.title"
                label="Job Title"
                placeholder="e.g., General Manager, Chef"
                :error="errors.title"
                @blur="validateField('title')"
              />
              
              <FormField
                label="Organization"
                :error="errors.organizationId"
                required
              >
                <Select
                  v-model="form.organizationId"
                  :options="organizationOptions"
                  placeholder="Select organization"
                  :loading="organizationsLoading"
                  @change="validateField('organizationId')"
                />
              </FormField>
            </div>

            <!-- Contact Information -->
            <div class="border-t border-gray-200 pt-6">
              <h3 class="text-base font-medium text-gray-900 mb-4">Contact Details</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  v-model="form.email"
                  label="Email"
                  type="email"
                  placeholder="contact@company.com"
                  :error="errors.email"
                  @blur="validateField('email')"
                />
                
                <FormField
                  v-model="form.phone"
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  :error="errors.phone"
                  @blur="validateField('phone')"
                />
              </div>
              
              <FormField
                v-model="form.directPhone"
                label="Direct Phone"
                type="tel"
                placeholder="Direct line or extension"
                :error="errors.directPhone"
                help-text="Optional direct line or extension"
                @blur="validateField('directPhone')"
              />
            </div>

            <!-- Role Information -->
            <div class="border-t border-gray-200 pt-6">
              <h3 class="text-base font-medium text-gray-900 mb-4">Role & Preferences</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Priority Level"
                  :error="errors.priority"
                >
                  <Select
                    v-model="form.priority"
                    :options="priorityOptions"
                    placeholder="Select priority level"
                    @change="validateField('priority')"
                  />
                </FormField>
                
                <FormField
                  label="Preferred Contact Method"
                  :error="errors.preferredContactMethod"
                >
                  <Select
                    v-model="form.preferredContactMethod"
                    :options="contactMethodOptions"
                    placeholder="Select preferred method"
                    @change="validateField('preferredContactMethod')"
                  />
                </FormField>
              </div>
              
              <div class="flex items-center">
                <Checkbox
                  v-model="form.isDecisionMaker"
                  id="isDecisionMaker"
                  label="This contact is a decision maker"
                  help-text="Check if this person has authority to make purchasing decisions"
                />
              </div>
            </div>

            <!-- Notes -->
            <div class="border-t border-gray-200 pt-6">
              <FormField
                label="Notes"
                :error="errors.notes"
              >
                <textarea
                  v-model="form.notes"
                  rows="3"
                  class="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this contact..."
                  @blur="validateField('notes')"
                />
              </FormField>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              @click="handleCancel"
            >
              Cancel
            </Button>
            
            <div class="flex items-center space-x-3">
              <Button
                type="button"
                variant="secondary"
                :disabled="isUpdating"
                @click="handleReset"
              >
                Reset
              </Button>
              
              <Button
                type="submit"
                :loading="isUpdating"
                :disabled="!isFormValid"
              >
                Update Contact
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contacts'
import { useOrganizationStore } from '@/stores/organizations'
import { Button, Icon, LoadingSpinner, Select, Checkbox } from '@/components/atoms'
import { FormField } from '@/components/molecules'
import type { Contact } from '@shared/types'

const route = useRoute()
const router = useRouter()
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// State
const isInitialLoading = ref(true)
const isUpdating = ref(false)
const fetchError = ref<string | null>(null)
const updateError = ref<string | null>(null)
const showSuccess = ref(false)
const organizationsLoading = ref(false)

// Computed
const contactId = computed(() => route.params.id as string)
const currentContact = computed(() => contactStore.currentContact)

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  title: '',
  organizationId: '',
  email: '',
  phone: '',
  directPhone: '',
  priority: '',
  preferredContactMethod: '',
  isDecisionMaker: false,
  notes: ''
})

const errors = ref<Record<string, string>>({})

// Form options
const priorityOptions = [
  { value: '', label: 'No priority set' },
  { value: 'A', label: 'A - High Priority' },
  { value: 'B', label: 'B - Medium Priority' },
  { value: 'C', label: 'C - Low Priority' }
]

const contactMethodOptions = [
  { value: '', label: 'No preference' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'text', label: 'Text Message' }
]

const organizationOptions = computed(() => {
  return organizationStore.organizations.map(org => ({
    value: org.id,
    label: org.name
  }))
})

// Validation
const isFormValid = computed(() => {
  const requiredFields = ['firstName', 'lastName', 'organizationId']
  return requiredFields.every(field => {
    const value = form.value[field as keyof typeof form.value]
    return value && value.toString().trim().length > 0
  }) && Object.keys(errors.value).length === 0
})

const validateField = (field: string) => {
  const value = form.value[field as keyof typeof form.value]
  
  // Clear previous error
  delete errors.value[field]
  
  // Required field validation
  const requiredFields = ['firstName', 'lastName', 'organizationId']
  if (requiredFields.includes(field)) {
    if (!value || value.toString().trim().length === 0) {
      errors.value[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`
      return
    }
  }
  
  // Email validation
  if (field === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.toString())) {
      errors.value[field] = 'Please enter a valid email address'
      return
    }
  }
  
  // Phone validation
  if ((field === 'phone' || field === 'directPhone') && value) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleanPhone = value.toString().replace(/[\s\-\(\)]/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      errors.value[field] = 'Please enter a valid phone number'
      return
    }
  }
}

// Methods
const fetchContact = async () => {
  try {
    isInitialLoading.value = true
    fetchError.value = null
    
    await contactStore.fetchContactById(contactId.value)
    
    // Populate form with contact data
    if (currentContact.value) {
      const contact = currentContact.value
      const nameParts = contact.name.split(' ')
      
      form.value = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        title: contact.title || '',
        organizationId: contact.organizationId || '',
        email: contact.email || '',
        phone: contact.phone || '',
        directPhone: contact.directPhone || '',
        priority: contact.priority || '',
        preferredContactMethod: contact.preferredContactMethod || '',
        isDecisionMaker: contact.isDecisionMaker || false,
        notes: contact.notes || ''
      }
    }
    
  } catch (err: any) {
    fetchError.value = err.message || 'Failed to load contact'
  } finally {
    isInitialLoading.value = false
  }
}

const fetchOrganizations = async () => {
  try {
    organizationsLoading.value = true
    await organizationStore.fetchOrganizations()
  } catch (err) {
    console.error('Failed to fetch organizations:', err)
  } finally {
    organizationsLoading.value = false
  }
}

const retryFetch = () => {
  fetchContact()
}

const goToList = () => {
  router.push('/contacts')
}

// Event handlers
const handleSubmit = async () => {
  // Validate all fields
  Object.keys(form.value).forEach(field => validateField(field))
  
  if (!isFormValid.value) {
    return
  }

  try {
    isUpdating.value = true
    updateError.value = null
    
    const contactData = {
      ...form.value,
      name: `${form.value.firstName} ${form.value.lastName}`.trim()
    }
    
    await contactStore.updateContact(contactId.value, contactData)
    
    // Show success message
    showSuccess.value = true
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (err: any) {
    updateError.value = err.message || 'Failed to update contact. Please try again.'
    
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isUpdating.value = false
  }
}

const handleCancel = () => {
  router.push(`/contacts/${contactId.value}`)
}

const handleReset = () => {
  if (currentContact.value) {
    const contact = currentContact.value
    const nameParts = contact.name.split(' ')
    
    form.value = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      title: contact.title || '',
      organizationId: contact.organizationId || '',
      email: contact.email || '',
      phone: contact.phone || '',
      directPhone: contact.directPhone || '',
      priority: contact.priority || '',
      preferredContactMethod: contact.preferredContactMethod || '',
      isDecisionMaker: contact.isDecisionMaker || false,
      notes: contact.notes || ''
    }
  }
  
  errors.value = {}
  updateError.value = null
  showSuccess.value = false
}

const viewContact = () => {
  router.push(`/contacts/${contactId.value}`)
}

const dismissSuccess = () => {
  showSuccess.value = false
}

const clearUpdateError = () => {
  updateError.value = null
  contactStore.clearError()
}

// Lifecycle
onMounted(async () => {
  // Clear any existing errors when component mounts
  contactStore.clearError()
  
  // Load organizations for selection
  await fetchOrganizations()
  
  // Check if contact is already loaded
  if (currentContact.value?.id === contactId.value) {
    // Populate form with existing data
    handleReset()
    isInitialLoading.value = false
  } else {
    await fetchContact()
  }
})
</script>