<template>
  <div class="container mx-auto px-4 py-8">
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
              {{ currentOrganization?.name || 'Organization' }}
            </span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-gray-600">Loading organization...</span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
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
            <p>{{ error }}</p>
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
      <!-- Header -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <Icon name="building" class="h-8 w-8 text-gray-600" />
                </div>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  {{ currentOrganization.name }}
                </h1>
                <p class="text-gray-600">
                  {{ formatType(currentOrganization.type) }}
                </p>
                <div class="flex items-center space-x-2 mt-1">
                  <Badge :variant="getTypeVariant(currentOrganization.type)">
                    {{ formatType(currentOrganization.type) }}
                  </Badge>
                  <Badge :variant="currentOrganization.status === 'active' ? 'success' : 'secondary'">
                    {{ currentOrganization.status || 'Unknown' }}
                  </Badge>
                  <Badge v-if="currentOrganization.priorityLevel" variant="warning">
                    Priority {{ currentOrganization.priorityLevel }}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <Button
                variant="secondary"
                @click="editOrganization"
              >
                <Icon name="pencil" class="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="primary"
                @click="createContact"
              >
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white shadow rounded-lg">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="[
                tab.key === activeTab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center'
              ]"
              @click="activeTab = tab.key"
            >
              <Icon :name="tab.icon" class="w-4 h-4 mr-2" />
              {{ tab.label }}
              <Badge
                v-if="tab.count !== undefined"
                variant="secondary"
                size="sm"
                class="ml-2"
              >
                {{ tab.count }}
              </Badge>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Basic Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div class="space-y-3">
                  <div v-if="currentOrganization.dbaName">
                    <dt class="text-sm font-medium text-gray-500">DBA Name</dt>
                    <dd class="text-sm text-gray-900">{{ currentOrganization.dbaName }}</dd>
                  </div>
                  
                  <div v-if="currentOrganization.industrySegment">
                    <dt class="text-sm font-medium text-gray-500">Industry Segment</dt>
                    <dd class="text-sm text-gray-900">{{ currentOrganization.industrySegment }}</dd>
                  </div>
                  
                  <div v-if="currentOrganization.annualRevenue">
                    <dt class="text-sm font-medium text-gray-500">Annual Revenue</dt>
                    <dd class="text-sm text-gray-900">${{ formatCurrency(currentOrganization.annualRevenue) }}</dd>
                  </div>
                  
                  <div v-if="currentOrganization.employeeCount">
                    <dt class="text-sm font-medium text-gray-500">Employee Count</dt>
                    <dd class="text-sm text-gray-900">{{ currentOrganization.employeeCount }}</dd>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Contact Information</h3>
                
                <div class="space-y-3">
                  <div v-if="currentOrganization.primaryPhone">
                    <dt class="text-sm font-medium text-gray-500">Phone</dt>
                    <dd class="text-sm text-gray-900">
                      <a :href="`tel:${currentOrganization.primaryPhone}`" class="text-blue-600 hover:text-blue-800">
                        {{ currentOrganization.primaryPhone }}
                      </a>
                    </dd>
                  </div>
                  
                  <div v-if="currentOrganization.primaryEmail">
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="text-sm text-gray-900">
                      <a :href="`mailto:${currentOrganization.primaryEmail}`" class="text-blue-600 hover:text-blue-800">
                        {{ currentOrganization.primaryEmail }}
                      </a>
                    </dd>
                  </div>
                  
                  <div v-if="currentOrganization.website">
                    <dt class="text-sm font-medium text-gray-500">Website</dt>
                    <dd class="text-sm text-gray-900">
                      <a :href="currentOrganization.website" target="_blank" class="text-blue-600 hover:text-blue-800">
                        {{ currentOrganization.website }}
                      </a>
                    </dd>
                  </div>
                  
                  <div v-if="currentOrganization.address">
                    <dt class="text-sm font-medium text-gray-500">Address</dt>
                    <dd class="text-sm text-gray-900">
                      <div>{{ currentOrganization.address.street }}</div>
                      <div>{{ currentOrganization.address.city }}, {{ currentOrganization.address.state }} {{ currentOrganization.address.zipCode }}</div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="currentOrganization.notes" class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-sm text-gray-700">{{ currentOrganization.notes }}</p>
              </div>
            </div>
          </div>

          <!-- Contacts Tab -->
          <div v-else-if="activeTab === 'contacts'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-medium text-gray-900">Contacts</h3>
              <Button variant="primary" @click="createContact">
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>

            <div v-if="organizationContacts.length === 0" class="text-center py-12">
              <Icon name="users" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p class="text-gray-600 mb-4">Get started by adding your first contact for this organization.</p>
              <Button @click="createContact">
                Add Contact
              </Button>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ContactCard
                v-for="contact in organizationContacts"
                :key="contact.id"
                :contact="contact"
                @click="viewContact(contact.id)"
              />
            </div>
          </div>

          <!-- Interactions Tab -->
          <div v-else-if="activeTab === 'interactions'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-medium text-gray-900">Recent Interactions</h3>
              <Button variant="primary" @click="createInteraction">
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Log Interaction
              </Button>
            </div>

            <div v-if="organizationInteractions.length === 0" class="text-center py-12">
              <Icon name="chat-bubble-left-right" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">No interactions yet</h3>
              <p class="text-gray-600 mb-4">Start tracking your communications with this organization.</p>
              <Button @click="createInteraction">
                Log Interaction
              </Button>
            </div>

            <div v-else class="space-y-4">
              <InteractionEntry
                v-for="interaction in organizationInteractions.slice(0, 10)"
                :key="interaction.id"
                :interaction="interaction"
                @click="viewInteraction(interaction.id)"
              />
              
              <div v-if="organizationInteractions.length > 10" class="text-center pt-4">
                <Button variant="secondary" @click="viewAllInteractions">
                  View All Interactions ({{ organizationInteractions.length }})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organizations'
import { useContactStore } from '@/stores/contacts'
import { useInteractionStore } from '@/stores/interactions'
import { ContactCard } from '@/components/molecules'
import { InteractionEntry } from '@/components/molecules'
import { Button, Icon, LoadingSpinner, Badge } from '@/components/atoms'

const route = useRoute()
const router = useRouter()
const organizationStore = useOrganizationStore()
const contactStore = useContactStore()
const interactionStore = useInteractionStore()

// State
const activeTab = ref('overview')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Computed
const organizationId = computed(() => route.params.id as string)
const currentOrganization = computed(() => organizationStore.currentOrganization)

const organizationContacts = computed(() => 
  contactStore.getContactsByOrganization(organizationId.value)
)

const organizationInteractions = computed(() => 
  interactionStore.getInteractionsByOrganization(organizationId.value)
)

const tabs = computed(() => [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'information-circle'
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'users',
    count: organizationContacts.value.length
  },
  {
    key: 'interactions',
    label: 'Interactions',
    icon: 'chat-bubble-left-right',
    count: organizationInteractions.value.length
  }
])

// Helper functions
const getTypeVariant = (type: string) => {
  const variants: Record<string, string> = {
    restaurant: 'primary',
    distributor: 'secondary',
    manufacturer: 'warning',
    food_service: 'info'
  }
  return variants[type] || 'secondary'
}

const formatType = (type: string) => {
  const typeMap: Record<string, string> = {
    restaurant: 'Restaurant',
    distributor: 'Distributor',
    manufacturer: 'Manufacturer',
    food_service: 'Food Service'
  }
  return typeMap[type] || type
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US').format(amount)
}

// Methods
const fetchData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Fetch organization details
    await organizationStore.fetchOrganizationById(organizationId.value)
    
    // Fetch related contacts and interactions
    await Promise.all([
      contactStore.fetchContacts({ organizationId: organizationId.value }),
      interactionStore.fetchInteractions({ organizationId: organizationId.value })
    ])
    
  } catch (err: any) {
    error.value = err.message || 'Failed to load organization data'
  } finally {
    isLoading.value = false
  }
}

const retryFetch = () => {
  fetchData()
}

const goToList = () => {
  router.push('/organizations')
}

// Navigation methods
const editOrganization = () => {
  router.push(`/organizations/${organizationId.value}/edit`)
}

const createContact = () => {
  router.push(`/contacts/create?organizationId=${organizationId.value}`)
}

const viewContact = (contactId: string) => {
  router.push(`/contacts/${contactId}`)
}

const createInteraction = () => {
  router.push(`/interactions/create?organizationId=${organizationId.value}`)
}

const viewInteraction = (interactionId: string) => {
  router.push(`/interactions/${interactionId}`)
}

const viewAllInteractions = () => {
  router.push(`/interactions?organizationId=${organizationId.value}`)
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>