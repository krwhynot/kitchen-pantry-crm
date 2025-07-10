<template>
  <div class="container mx-auto px-4 py-8">
    <DataTable
      title="Organizations"
      :data="organizations"
      :columns="columns"
      :loading="isLoading"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-count="totalCount"
      :page-size="pageSize"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :filters="filters"
      :table-actions="tableActions"
      :row-actions="rowActions"
      :bulk-actions="bulkActions"
      selectable
      empty-title="No organizations found"
      empty-description="Get started by creating your first organization."
      :empty-action="{ key: 'create', label: 'Create Organization' }"
      @sort="handleSort"
      @page-change="handlePageChange"
      @filter-change="handleFilterChange"
      @table-action="handleTableAction"
      @row-action="handleRowAction"
      @bulk-action="handleBulkAction"
    >
      <!-- Custom cell templates -->
      <template #cell-name="{ row }">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <Icon name="building" class="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">
              {{ row.name }}
            </div>
            <div class="text-sm text-gray-500">
              {{ row.industry || 'No industry specified' }}
            </div>
          </div>
        </div>
      </template>

      <template #cell-type="{ value }">
        <Badge :variant="getTypeVariant(value)">
          {{ formatType(value) }}
        </Badge>
      </template>

      <template #cell-location="{ row }">
        <div class="text-sm text-gray-900">
          <div v-if="row.address">
            {{ row.address.city }}, {{ row.address.state }}
          </div>
          <div v-else class="text-gray-400">
            No location
          </div>
        </div>
      </template>

      <template #cell-status="{ value }">
        <Badge :variant="value === 'active' ? 'success' : 'secondary'">
          {{ value || 'Unknown' }}
        </Badge>
      </template>

      <template #cell-createdAt="{ value }">
        <span class="text-sm text-gray-600">
          {{ formatDate(value) }}
        </span>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organizations'
import { DataTable } from '@/components/organisms'
import { Badge, Icon } from '@/components/atoms'
import type { Organization } from '@shared/types'

const router = useRouter()
const organizationStore = useOrganizationStore()

// Reactive state
const currentPage = ref(1)
const pageSize = ref(25)
const sortField = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const filterValues = ref<Record<string, any>>({
  type: '',
  status: ''
})

// Computed properties
const organizations = computed(() => organizationStore.organizations)
const isLoading = computed(() => organizationStore.isLoading)

// Mock pagination data - in real app this would come from API response
const totalCount = computed(() => organizations.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// Table configuration
const columns = [
  {
    key: 'name',
    label: 'Organization',
    sortable: true
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true
  },
  {
    key: 'location',
    label: 'Location',
    sortable: false
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true
  }
]

const filters = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: '', label: 'All Types' },
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'distributor', label: 'Distributor' },
      { value: 'manufacturer', label: 'Manufacturer' },
      { value: 'food_service', label: 'Food Service' }
    ]
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
]

const tableActions = [
  {
    key: 'create',
    label: 'New Organization',
    icon: 'plus',
    variant: 'primary' as const
  },
  {
    key: 'import',
    label: 'Import',
    icon: 'upload',
    variant: 'secondary' as const
  }
]

const rowActions = [
  {
    key: 'view',
    label: 'View',
    icon: 'eye',
    variant: 'ghost' as const
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: 'pencil',
    variant: 'ghost' as const
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: 'trash',
    variant: 'danger' as const
  }
]

const bulkActions = [
  {
    key: 'export',
    label: 'Export Selected',
    icon: 'download',
    variant: 'secondary' as const
  },
  {
    key: 'delete',
    label: 'Delete Selected',
    icon: 'trash',
    variant: 'danger' as const
  }
]

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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// Event handlers
const handleSort = (field: string, order: 'asc' | 'desc') => {
  sortField.value = field
  sortOrder.value = order
  fetchOrganizations()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchOrganizations()
}

const handleFilterChange = (filters: Record<string, any>) => {
  filterValues.value = filters
  currentPage.value = 1 // Reset to first page when filtering
  fetchOrganizations()
}

const handleTableAction = (action: string) => {
  switch (action) {
    case 'create':
      router.push('/organizations/create')
      break
    case 'import':
      // TODO: Implement import functionality
      console.log('Import organizations')
      break
  }
}

const handleRowAction = (action: string, row: Organization) => {
  switch (action) {
    case 'view':
      router.push(`/organizations/${row.id}`)
      break
    case 'edit':
      router.push(`/organizations/${row.id}/edit`)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

const handleBulkAction = (action: string, rows: Organization[]) => {
  switch (action) {
    case 'export':
      // TODO: Implement export functionality
      console.log('Export organizations:', rows)
      break
    case 'delete':
      handleBulkDelete(rows)
      break
  }
}

const handleDelete = async (organization: Organization) => {
  if (confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
    try {
      await organizationStore.deleteOrganization(organization.id)
      // Refresh the list
      await fetchOrganizations()
    } catch (error) {
      console.error('Failed to delete organization:', error)
      // TODO: Show error notification
    }
  }
}

const handleBulkDelete = async (organizations: Organization[]) => {
  const count = organizations.length
  if (confirm(`Are you sure you want to delete ${count} organizations? This action cannot be undone.`)) {
    try {
      // Delete each organization
      await Promise.all(
        organizations.map(org => organizationStore.deleteOrganization(org.id))
      )
      // Refresh the list
      await fetchOrganizations()
    } catch (error) {
      console.error('Failed to delete organizations:', error)
      // TODO: Show error notification
    }
  }
}

const fetchOrganizations = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }

    // Add filters
    if (filterValues.value.type) {
      params.type = filterValues.value.type
    }
    
    // TODO: Add sorting and other filters as supported by the API
    
    await organizationStore.fetchOrganizations(params)
  } catch (error) {
    console.error('Failed to fetch organizations:', error)
    // TODO: Show error notification
  }
}

// Lifecycle
onMounted(() => {
  fetchOrganizations()
})

// Watch for filter changes
watch(filterValues, () => {
  fetchOrganizations()
}, { deep: true })
</script>