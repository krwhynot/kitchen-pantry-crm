<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Breadcrumb -->
    <nav class="flex mb-8" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-3">
        <li class="inline-flex items-center">
          <router-link
            to="/organizations"
            class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <Icon name="building" class="w-4 h-4 mr-2" />
            Organizations
          </router-link>
        </li>
        <li>
          <div class="flex items-center">
            <Icon name="chevron-right" class="w-6 h-6 text-gray-400" />
            <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">
              Create Organization
            </span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Create New Organization</h1>
      <p class="mt-2 text-gray-600">
        Add a new organization to your customer relationship management system.
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
            Organization created successfully!
          </h3>
          <div class="mt-2 text-sm text-green-700">
            <p>The organization has been added to your CRM.</p>
          </div>
          <div class="mt-4">
            <div class="-mx-2 -my-1.5 flex">
              <Button
                variant="ghost"
                size="sm"
                class="text-green-800 hover:bg-green-100"
                @click="viewOrganization"
              >
                View Organization
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-green-800 hover:bg-green-100"
                @click="createAnother"
              >
                Create Another
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
            Error creating organization
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

    <!-- Organization Form -->
    <OrganizationForm
      :loading="isLoading"
      :industry-segment-options="industrySegmentOptions"
      :priority-level-options="priorityLevelOptions"
      :distributor-options="distributorOptions"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organizations'
import { OrganizationForm } from '@/components/organisms'
import { Button, Icon } from '@/components/atoms'
import type { Organization } from '@shared/types'

const router = useRouter()
const organizationStore = useOrganizationStore()

// State
const showSuccess = ref(false)
const error = ref<string | null>(null)
const createdOrganization = ref<Organization | null>(null)

// Computed
const isLoading = computed(() => organizationStore.isLoading)

// Form options - these would typically come from a configuration store or API
const industrySegmentOptions = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'catering', label: 'Catering' },
  { value: 'institutional', label: 'Institutional' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'food_service', label: 'Food Service' }
]

const priorityLevelOptions = [
  { value: 'A', label: 'A - High Priority' },
  { value: 'B', label: 'B - Medium Priority' },
  { value: 'C', label: 'C - Low Priority' }
]

const distributorOptions = [
  { value: '', label: 'No distributor' },
  { value: 'sysco', label: 'Sysco' },
  { value: 'us-foods', label: 'US Foods' },
  { value: 'performance', label: 'Performance Food Group' },
  { value: 'reinhart', label: 'Reinhart FoodService' },
  { value: 'gordon', label: 'Gordon Food Service' },
  { value: 'shamrock', label: 'Shamrock Foods' }
]

// Event handlers
const handleSubmit = async (organizationData: Organization) => {
  try {
    error.value = null
    
    // Create the organization
    const newOrganization = await organizationStore.createOrganization(organizationData)
    
    // Show success state
    createdOrganization.value = newOrganization
    showSuccess.value = true
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (err: any) {
    error.value = err.message || 'Failed to create organization. Please try again.'
    
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleCancel = () => {
  router.push('/organizations')
}

const viewOrganization = () => {
  if (createdOrganization.value) {
    router.push(`/organizations/${createdOrganization.value.id}`)
  }
}

const createAnother = () => {
  // Reset the success state to create another organization
  showSuccess.value = false
  createdOrganization.value = null
  error.value = null
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearError = () => {
  error.value = null
  organizationStore.clearError()
}

// Lifecycle
onMounted(() => {
  // Clear any existing errors when component mounts
  organizationStore.clearError()
})
</script>