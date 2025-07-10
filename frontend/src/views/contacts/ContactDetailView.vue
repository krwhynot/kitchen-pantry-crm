<template>
  <div class="container mx-auto px-4 py-8">
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
            <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">
              {{ currentContact?.name || 'Contact' }}
            </span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-gray-600">Loading contact...</span>
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
            Error loading contact
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
                Back to Contacts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="currentContact">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <Avatar
                :src="currentContact.avatar"
                :initials="generateInitials(currentContact.name)"
                size="lg"
                :status="currentContact.status"
              />
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  {{ currentContact.name }}
                </h1>
                <p class="text-gray-600">
                  {{ currentContact.title }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ getOrganizationName(currentContact.organizationId) }}
                </p>
                <div class="flex items-center space-x-2 mt-2">
                  <Badge v-if="currentContact.priority" :variant="getPriorityVariant(currentContact.priority)">
                    Priority {{ currentContact.priority }}
                  </Badge>
                  <Badge :variant="currentContact.isDecisionMaker ? 'success' : 'secondary'">
                    {{ currentContact.isDecisionMaker ? 'Decision Maker' : 'Contact' }}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <!-- Quick Actions -->
              <Button
                v-if="currentContact.email"
                variant="ghost"
                @click="sendEmail"
              >
                <Icon name="envelope" class="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                v-if="currentContact.phone"
                variant="ghost"
                @click="makeCall"
              >
                <Icon name="phone" class="w-4 h-4 mr-2" />
                Call
              </Button>
              
              <!-- Primary Actions -->
              <Button
                variant="secondary"
                @click="editContact"
              >
                <Icon name="pencil" class="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="primary"
                @click="createInteraction"
              >
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Log Interaction
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
              <!-- Contact Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Contact Information</h3>
                
                <div class="space-y-3">
                  <div v-if="currentContact.email">
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="text-sm text-gray-900">
                      <a :href="`mailto:${currentContact.email}`" class="text-blue-600 hover:text-blue-800">
                        {{ currentContact.email }}
                      </a>
                    </dd>
                  </div>
                  
                  <div v-if="currentContact.phone">
                    <dt class="text-sm font-medium text-gray-500">Phone</dt>
                    <dd class="text-sm text-gray-900">
                      <a :href="`tel:${currentContact.phone}`" class="text-blue-600 hover:text-blue-800">
                        {{ currentContact.phone }}
                      </a>
                    </dd>
                  </div>
                  
                  <div v-if="currentContact.directPhone">
                    <dt class="text-sm font-medium text-gray-500">Direct Phone</dt>
                    <dd class="text-sm text-gray-900">
                      <a :href="`tel:${currentContact.directPhone}`" class="text-blue-600 hover:text-blue-800">
                        {{ currentContact.directPhone }}
                      </a>
                    </dd>
                  </div>
                  
                  <div v-if="currentContact.preferredContactMethod">
                    <dt class="text-sm font-medium text-gray-500">Preferred Contact Method</dt>
                    <dd class="text-sm text-gray-900">{{ formatContactMethod(currentContact.preferredContactMethod) }}</dd>
                  </div>
                </div>
              </div>

              <!-- Role & Organization -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Role & Organization</h3>
                
                <div class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Organization</dt>
                    <dd class="text-sm text-gray-900">
                      <router-link
                        :to="`/organizations/${currentContact.organizationId}`"
                        class="text-blue-600 hover:text-blue-800"
                      >
                        {{ getOrganizationName(currentContact.organizationId) }}
                      </router-link>
                    </dd>
                  </div>
                  
                  <div v-if="currentContact.title">
                    <dt class="text-sm font-medium text-gray-500">Job Title</dt>
                    <dd class="text-sm text-gray-900">{{ currentContact.title }}</dd>
                  </div>
                  
                  <div v-if="currentContact.priority">
                    <dt class="text-sm font-medium text-gray-500">Priority Level</dt>
                    <dd class="text-sm text-gray-900">
                      <Badge :variant="getPriorityVariant(currentContact.priority)">
                        {{ currentContact.priority }} - {{ getPriorityLabel(currentContact.priority) }}
                      </Badge>
                    </dd>
                  </div>
                  
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Decision Making Authority</dt>
                    <dd class="text-sm text-gray-900">
                      <Badge :variant="currentContact.isDecisionMaker ? 'success' : 'secondary'">
                        {{ currentContact.isDecisionMaker ? 'Decision Maker' : 'Contact' }}
                      </Badge>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="currentContact.notes" class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-sm text-gray-700">{{ currentContact.notes }}</p>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
              <div v-if="recentInteractions.length === 0" class="text-center py-8">
                <Icon name="chat-bubble-left-right" class="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p class="text-gray-600">No recent interactions</p>
              </div>
              <div v-else class="space-y-3">
                <InteractionEntry
                  v-for="interaction in recentInteractions.slice(0, 3)"
                  :key="interaction.id"
                  :interaction="interaction"
                  @click="viewInteraction(interaction.id)"
                />
                <div v-if="recentInteractions.length > 3" class="text-center">
                  <Button variant="ghost" @click="activeTab = 'interactions'">
                    View All Interactions ({{ contactInteractions.length }})
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactions Tab -->
          <div v-else-if="activeTab === 'interactions'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-medium text-gray-900">Interaction History</h3>
              <Button variant="primary" @click="createInteraction">
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Log Interaction
              </Button>
            </div>

            <div v-if="contactInteractions.length === 0" class="text-center py-12">
              <Icon name="chat-bubble-left-right" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">No interactions yet</h3>
              <p class="text-gray-600 mb-4">Start tracking your communications with this contact.</p>
              <Button @click="createInteraction">
                Log Interaction
              </Button>
            </div>

            <div v-else class="space-y-4">
              <InteractionEntry
                v-for="interaction in contactInteractions"
                :key="interaction.id"
                :interaction="interaction"
                @click="viewInteraction(interaction.id)"
              />
            </div>
          </div>

          <!-- Organization Tab -->
          <div v-else-if="activeTab === 'organization'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-medium text-gray-900">Organization Details</h3>
              <Button variant="secondary" @click="viewOrganization">
                <Icon name="building" class="w-4 h-4 mr-2" />
                View Organization
              </Button>
            </div>

            <div v-if="currentOrganization" class="bg-gray-50 rounded-lg p-6">
              <div class="flex items-center space-x-4 mb-4">
                <div class="flex-shrink-0">
                  <div class="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <Icon name="building" class="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h4 class="text-xl font-bold text-gray-900">{{ currentOrganization.name }}</h4>
                  <p class="text-gray-600">{{ formatType(currentOrganization.type) }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-if="currentOrganization.industrySegment">
                  <dt class="text-sm font-medium text-gray-500">Industry</dt>
                  <dd class="text-sm text-gray-900">{{ currentOrganization.industrySegment }}</dd>
                </div>
                
                <div v-if="currentOrganization.primaryPhone">
                  <dt class="text-sm font-medium text-gray-500">Phone</dt>
                  <dd class="text-sm text-gray-900">{{ currentOrganization.primaryPhone }}</dd>
                </div>
                
                <div v-if="currentOrganization.primaryEmail">
                  <dt class="text-sm font-medium text-gray-500">Email</dt>
                  <dd class="text-sm text-gray-900">{{ currentOrganization.primaryEmail }}</dd>
                </div>
                
                <div v-if="currentOrganization.website">
                  <dt class="text-sm font-medium text-gray-500">Website</dt>
                  <dd class="text-sm text-gray-900">
                    <a :href="currentOrganization.website" target="_blank" class="text-blue-600 hover:text-blue-800">
                      {{ currentOrganization.website }}
                    </a>
                  </dd>
                </div>
              </div>

              <div v-if="currentOrganization.address" class="mt-4">
                <dt class="text-sm font-medium text-gray-500">Address</dt>
                <dd class="text-sm text-gray-900">
                  <div>{{ currentOrganization.address.street }}</div>
                  <div>{{ currentOrganization.address.city }}, {{ currentOrganization.address.state }} {{ currentOrganization.address.zipCode }}</div>
                </dd>
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
import { useContactStore } from '@/stores/contacts'
import { useOrganizationStore } from '@/stores/organizations'
import { useInteractionStore } from '@/stores/interactions'
import { InteractionEntry } from '@/components/molecules'
import { Button, Icon, LoadingSpinner, Badge, Avatar } from '@/components/atoms'

const route = useRoute()
const router = useRouter()
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()
const interactionStore = useInteractionStore()

// State
const activeTab = ref('overview')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Computed
const contactId = computed(() => route.params.id as string)
const currentContact = computed(() => contactStore.currentContact)
const currentOrganization = computed(() => {
  if (currentContact.value?.organizationId) {
    return organizationStore.getOrganizationById(currentContact.value.organizationId)
  }
  return null
})

const contactInteractions = computed(() => 
  interactionStore.getInteractionsByContact(contactId.value)
)

const recentInteractions = computed(() => 
  contactInteractions.value
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
)

const tabs = computed(() => [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'information-circle'
  },
  {
    key: 'interactions',
    label: 'Interactions',
    icon: 'chat-bubble-left-right',
    count: contactInteractions.value.length
  },
  {
    key: 'organization',
    label: 'Organization',
    icon: 'building'
  }
])

// Helper functions
const generateInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getOrganizationName = (organizationId: string) => {
  const org = organizationStore.getOrganizationById(organizationId)
  return org?.name || 'Unknown Organization'
}

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, string> = {
    A: 'danger',
    B: 'warning',
    C: 'secondary'
  }
  return variants[priority] || 'secondary'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    A: 'High Priority',
    B: 'Medium Priority',
    C: 'Low Priority'
  }
  return labels[priority] || priority
}

const formatContactMethod = (method: string) => {
  const methods: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    text: 'Text Message'
  }
  return methods[method] || method
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

// Methods
const fetchData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Fetch contact details
    await contactStore.fetchContactById(contactId.value)
    
    // Fetch related data
    await Promise.all([
      organizationStore.fetchOrganizations(),
      interactionStore.fetchInteractions({ contactId: contactId.value })
    ])
    
  } catch (err: any) {
    error.value = err.message || 'Failed to load contact data'
  } finally {
    isLoading.value = false
  }
}

const retryFetch = () => {
  fetchData()
}

const goToList = () => {
  router.push('/contacts')
}

// Navigation methods
const editContact = () => {
  router.push(`/contacts/${contactId.value}/edit`)
}

const viewOrganization = () => {
  if (currentContact.value?.organizationId) {
    router.push(`/organizations/${currentContact.value.organizationId}`)
  }
}

const createInteraction = () => {
  router.push(`/interactions/create?contactId=${contactId.value}`)
}

const viewInteraction = (interactionId: string) => {
  router.push(`/interactions/${interactionId}`)
}

// Quick actions
const sendEmail = () => {
  if (currentContact.value?.email) {
    window.location.href = `mailto:${currentContact.value.email}`
  }
}

const makeCall = () => {
  if (currentContact.value?.phone) {
    window.location.href = `tel:${currentContact.value.phone}`
  }
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>