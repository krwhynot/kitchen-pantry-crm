<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Breadcrumb -->
    <nav class="flex mb-8" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-3">
        <li class="inline-flex items-center">
          <router-link
            to="/interactions"
            class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <Icon name="chat-bubble-left-right" class="w-4 h-4 mr-2" />
            Interactions
          </router-link>
        </li>
        <li>
          <div class="flex items-center">
            <Icon name="chevron-right" class="w-6 h-6 text-gray-400" />
            <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">
              Log Interaction
            </span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Log New Interaction</h1>
      <p class="mt-2 text-gray-600">
        Record a communication or activity with a contact or organization.
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
            Interaction logged successfully!
          </h3>
          <div class="mt-2 text-sm text-green-700">
            <p>The interaction has been recorded in your CRM.</p>
          </div>
          <div class="mt-4">
            <div class="-mx-2 -my-1.5 flex">
              <Button
                variant="ghost"
                size="sm"
                class="text-green-800 hover:bg-green-100"
                @click="viewInteraction"
              >
                View Interaction
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-green-800 hover:bg-green-100"
                @click="logAnother"
              >
                Log Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mb-6 rounded-md bg-red-50 p-4 border border-red-200"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <Icon name="x-circle" class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Error logging interaction
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
          <div class="mt-4">
            <Button
              variant="ghost"
              size="sm"
              class="text-red-800 hover:bg-red-100"
              @click="clearError"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interaction Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Interaction Details</h2>
          <p class="mt-1 text-sm text-gray-500">
            Enter the details of the communication or activity.
          </p>
        </div>
        
        <div class="px-6 py-4 space-y-6">
          <!-- Contact and Organization -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Contact"
              :error="errors.contactId"
              required
            >
              <Select
                v-model="form.contactId"
                :options="contactOptions"
                placeholder="Select contact"
                :loading="contactsLoading"
                @change="handleContactChange"
              />
            </FormField>
            
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
                :disabled="!form.contactId"
                @change="validateField('organizationId')"
              />
            </FormField>
          </div>

          <!-- Interaction Type and Outcome -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Interaction Type"
              :error="errors.type"
              required
            >
              <Select
                v-model="form.type"
                :options="typeOptions"
                placeholder="Select interaction type"
                @change="validateField('type')"
              />
            </FormField>
            
            <FormField
              label="Outcome"
              :error="errors.outcome"
            >
              <Select
                v-model="form.outcome"
                :options="outcomeOptions"
                placeholder="Select outcome"
                @change="validateField('outcome')"
              />
            </FormField>
          </div>

          <!-- Scheduled and Completed Times -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-base font-medium text-gray-900 mb-4">Timing</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                v-model="form.scheduledAt"
                label="Scheduled Date & Time"
                type="datetime-local"
                :error="errors.scheduledAt"
                help-text="When was this interaction scheduled?"
                @blur="validateField('scheduledAt')"
              />
              
              <FormField
                v-model="form.completedAt"
                label="Completed Date & Time"
                type="datetime-local"
                :error="errors.completedAt"
                help-text="When was this interaction completed? (Leave empty if not completed)"
                @blur="validateField('completedAt')"
              />
            </div>
          </div>

          <!-- Follow-up -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-base font-medium text-gray-900 mb-4">Follow-up</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                v-model="form.followUpDate"
                label="Follow-up Date"
                type="date"
                :error="errors.followUpDate"
                help-text="When should you follow up on this interaction?"
                @blur="validateField('followUpDate')"
              />
              
              <FormField
                v-model="form.followUpNotes"
                label="Follow-up Notes"
                placeholder="What should be done in the follow-up?"
                :error="errors.followUpNotes"
                @blur="validateField('followUpNotes')"
              />
            </div>
          </div>

          <!-- Notes and Description -->
          <div class="border-t border-gray-200 pt-6">
            <FormField
              label="Notes"
              :error="errors.notes"
              required
            >
              <textarea
                v-model="form.notes"
                rows="4"
                class="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what happened during this interaction..."
                @blur="validateField('notes')"
              />
            </FormField>
          </div>

          <!-- Additional Options -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-base font-medium text-gray-900 mb-4">Additional Options</h3>
            
            <div class="space-y-4">
              <div class="flex items-center">
                <Checkbox
                  v-model="form.isPrivate"
                  id="isPrivate"
                  label="Private interaction"
                  help-text="Only you will be able to see this interaction"
                />
              </div>
              
              <div class="flex items-center">
                <Checkbox
                  v-model="form.requiresFollowUp"
                  id="requiresFollowUp"
                  label="Requires follow-up"
                  help-text="Mark this interaction as requiring a follow-up action"
                />
              </div>
            </div>
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
              @click="saveDraft"
              :disabled="!form.contactId || !form.type"
            >
              Save as Draft
            </Button>
            
            <Button
              type="submit"
              :loading="isLoading"
              :disabled="!isFormValid"
            >
              Log Interaction
            </Button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactions'
import { useContactStore } from '@/stores/contacts'
import { useOrganizationStore } from '@/stores/organizations'
import { Button, Icon, Select, Checkbox } from '@/components/atoms'
import { FormField } from '@/components/molecules'
import type { Interaction } from '@shared/types'

const route = useRoute()
const router = useRouter()
const interactionStore = useInteractionStore()
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// State
const showSuccess = ref(false)
const error = ref<string | null>(null)
const createdInteraction = ref<Interaction | null>(null)
const contactsLoading = ref(false)
const organizationsLoading = ref(false)

// Computed
const isLoading = computed(() => interactionStore.isLoading)

// Form data
const form = ref({
  contactId: '',
  organizationId: '',
  type: '',
  outcome: '',
  notes: '',
  scheduledAt: '',
  completedAt: '',
  followUpDate: '',
  followUpNotes: '',
  isPrivate: false,
  requiresFollowUp: false
})

const errors = ref<Record<string, string>>({})

// Form options
const typeOptions = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' }
]

const outcomeOptions = [
  { value: '', label: 'No outcome set' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'follow_up_required', label: 'Follow-up Required' }
]

const contactOptions = computed(() => {
  return contactStore.contacts.map(contact => ({
    value: contact.id,
    label: `${contact.name} (${getOrganizationName(contact.organizationId)})`
  }))
})

const organizationOptions = computed(() => {
  return organizationStore.organizations.map(org => ({
    value: org.id,
    label: org.name
  }))
})

// Helper functions
const getOrganizationName = (organizationId: string) => {
  const org = organizationStore.getOrganizationById(organizationId)
  return org?.name || 'Unknown Organization'
}

const getContactOrganization = (contactId: string) => {
  const contact = contactStore.getContactById(contactId)
  return contact?.organizationId || ''
}

// Validation
const isFormValid = computed(() => {
  const requiredFields = ['contactId', 'organizationId', 'type', 'notes']
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
  const requiredFields = ['contactId', 'organizationId', 'type', 'notes']
  if (requiredFields.includes(field)) {
    if (!value || value.toString().trim().length === 0) {
      errors.value[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`
      return
    }
  }
  
  // Date validation
  if (field === 'completedAt' && value && form.value.scheduledAt) {
    const scheduledDate = new Date(form.value.scheduledAt)
    const completedDate = new Date(value.toString())
    if (completedDate < scheduledDate) {
      errors.value[field] = 'Completed date cannot be before scheduled date'
      return
    }
  }
  
  if (field === 'followUpDate' && value) {
    const followUpDate = new Date(value.toString())
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (followUpDate < today) {
      errors.value[field] = 'Follow-up date cannot be in the past'
      return
    }
  }
}

// Event handlers
const handleContactChange = (contactId: string) => {
  validateField('contactId')
  
  // Auto-select organization based on contact
  if (contactId) {
    const organizationId = getContactOrganization(contactId)
    if (organizationId) {
      form.value.organizationId = organizationId
      validateField('organizationId')
    }
  }
}

const handleSubmit = async () => {
  // Validate all fields
  Object.keys(form.value).forEach(field => validateField(field))
  
  if (!isFormValid.value) {
    return
  }

  try {
    error.value = null
    
    // Prepare interaction data
    const interactionData = {
      ...form.value,
      // Convert date strings to ISO format if provided
      scheduledAt: form.value.scheduledAt ? new Date(form.value.scheduledAt).toISOString() : undefined,
      completedAt: form.value.completedAt ? new Date(form.value.completedAt).toISOString() : undefined,
      followUpDate: form.value.followUpDate ? new Date(form.value.followUpDate).toISOString() : undefined
    }
    
    // Remove empty optional fields
    Object.keys(interactionData).forEach(key => {
      const value = interactionData[key as keyof typeof interactionData]
      if (value === '' || value === null || value === undefined) {
        delete interactionData[key as keyof typeof interactionData]
      }
    })
    
    const newInteraction = await interactionStore.createInteraction(interactionData)
    
    // Show success state
    createdInteraction.value = newInteraction
    showSuccess.value = true
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (err: any) {
    error.value = err.message || 'Failed to log interaction. Please try again.'
    
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const saveDraft = async () => {
  // TODO: Implement draft functionality
  console.log('Save as draft:', form.value)
  // For now, just show a message
  alert('Draft functionality will be implemented in a future update.')
}

const handleCancel = () => {
  router.push('/interactions')
}

const viewInteraction = () => {
  if (createdInteraction.value) {
    router.push(`/interactions/${createdInteraction.value.id}`)
  }
}

const logAnother = () => {
  // Reset the form but keep the contact and organization selection
  const contactId = form.value.contactId
  const organizationId = form.value.organizationId
  
  form.value = {
    contactId,
    organizationId,
    type: '',
    outcome: '',
    notes: '',
    scheduledAt: '',
    completedAt: '',
    followUpDate: '',
    followUpNotes: '',
    isPrivate: false,
    requiresFollowUp: false
  }
  
  showSuccess.value = false
  createdInteraction.value = null
  error.value = null
  errors.value = {}
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearError = () => {
  error.value = null
  interactionStore.clearError()
}

const fetchContacts = async () => {
  try {
    contactsLoading.value = true
    await contactStore.fetchContacts()
  } catch (err) {
    console.error('Failed to fetch contacts:', err)
  } finally {
    contactsLoading.value = false
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

// Lifecycle
onMounted(async () => {
  // Clear any existing errors when component mounts
  interactionStore.clearError()
  
  // Load contacts and organizations for selection
  await Promise.all([
    fetchContacts(),
    fetchOrganizations()
  ])
  
  // Pre-select contact if provided in query params
  const contactId = route.query.contactId as string
  if (contactId) {
    form.value.contactId = contactId
    handleContactChange(contactId)
  }
  
  // Pre-select organization if provided in query params
  const organizationId = route.query.organizationId as string
  if (organizationId) {
    form.value.organizationId = organizationId
  }
})

// Watch for changes in requiresFollowUp to auto-set follow-up date
watch(
  () => form.value.requiresFollowUp,
  (newValue) => {
    if (newValue && !form.value.followUpDate) {
      // Set follow-up date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      form.value.followUpDate = tomorrow.toISOString().split('T')[0]
    }
  }
)
</script>