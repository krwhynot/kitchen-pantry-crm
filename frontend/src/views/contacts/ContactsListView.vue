<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contacts</h1>
          <p class="mt-2 text-gray-600">
            Manage your business contacts and relationships.
          </p>
        </div>
        
        <div class="flex items-center space-x-3">
          <Button
            variant="secondary"
            @click="importContacts"
          >
            <Icon name="upload" class="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            variant="primary"
            @click="createContact"
          >
            <Icon name="plus" class="w-4 h-4 mr-2" />
            New Contact
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
                placeholder="Search contacts..."
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
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                  'rounded-l-md'
                ]"
                @click="viewMode = 'grid'"
              >
                <Icon name="squares-2x2" class="w-4 h-4" />
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
            <label class="text-sm font-medium text-gray-700">Organization:</label>
            <Select
              v-model="filters.organizationId"
              :options="organizationFilterOptions"
              size="sm"
              class="min-w-[200px]"
              @change="applyFilters"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Priority:</label>
            <Select
              v-model="filters.priority"
              :options="priorityFilterOptions"
              size="sm"
              @change="applyFilters"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Role:</label>
            <Select
              v-model="filters.isDecisionMaker"
              :options="roleFilterOptions"
              size="sm"
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
      <span class="ml-3 text-gray-600">Loading contacts...</span>
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
            Error loading contacts
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
    <div v-else-if="filteredContacts.length > 0" class="mb-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">
          Showing {{ filteredContacts.length }} of {{ totalContacts }} contacts
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
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'">
      <!-- Empty State -->
      <div v-if="filteredContacts.length === 0 && !isLoading" class="text-center py-12">
        <Icon name="users" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery || hasActiveFilters ? 'No matching contacts' : 'No contacts yet' }}
        </h3>
        <p class="text-gray-600 mb-4">
          {{ searchQuery || hasActiveFilters 
            ? 'Try adjusting your search or filters to find what you\'re looking for.' 
            : 'Get started by adding your first contact.' 
          }}
        </p>
        <Button v-if="!searchQuery && !hasActiveFilters" @click="createContact">
          <Icon name="plus" class="w-4 h-4 mr-2" />
          Add Contact
        </Button>
        <Button v-else variant="secondary" @click="clearFilters">
          Clear Filters
        </Button>
      </div>

      <!-- Contact Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ContactCard
          v-for="contact in filteredContacts"
          :key="contact.id"
          :contact="contact"
          @click="viewContact(contact.id)"
        />
      </div>
    </div>

    <!-- Table View -->
    <div v-else-if="viewMode === 'table'">
      <DataTable
        title="Contacts"
        :data="filteredContacts"
        :columns="tableColumns"
        :loading="isLoading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-count="filteredContacts.length"
        :page-size="pageSize"
        :table-actions="tableActions"
        :row-actions="rowActions"
        :bulk-actions="bulkActions"
        selectable
        empty-title="No contacts found"
        empty-description="Get started by creating your first contact."
        :empty-action="{ key: 'create', label: 'Create Contact' }"
        @page-change="handlePageChange"
        @table-action="handleTableAction"
        @row-action="handleRowAction"
        @bulk-action="handleBulkAction"
      >
        <!-- Custom cell templates -->
        <template #cell-name="{ row }">
          <div class="flex items-center">
            <Avatar
              :src="row.avatar"
              :initials="generateInitials(row.name)"
              size="sm"
            />
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-900">{{ row.name }}</div>
              <div class="text-sm text-gray-500">{{ row.title || 'No title' }}</div>
            </div>
          </div>
        </template>

        <template #cell-organization="{ row }">
          <div class="text-sm text-gray-900">
            {{ getOrganizationName(row.organizationId) }}
          </div>
        </template>

        <template #cell-priority="{ value }">
          <Badge v-if="value" :variant="getPriorityVariant(value)">
            {{ value }}
          </Badge>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #cell-isDecisionMaker="{ value }">
          <Badge :variant="value ? 'success' : 'secondary'">
            {{ value ? 'Decision Maker' : 'Contact' }}
          </Badge>
        </template>

        <template #cell-lastInteraction="{ value }">
          <span class="text-sm text-gray-600">
            {{ value ? formatDate(value) : 'Never' }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- Pagination for Grid View -->
    <div v-if="viewMode === 'grid' && filteredContacts.length > pageSize" class="mt-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredContacts.length) }} of {{ filteredContacts.length }} results
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
import { useContactStore } from '@/stores/contacts'
import { useOrganizationStore } from '@/stores/organizations'
import { ContactCard } from '@/components/molecules'
import { DataTable } from '@/components/organisms'
import { Button, Icon, LoadingSpinner, Select, Badge, Avatar } from '@/components/atoms'
import type { Contact } from '@shared/types'

const router = useRouter()
const contactStore = useContactStore()
const organizationStore = useOrganizationStore()

// State
const viewMode = ref<'grid' | 'table'>('grid')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(24)
const sortBy = ref('name')

const filters = ref({
  organizationId: '',
  priority: '',
  isDecisionMaker: ''
})

// Computed
const isLoading = computed(() => contactStore.isLoading)
const error = computed(() => contactStore.error)
const contacts = computed(() => contactStore.contacts)
const totalContacts = computed(() => contacts.value.length)

const hasActiveFilters = computed(() => 
  Object.values(filters.value).some(value => value !== '')
)

const filteredContacts = computed(() => {
  let result = [...contacts.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.title?.toLowerCase().includes(query) ||
      getOrganizationName(contact.organizationId).toLowerCase().includes(query)
    )
  }
  
  // Apply filters
  if (filters.value.organizationId) {
    result = result.filter(contact => contact.organizationId === filters.value.organizationId)
  }
  
  if (filters.value.priority) {
    result = result.filter(contact => contact.priority === filters.value.priority)
  }
  
  if (filters.value.isDecisionMaker) {
    const isDecisionMaker = filters.value.isDecisionMaker === 'true'
    result = result.filter(contact => contact.isDecisionMaker === isDecisionMaker)
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'organization':
        return getOrganizationName(a.organizationId).localeCompare(getOrganizationName(b.organizationId))
      case 'priority':
        return (a.priority || 'Z').localeCompare(b.priority || 'Z')
      case 'recent':
        return new Date(b.lastInteraction || 0).getTime() - new Date(a.lastInteraction || 0).getTime()
      default:
        return 0
    }
  })
  
  return result
})

const totalPages = computed(() => Math.ceil(filteredContacts.value.length / pageSize.value))

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
const organizationFilterOptions = computed(() => [
  { value: '', label: 'All Organizations' },
  ...organizationStore.organizations.map(org => ({
    value: org.id,
    label: org.name
  }))
])

const priorityFilterOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'A', label: 'A - High Priority' },
  { value: 'B', label: 'B - Medium Priority' },
  { value: 'C', label: 'C - Low Priority' }
]

const roleFilterOptions = [
  { value: '', label: 'All Roles' },
  { value: 'true', label: 'Decision Makers' },
  { value: 'false', label: 'Contacts' }
]

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'organization', label: 'Organization' },
  { value: 'priority', label: 'Priority' },
  { value: 'recent', label: 'Recent Activity' }
]

// Table configuration
const tableColumns = [
  { key: 'name', label: 'Contact', sortable: true },
  { key: 'organization', label: 'Organization', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'isDecisionMaker', label: 'Role', sortable: true },
  { key: 'lastInteraction', label: 'Last Contact', sortable: true }
]

const tableActions = [
  { key: 'create', label: 'New Contact', icon: 'plus', variant: 'primary' as const },
  { key: 'import', label: 'Import', icon: 'upload', variant: 'secondary' as const }
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

const generateInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
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
    organizationId: '',
    priority: '',
    isDecisionMaker: ''
  }
  searchQuery.value = ''
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const createContact = () => {
  router.push('/contacts/create')
}

const viewContact = (contactId: string) => {
  router.push(`/contacts/${contactId}`)
}

const importContacts = () => {
  // TODO: Implement import functionality
  console.log('Import contacts')
}

const retryFetch = () => {
  fetchContacts()
}

const handleTableAction = (action: string) => {
  switch (action) {
    case 'create':
      createContact()
      break
    case 'import':
      importContacts()
      break
  }
}

const handleRowAction = (action: string, row: Contact) => {
  switch (action) {
    case 'view':
      viewContact(row.id)
      break
    case 'edit':
      router.push(`/contacts/${row.id}/edit`)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

const handleBulkAction = (action: string, rows: Contact[]) => {
  switch (action) {
    case 'export':
      // TODO: Implement export functionality
      console.log('Export contacts:', rows)
      break
    case 'delete':
      handleBulkDelete(rows)
      break
  }
}

const handleDelete = async (contact: Contact) => {
  if (confirm(`Are you sure you want to delete "${contact.name}"? This action cannot be undone.`)) {
    try {
      await contactStore.deleteContact(contact.id)
      await fetchContacts()
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }
}

const handleBulkDelete = async (contacts: Contact[]) => {
  const count = contacts.length
  if (confirm(`Are you sure you want to delete ${count} contacts? This action cannot be undone.`)) {
    try {
      await Promise.all(
        contacts.map(contact => contactStore.deleteContact(contact.id))
      )
      await fetchContacts()
    } catch (error) {
      console.error('Failed to delete contacts:', error)
    }
  }
}

const fetchContacts = async () => {
  try {
    await contactStore.fetchContacts()
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
  }
}

// Lifecycle
onMounted(async () => {
  // Load both contacts and organizations
  await Promise.all([
    fetchContacts(),
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