<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <!-- Table Header with Actions -->
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
          <Badge v-if="totalCount" variant="secondary">
            {{ totalCount }} {{ totalCount === 1 ? 'item' : 'items' }}
          </Badge>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- Bulk Actions -->
          <div v-if="selectedRows.length > 0" class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">
              {{ selectedRows.length }} selected
            </span>
            <Button
              v-for="action in bulkActions"
              :key="action.key"
              :variant="action.variant || 'secondary'"
              size="sm"
              :icon="action.icon"
              @click="handleBulkAction(action.key)"
            >
              {{ action.label }}
            </Button>
          </div>
          
          <!-- Table Actions -->
          <Button
            v-for="action in tableActions"
            :key="action.key"
            :variant="action.variant || 'primary'"
            size="sm"
            :icon="action.icon"
            @click="handleTableAction(action.key)"
          >
            {{ action.label }}
          </Button>
        </div>
      </div>
      
      <!-- Filters -->
      <div v-if="filters.length > 0" class="mt-4 flex flex-wrap gap-2">
        <div
          v-for="filter in filters"
          :key="filter.key"
          class="flex items-center"
        >
          <label :for="filter.key" class="text-sm font-medium text-gray-700 mr-2">
            {{ filter.label }}:
          </label>
          <Select
            :id="filter.key"
            v-model="filterValues[filter.key]"
            :options="filter.options"
            size="sm"
            @change="handleFilterChange"
          />
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <!-- Select All Checkbox -->
            <th v-if="selectable" class="px-6 py-3 text-left">
              <Checkbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @update:model-value="handleSelectAll"
              />
            </th>
            
            <!-- Column Headers -->
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
              ]"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable" class="flex flex-col">
                  <Icon
                    name="chevron-up"
                    :class="[
                      'h-3 w-3',
                      sortField === column.key && sortOrder === 'asc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    ]"
                  />
                  <Icon
                    name="chevron-down"
                    :class="[
                      'h-3 w-3 -mt-1',
                      sortField === column.key && sortOrder === 'desc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    ]"
                  />
                </div>
              </div>
            </th>
            
            <!-- Actions Column -->
            <th v-if="rowActions.length > 0" class="px-6 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(row, index) in data"
            :key="getRowKey(row, index)"
            :class="[
              'hover:bg-gray-50 transition-colors duration-150',
              selectedRows.includes(getRowKey(row, index)) ? 'bg-blue-50' : ''
            ]"
          >
            <!-- Row Selection -->
            <td v-if="selectable" class="px-6 py-4">
              <Checkbox
                :model-value="selectedRows.includes(getRowKey(row, index))"
                @update:model-value="handleRowSelect(getRowKey(row, index))"
              />
            </td>
            
            <!-- Row Data -->
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getNestedValue(row, column.key)"
                :column="column"
              >
                <component
                  v-if="column.component"
                  :is="column.component"
                  :value="getNestedValue(row, column.key)"
                  :row="row"
                />
                <span v-else :class="column.cellClass">
                  {{ formatCellValue(getNestedValue(row, column.key), column) }}
                </span>
              </slot>
            </td>
            
            <!-- Row Actions -->
            <td v-if="rowActions.length > 0" class="px-6 py-4 text-right">
              <div class="flex items-center justify-end space-x-2">
                <Button
                  v-for="action in rowActions"
                  :key="action.key"
                  :variant="action.variant || 'ghost'"
                  size="sm"
                  :icon="action.icon"
                  @click="handleRowAction(action.key, row)"
                >
                  {{ action.label }}
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && data.length === 0" class="text-center py-12">
      <Icon name="inbox" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">{{ emptyTitle }}</h3>
      <p class="text-gray-600 mb-4">{{ emptyDescription }}</p>
      <Button v-if="emptyAction" @click="handleEmptyAction">
        {{ emptyAction.label }}
      </Button>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && totalCount > 0" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} results
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
import { ref, computed, watch } from 'vue'
import { Badge, Button, Checkbox, Icon, LoadingSpinner, Select } from '@/components/atoms'

interface Column {
  key: string
  label: string
  sortable?: boolean
  component?: any
  cellClass?: string
  formatter?: (value: any) => string
}

interface Action {
  key: string
  label: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

interface Filter {
  key: string
  label: string
  options: Array<{ value: string; label: string }>
}

interface Props {
  title: string
  data: any[]
  columns: Column[]
  loading?: boolean
  selectable?: boolean
  pagination?: boolean
  currentPage?: number
  totalPages?: number
  totalCount?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Filter[]
  tableActions?: Action[]
  rowActions?: Action[]
  bulkActions?: Action[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: Action
  rowKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  pagination: true,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  pageSize: 50,
  sortOrder: 'asc',
  filters: () => [],
  tableActions: () => [],
  rowActions: () => [],
  bulkActions: () => [],
  emptyTitle: 'No data available',
  emptyDescription: 'There are no items to display.',
  rowKey: 'id'
})

const emit = defineEmits<{
  sort: [field: string, order: 'asc' | 'desc']
  'page-change': [page: number]
  'filter-change': [filters: Record<string, any>]
  'table-action': [action: string]
  'row-action': [action: string, row: any]
  'bulk-action': [action: string, rows: any[]]
  'selection-change': [selectedRows: string[]]
}>()

const selectedRows = ref<string[]>([])
const filterValues = ref<Record<string, any>>({})

const isAllSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < props.data.length
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, props.currentPage + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const getRowKey = (row: any, index: number) => {
  return row[props.rowKey] || index.toString()
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const formatCellValue = (value: any, column: Column) => {
  if (column.formatter) {
    return column.formatter(value)
  }
  return value?.toString() || ''
}

const handleSort = (field: string) => {
  const newOrder = props.sortField === field && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort', field, newOrder)
}

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRows.value = props.data.map((row, index) => getRowKey(row, index))
  } else {
    selectedRows.value = []
  }
  emit('selection-change', selectedRows.value)
}

const handleRowSelect = (rowKey: string) => {
  const index = selectedRows.value.indexOf(rowKey)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(rowKey)
  }
  emit('selection-change', selectedRows.value)
}

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handleFilterChange = () => {
  emit('filter-change', filterValues.value)
}

const handleTableAction = (action: string) => {
  emit('table-action', action)
}

const handleRowAction = (action: string, row: any) => {
  emit('row-action', action, row)
}

const handleBulkAction = (action: string) => {
  const selectedData = props.data.filter((row, index) => 
    selectedRows.value.includes(getRowKey(row, index))
  )
  emit('bulk-action', action, selectedData)
}

const handleEmptyAction = () => {
  if (props.emptyAction) {
    emit('table-action', props.emptyAction.key)
  }
}

// Initialize filters
watch(() => props.filters, (newFilters) => {
  newFilters.forEach(filter => {
    if (!(filter.key in filterValues.value)) {
      filterValues.value[filter.key] = ''
    }
  })
}, { immediate: true })
</script>