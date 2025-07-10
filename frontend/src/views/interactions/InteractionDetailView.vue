<template>
  <div class="container mx-auto px-4 py-8">
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
              {{ formatInteractionTitle(currentInteraction) }}
            </span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-gray-600">Loading interaction...</span>
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
            Error loading interaction
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
                Back to Interactions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="currentInteraction">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icon :name="getTypeIcon(currentInteraction.type)" class="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  {{ formatType(currentInteraction.type) }}
                </h1>
                <p class="text-gray-600">
                  with {{ getContactName(currentInteraction.contactId) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ getOrganizationName(currentInteraction.organizationId) }}
                </p>
                <div class="flex items-center space-x-2 mt-2">
                  <Badge :variant="getTypeVariant(currentInteraction.type)">
                    {{ formatType(currentInteraction.type) }}
                  </Badge>
                  <Badge v-if="currentInteraction.outcome" :variant="getOutcomeVariant(currentInteraction.outcome)">
                    {{ formatOutcome(currentInteraction.outcome) }}
                  </Badge>
                  <Badge v-if="currentInteraction.isPrivate" variant="warning">
                    Private
                  </Badge>
                  <Badge v-if="currentInteraction.requiresFollowUp" variant="info">
                    Follow-up Required
                  </Badge>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <!-- Quick Actions -->
              <Button
                v-if="getContactEmail(currentInteraction.contactId)"
                variant="ghost"
                @click="sendEmail"
              >
                <Icon name="envelope" class="w-4 h-4 mr-2" />
                Email Contact
              </Button>
              <Button
                v-if="getContactPhone(currentInteraction.contactId)"
                variant="ghost"
                @click="makeCall"
              >
                <Icon name="phone" class="w-4 h-4 mr-2" />
                Call Contact
              </Button>
              
              <!-- Primary Actions -->
              <Button
                variant="secondary"
                @click="editInteraction"
              >
                <Icon name="pencil" class="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="primary"
                @click="createFollowUp"
              >
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Log Follow-up
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
          <!-- Details Tab -->
          <div v-if="activeTab === 'details'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Interaction Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Interaction Details</h3>
                
                <div class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Type</dt>
                    <dd class="text-sm text-gray-900">
                      <Badge :variant="getTypeVariant(currentInteraction.type)">
                        {{ formatType(currentInteraction.type) }}
                      </Badge>
                    </dd>
                  </div>
                  
                  <div v-if="currentInteraction.outcome">
                    <dt class="text-sm font-medium text-gray-500">Outcome</dt>
                    <dd class="text-sm text-gray-900">
                      <Badge :variant="getOutcomeVariant(currentInteraction.outcome)">
                        {{ formatOutcome(currentInteraction.outcome) }}
                      </Badge>
                    </dd>
                  </div>
                  
                  <div v-if="currentInteraction.scheduledAt">
                    <dt class="text-sm font-medium text-gray-500">Scheduled</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(currentInteraction.scheduledAt) }}</dd>
                  </div>
                  
                  <div v-if="currentInteraction.completedAt">
                    <dt class="text-sm font-medium text-gray-500">Completed</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(currentInteraction.completedAt) }}</dd>
                  </div>
                  
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Created</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(currentInteraction.createdAt) }}</dd>
                  </div>
                </div>
              </div>

              <!-- Contact & Organization -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Related Information</h3>
                
                <div class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Contact</dt>
                    <dd class="text-sm text-gray-900">
                      <router-link
                        :to="`/contacts/${currentInteraction.contactId}`"
                        class="text-blue-600 hover:text-blue-800"
                      >
                        {{ getContactName(currentInteraction.contactId) }}
                      </router-link>
                    </dd>
                  </div>
                  
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Organization</dt>
                    <dd class="text-sm text-gray-900">
                      <router-link
                        :to="`/organizations/${currentInteraction.organizationId}`"
                        class="text-blue-600 hover:text-blue-800"
                      >
                        {{ getOrganizationName(currentInteraction.organizationId) }}
                      </router-link>
                    </dd>
                  </div>
                  
                  <div v-if="currentInteraction.followUpDate">
                    <dt class="text-sm font-medium text-gray-500">Follow-up Date</dt>
                    <dd class="text-sm text-gray-900">{{ formatDate(currentInteraction.followUpDate) }}</dd>
                  </div>
                  
                  <div v-if="currentInteraction.followUpNotes">
                    <dt class="text-sm font-medium text-gray-500">Follow-up Notes</dt>
                    <dd class="text-sm text-gray-900">{{ currentInteraction.followUpNotes }}</dd>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="currentInteraction.notes" class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ currentInteraction.notes }}</p>
              </div>
            </div>

            <!-- Status Indicators -->
            <div class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Status</h3>
              <div class="flex flex-wrap gap-2">
                <Badge 
                  :variant="currentInteraction.completedAt ? 'success' : 'warning'"
                >
                  {{ currentInteraction.completedAt ? 'Completed' : 'Pending' }}
                </Badge>
                <Badge v-if="currentInteraction.isPrivate" variant="warning">
                  Private
                </Badge>
                <Badge v-if="currentInteraction.requiresFollowUp" variant="info">
                  Requires Follow-up
                </Badge>
              </div>
            </div>
          </div>

          <!-- Contact Tab -->
          <div v-else-if="activeTab === 'contact'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-medium text-gray-900">Contact Information</h3>
              <Button variant="secondary" @click="viewContact">
                <Icon name="user" class="w-4 h-4 mr-2" />
                View Contact Profile
              </Button>
            </div>

            <div v-if="currentContact" class="bg-gray-50 rounded-lg p-6">
              <div class="flex items-center space-x-4 mb-4">
                <Avatar
                  :src="currentContact.avatar"
                  :initials="generateInitials(currentContact.name)"
                  size="lg"
                />
                <div>
                  <h4 class="text-xl font-bold text-gray-900">{{ currentContact.name }}</h4>
                  <p class="text-gray-600">{{ currentContact.title }}</p>
                  <p class="text-sm text-gray-500">{{ getOrganizationName(currentContact.organizationId) }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div v-if="currentContact.priority">
                  <dt class="text-sm font-medium text-gray-500">Priority</dt>
                  <dd class="text-sm text-gray-900">
                    <Badge :variant="getPriorityVariant(currentContact.priority)">
                      {{ currentContact.priority }}
                    </Badge>
                  </dd>
                </div>
                
                <div>
                  <dt class="text-sm font-medium text-gray-500">Role</dt>
                  <dd class="text-sm text-gray-900">
                    <Badge :variant="currentContact.isDecisionMaker ? 'success' : 'secondary'">
                      {{ currentContact.isDecisionMaker ? 'Decision Maker' : 'Contact' }}
                    </Badge>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Related Interactions Tab -->
          <div v-else-if="activeTab === 'related'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-medium text-gray-900">Related Interactions</h3>
              <Button variant="primary" @click="createFollowUp">
                <Icon name="plus" class="w-4 h-4 mr-2" />
                Log Follow-up
              </Button>
            </div>

            <div v-if="relatedInteractions.length === 0" class="text-center py-12">
              <Icon name="chat-bubble-left-right" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">No related interactions</h3>
              <p class="text-gray-600 mb-4">Other interactions with this contact will appear here.</p>
              <Button @click="createFollowUp">
                Log Follow-up
              </Button>
            </div>

            <div v-else class="space-y-4">
              <InteractionEntry
                v-for="interaction in relatedInteractions"
                :key="interaction.id"
                :interaction="interaction"
                @click="viewRelatedInteraction(interaction.id)"
              />
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
import { useInteractionStore } from '@/stores/interactions'
import { useContactStore } from '@/stores/contacts'
import { useOrganizationStore } from '@/stores/organizations'
import { InteractionEntry } from '@/components/molecules'
import { Button, Icon, LoadingSpinner, Badge, Avatar } from '@/components/atoms'
import type { Interaction } from '@shared/types'

const route = useRoute()
const router = useRouter()
const interactionStore = useInteractionStore()
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// State
const activeTab = ref('details')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Computed
const interactionId = computed(() => route.params.id as string)
const currentInteraction = computed(() => interactionStore.currentInteraction)
const currentContact = computed(() => {
  if (currentInteraction.value?.contactId) {
    return contactStore.getContactById(currentInteraction.value.contactId)
  }
  return null
})

const relatedInteractions = computed(() => {
  if (!currentInteraction.value?.contactId) return []
  return interactionStore.getInteractionsByContact(currentInteraction.value.contactId)
    .filter(interaction => interaction.id !== interactionId.value)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
})

const tabs = computed(() => [
  {
    key: 'details',
    label: 'Details',
    icon: 'information-circle'
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: 'user'
  },
  {
    key: 'related',
    label: 'Related',
    icon: 'chat-bubble-left-right',
    count: relatedInteractions.value.length
  }
])

// Helper functions
const formatInteractionTitle = (interaction: Interaction | null) => {
  if (!interaction) return 'Interaction'
  return `${formatType(interaction.type)} with ${getContactName(interaction.contactId)}`
}

const generateInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getContactName = (contactId: string) => {
  const contact = contactStore.getContactById(contactId)
  return contact?.name || 'Unknown Contact'
}

const getContactEmail = (contactId: string) => {
  const contact = contactStore.getContactById(contactId)
  return contact?.email
}

const getContactPhone = (contactId: string) => {
  const contact = contactStore.getContactById(contactId)
  return contact?.phone
}

const getOrganizationName = (organizationId: string) => {
  const org = organizationStore.getOrganizationById(organizationId)
  return org?.name || 'Unknown Organization'
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    email: 'envelope',
    phone: 'phone',
    meeting: 'calendar',
    note: 'document-text',
    task: 'check-circle'
  }
  return icons[type] || 'chat-bubble-left-right'
}

const getTypeVariant = (type: string) => {
  const variants: Record<string, string> = {
    email: 'info',
    phone: 'success',
    meeting: 'warning',
    note: 'secondary',
    task: 'primary'
  }
  return variants[type] || 'secondary'
}

const getOutcomeVariant = (outcome: string) => {
  const variants: Record<string, string> = {
    positive: 'success',
    neutral: 'secondary',
    negative: 'danger',
    follow_up_required: 'warning'
  }
  return variants[outcome] || 'secondary'
}

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, string> = {
    A: 'danger',
    B: 'warning',
    C: 'secondary'
  }
  return variants[priority] || 'secondary'
}

const formatType = (type: string) => {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone Call',
    meeting: 'Meeting',
    note: 'Note',
    task: 'Task'
  }
  return labels[type] || type
}

const formatOutcome = (outcome: string) => {
  const labels: Record<string, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    follow_up_required: 'Follow-up Required'
  }
  return labels[outcome] || outcome
}

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.toLocaleString()
}

const formatDate = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.toLocaleDateString()
}

// Methods
const fetchData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Fetch interaction details
    await interactionStore.fetchInteractionById(interactionId.value)
    
    // Fetch related data
    await Promise.all([
      contactStore.fetchContacts(),
      organizationStore.fetchOrganizations(),
      interactionStore.fetchInteractions()
    ])
    
  } catch (err: any) {
    error.value = err.message || 'Failed to load interaction data'
  } finally {
    isLoading.value = false
  }
}

const retryFetch = () => {
  fetchData()
}

const goToList = () => {
  router.push('/interactions')
}

// Navigation methods
const editInteraction = () => {
  router.push(`/interactions/${interactionId.value}/edit`)
}

const viewContact = () => {
  if (currentInteraction.value?.contactId) {
    router.push(`/contacts/${currentInteraction.value.contactId}`)
  }
}

const createFollowUp = () => {
  if (currentInteraction.value) {
    router.push(`/interactions/create?contactId=${currentInteraction.value.contactId}&organizationId=${currentInteraction.value.organizationId}`)
  }
}

const viewRelatedInteraction = (id: string) => {
  router.push(`/interactions/${id}`)
}

// Quick actions
const sendEmail = () => {
  const email = getContactEmail(currentInteraction.value?.contactId || '')
  if (email) {
    window.location.href = `mailto:${email}`
  }
}

const makeCall = () => {
  const phone = getContactPhone(currentInteraction.value?.contactId || '')
  if (phone) {
    window.location.href = `tel:${phone}`
  }
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>