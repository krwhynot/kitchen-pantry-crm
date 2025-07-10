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
            <router-link
              :to="`/organizations/${organizationId}`"
              class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
            >
              {{ currentOrganization?.name || 'Organization' }}
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
      <span class="ml-3 text-gray-600">Loading organization...</span>
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
            Error loading organization
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
                Back to Organizations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="currentOrganization">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Edit Organization</h1>
        <p class="mt-2 text-gray-600">
          Update the information for {{ currentOrganization.name }}.
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
              Organization updated successfully!
            </h3>
            <div class="mt-2 text-sm text-green-700">
              <p>The organization changes have been saved.</p>
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
              Error updating organization
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

      <!-- Organization Form -->
      <OrganizationForm
        :organization="currentOrganization"
        :loading="isUpdating"
        :industry-segment-options="industrySegmentOptions"
        :priority-level-options="priorityLevelOptions"
        :distributor-options="distributorOptions"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @reset="handleReset"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organizations'
import { OrganizationForm } from '@/components/organisms'
import { Button, Icon, LoadingSpinner } from '@/components/atoms'
import type { Organization } from '@shared/types'

const route = useRoute()
const router = useRouter()
const organizationStore = useOrganizationStore()

// State
const isInitialLoading = ref(true)
const isUpdating = ref(false)
const fetchError = ref<string | null>(null)
const updateError = ref<string | null>(null)
const showSuccess = ref(false)

// Computed
const organizationId = computed(() => route.params.id as string)
const currentOrganization = computed(() => organizationStore.currentOrganization)

// Form options
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

// Methods
const fetchOrganization = async () => {
  try {
    isInitialLoading.value = true
    fetchError.value = null
    
    await organizationStore.fetchOrganizationById(organizationId.value)
    
  } catch (err: any) {
    fetchError.value = err.message || 'Failed to load organization'
  } finally {
    isInitialLoading.value = false
  }
}

const retryFetch = () => {
  fetchOrganization()
}

const goToList = () => {
  router.push('/organizations')
}

// Event handlers
const handleSubmit = async (organizationData: Organization) => {
  try {
    isUpdating.value = true
    updateError.value = null
    
    await organizationStore.updateOrganization(organizationId.value, organizationData)
    
    // Show success message
    showSuccess.value = true
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (err: any) {
    updateError.value = err.message || 'Failed to update organization. Please try again.'
    
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isUpdating.value = false
  }
}

const handleCancel = () => {
  router.push(`/organizations/${organizationId.value}`)
}

const handleReset = () => {
  // The form component handles the reset logic internally
  updateError.value = null
  showSuccess.value = false
}

const viewOrganization = () => {
  router.push(`/organizations/${organizationId.value}`)
}

const dismissSuccess = () => {
  showSuccess.value = false
}

const clearUpdateError = () => {
  updateError.value = null
  organizationStore.clearError()
}

// Lifecycle
onMounted(() => {
  // Clear any existing errors when component mounts
  organizationStore.clearError()
  
  // Check if organization is already loaded
  if (currentOrganization.value?.id === organizationId.value) {
    isInitialLoading.value = false
  } else {
    fetchOrganization()
  }
})
</script>