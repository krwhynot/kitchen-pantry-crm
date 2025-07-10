<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Interactions</h1>
          <p class="mt-2 text-gray-600">
            Track and manage all communication and activities with your contacts.
          </p>
        </div>
        
        <div class="flex items-center space-x-3">
          <Button
            variant="secondary"
            @click="exportInteractions"
          >
            <Icon name="download" class="w-4 h-4 mr-2" />
            Export
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

    <!-- Filters and Search -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <!-- Search -->
          <div class="flex-1 max-w-lg">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="magnifying-glass" class="h-5 w-5 text-gray-400" />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search interactions..."
                @input="handleSearch"
              />
            </div>
          </div>
          
          <!-- View Toggle -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">View:</span>
            <div class="flex rounded-md shadow-sm">
              <button
                :class="[
                  'px-4 py-2 text-sm font-medium border border-gray-300',
                  viewMode === 'timeline'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                  'rounded-l-md'
                ]"
                @click="viewMode = 'timeline'"
              >
                <Icon name="clock" class="w-4 h-4" />
              </button>
              <button
                :class="[
                  'px-4 py-2 text-sm font-medium border border-gray-300',
                  viewMode === 'table'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                  'rounded-r-md -ml-px'
                ]"
                @click="viewMode = 'table'"
              >
                <Icon name="list-bullet" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Advanced Filters -->
      <div class="px-6 py-4 bg-gray-50">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Type:</label>
            <Select
              v-model="filters.type"
              :options="typeFilterOptions"
              size="sm"
              class="min-w-[150px]"
              @change="applyFilters"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Outcome:</label>
            <Select
              v-model="filters.outcome"
              :options="outcomeFilterOptions"
              size="sm"
              @change="applyFilters"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Contact:</label>
            <Select
              v-model="filters.contactId"
              :options="contactFilterOptions"
              size="sm"
              class="min-w-[200px]"
              @change="applyFilters"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Organization:</label>
            <Select
              v-model="filters.organizationId"
              :options="organizationFilterOptions"
              size="sm"
              class="min-w-[200px]"
              @change="applyFilters"
            />
          </div>
          
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            @click="clearFilters"
          >
            <Icon name="x-mark" class="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-gray-600">Loading interactions...</span>
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
            Error loading interactions
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
          <div class="mt-4">
            <Button
              variant="ghost"
              size="sm"
              class="text-red-800 hover:bg-red-100"
              @click="retryFetch"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Count -->
    <div v-else-if="filteredInteractions.length > 0" class="mb-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">
          Showing {{ filteredInteractions.length }} of {{ totalInteractions }} interactions
          <span v-if="searchQuery || hasActiveFilters" class="font-medium">
            (filtered)
          </span>
        </p>
        
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-700">Sort by:</label>
          <Select
            v-model="sortBy"
            :options="sortOptions"
            size="sm"
            @change="applySorting"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <!-- Timeline View -->
    <div v-if="viewMode === 'timeline'">
      <!-- Empty State -->
      <div v-if="filteredInteractions.length === 0 && !isLoading" class="text-center py-12">
        <Icon name="chat-bubble-left-right" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery || hasActiveFilters ? 'No matching interactions' : 'No interactions yet' }}
        </h3>
        <p class="text-gray-600 mb-4">
          {{ searchQuery || hasActiveFilters 
            ? 'Try adjusting your search or filters to find what you\'re looking for.' 
            : 'Get started by logging your first interaction.' 
          }}
        </p>
        <Button v-if="!searchQuery && !hasActiveFilters" @click="createInteraction">
          <Icon name="plus" class="w-4 h-4 mr-2" />
          Log Interaction
        </Button>
        <Button v-else variant="secondary" @click="clearFilters">
          Clear Filters
        </Button>
      </div>

      <!-- Interaction Timeline -->
      <div v-else class="space-y-6">
        <InteractionEntry
          v-for="interaction in paginatedInteractions"
          :key="interaction.id"
          :interaction="interaction"
          @click="viewInteraction(interaction.id)"
        />
      </div>
    </div>

    <!-- Table View -->
    <div v-else-if="viewMode === 'table'">
      <DataTable
        title="Interactions"
        :data="filteredInteractions"
        :columns="tableColumns"
        :loading="isLoading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-count="filteredInteractions.length"
        :page-size="pageSize"
        :table-actions="tableActions"
        :row-actions="rowActions"
        :bulk-actions="bulkActions"
        selectable
        empty-title="No interactions found"
        empty-description="Get started by logging your first interaction."
        :empty-action="{ key: 'create', label: 'Log Interaction' }"
        @page-change="handlePageChange"
        @table-action="handleTableAction"
        @row-action="handleRowAction"
        @bulk-action="handleBulkAction"
      >
        <!-- Custom cell templates -->
        <template #cell-contact="{ row }">
          <div class="text-sm">
            <div class="font-medium text-gray-900">{{ getContactName(row.contactId) }}</div>
            <div class="text-gray-500">{{ getOrganizationName(row.organizationId) }}</div>
          </div>
        </template>

        <template #cell-type="{ value }">
          <Badge :variant="getTypeVariant(value)">
            {{ formatType(value) }}
          </Badge>
        </template>

        <template #cell-outcome="{ value }">
          <Badge :variant="getOutcomeVariant(value)">
            {{ formatOutcome(value) }}
          </Badge>
        </template>

        <template #cell-scheduledAt="{ value }">
          <span class="text-sm text-gray-600">
            {{ value ? formatDateTime(value) : '-' }}
          </span>
        </template>

        <template #cell-completedAt="{ value }">
          <span class="text-sm text-gray-600">
            {{ value ? formatDateTime(value) : 'Not completed' }}
          </span>
        </template>

        <template #cell-notes="{ value }">
          <span class="text-sm text-gray-600">
            {{ value ? truncateText(value, 50) : '-' }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- Pagination for Timeline View -->
    <div v-if="viewMode === 'timeline' && filteredInteractions.length > pageSize" class="mt-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredInteractions.length) }} of {{ filteredInteractions.length }} results
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            Previous
          </Button>
          
          <div class="flex items-center space-x-1">
            <Button
              v-for="page in visiblePages"
              :key="page"
              :variant="page === currentPage ? 'primary' : 'ghost'"
              size="sm"
              @click="handlePageChange(page)"
            >
              {{ page }}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInteractionStore } from '@/stores/interactions'
import { useContactStore } from '@/stores/contacts'
import { useOrganizationStore } from '@/stores/organizations'
import { InteractionEntry } from '@/components/molecules'
import { DataTable } from '@/components/organisms'
import { Button, Icon, LoadingSpinner, Select, Badge } from '@/components/atoms'
import type { Interaction } from '@shared/types'

const router = useRouter()
const interactionStore = useInteractionStore()
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// State
const viewMode = ref<'timeline' | 'table'>('timeline')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const sortBy = ref('recent')

const filters = ref({
  type: '',
  outcome: '',
  contactId: '',
  organizationId: ''
})

// Computed
const isLoading = computed(() => interactionStore.isLoading)
const error = computed(() => interactionStore.error)
const interactions = computed(() => interactionStore.interactions)
const totalInteractions = computed(() => interactions.value.length)

const hasActiveFilters = computed(() => 
  Object.values(filters.value).some(value => value !== '')
)

const filteredInteractions = computed(() => {
  let result = [...interactions.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(interaction => 
      interaction.notes?.toLowerCase().includes(query) ||
      getContactName(interaction.contactId).toLowerCase().includes(query) ||
      getOrganizationName(interaction.organizationId).toLowerCase().includes(query) ||
      interaction.type.toLowerCase().includes(query) ||
      interaction.outcome?.toLowerCase().includes(query)
    )
  }
  
  // Apply filters
  if (filters.value.type) {
    result = result.filter(interaction => interaction.type === filters.value.type)
  }
  
  if (filters.value.outcome) {
    result = result.filter(interaction => interaction.outcome === filters.value.outcome)
  }
  
  if (filters.value.contactId) {
    result = result.filter(interaction => interaction.contactId === filters.value.contactId)
  }
  
  if (filters.value.organizationId) {
    result = result.filter(interaction => interaction.organizationId === filters.value.organizationId)
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'recent':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      case 'contact':
        return getContactName(a.contactId).localeCompare(getContactName(b.contactId))
      case 'organization':
        return getOrganizationName(a.organizationId).localeCompare(getOrganizationName(b.organizationId))
      case 'type':
        return a.type.localeCompare(b.type)
      case 'outcome':
        return (a.outcome || '').localeCompare(b.outcome || '')
      default:
        return 0
    }
  })
  
  return result
})

const paginatedInteractions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredInteractions.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredInteractions.value.length / pageSize.value))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Filter options
const typeFilterOptions = [
  { value: '', label: 'All Types' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' }
]

const outcomeFilterOptions = [
  { value: '', label: 'All Outcomes' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'follow_up_required', label: 'Follow-up Required' }
]

const contactFilterOptions = computed(() => [
  { value: '', label: 'All Contacts' },
  ...contactStore.contacts.map(contact => ({
    value: contact.id,
    label: contact.name
  }))
])

const organizationFilterOptions = computed(() => [
  { value: '', label: 'All Organizations' },
  ...organizationStore.organizations.map(org => ({
    value: org.id,
    label: org.name
  }))
])

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'contact', label: 'Contact Name' },
  { value: 'organization', label: 'Organization' },
  { value: 'type', label: 'Type' },
  { value: 'outcome', label: 'Outcome' }
]

// Table configuration
const tableColumns = [
  { key: 'contact', label: 'Contact/Organization', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'outcome', label: 'Outcome', sortable: true },
  { key: 'scheduledAt', label: 'Scheduled', sortable: true },
  { key: 'completedAt', label: 'Completed', sortable: true },
  { key: 'notes', label: 'Notes', sortable: false }
]

const tableActions = [
  { key: 'create', label: 'Log Interaction', icon: 'plus', variant: 'primary' as const },
  { key: 'export', label: 'Export', icon: 'download', variant: 'secondary' as const }
]

const rowActions = [
  { key: 'view', label: 'View', icon: 'eye', variant: 'ghost' as const },
  { key: 'edit', label: 'Edit', icon: 'pencil', variant: 'ghost' as const },
  { key: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' as const }
]

const bulkActions = [
  { key: 'export', label: 'Export Selected', icon: 'download', variant: 'secondary' as const },
  { key: 'delete', label: 'Delete Selected', icon: 'trash', variant: 'danger' as const }
]

// Helper functions
const getContactName = (contactId: string) => {
  const contact = contactStore.getContactById(contactId)
  return contact?.name || 'Unknown Contact'
}

const getOrganizationName = (organizationId: string) => {
  const org = organizationStore.getOrganizationById(organizationId)
  return org?.name || 'Unknown Organization'
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

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Event handlers
const handleSearch = () => {
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
}

const applySorting = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  filters.value = {
    type: '',
    outcome: '',
    contactId: '',
    organizationId: ''
  }
  searchQuery.value = ''
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const createInteraction = () => {
  router.push('/interactions/create')
}

const viewInteraction = (interactionId: string) => {
  router.push(`/interactions/${interactionId}`)
}

const exportInteractions = () => {
  // TODO: Implement export functionality
  console.log('Export interactions')
}

const retryFetch = () => {
  fetchInteractions()
}

const handleTableAction = (action: string) => {
  switch (action) {
    case 'create':
      createInteraction()
      break
    case 'export':
      exportInteractions()
      break
  }
}

const handleRowAction = (action: string, row: Interaction) => {
  switch (action) {
    case 'view':
      viewInteraction(row.id)
      break
    case 'edit':
      router.push(`/interactions/${row.id}/edit`)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

const handleBulkAction = (action: string, rows: Interaction[]) => {
  switch (action) {
    case 'export':
      // TODO: Implement export functionality
      console.log('Export interactions:', rows)
      break
    case 'delete':
      handleBulkDelete(rows)
      break
  }
}

const handleDelete = async (interaction: Interaction) => {
  if (confirm('Are you sure you want to delete this interaction? This action cannot be undone.')) {
    try {
      await interactionStore.deleteInteraction(interaction.id)
      await fetchInteractions()
    } catch (error) {
      console.error('Failed to delete interaction:', error)
    }
  }
}

const handleBulkDelete = async (interactions: Interaction[]) => {
  const count = interactions.length
  if (confirm(`Are you sure you want to delete ${count} interactions? This action cannot be undone.`)) {
    try {
      await Promise.all(
        interactions.map(interaction => interactionStore.deleteInteraction(interaction.id))
      )
      await fetchInteractions()
    } catch (error) {
      console.error('Failed to delete interactions:', error)
    }
  }
}

const fetchInteractions = async () => {
  try {
    await interactionStore.fetchInteractions()
  } catch (error) {
    console.error('Failed to fetch interactions:', error)
  }
}

// Lifecycle
onMounted(async () => {
  // Load interactions, contacts, and organizations
  await Promise.all([
    fetchInteractions(),
    contactStore.fetchContacts(),
    organizationStore.fetchOrganizations()
  ])
})

// Watch for filter changes to reset pagination
watch(
  [searchQuery, filters],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)
</script>