# Kitchen Pantry CRM - Frontend Component Architecture

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM frontend architecture leverages Vue.js 3 with Composition API, TypeScript, and Tailwind CSS to create a responsive, touch-optimized interface specifically designed for food service industry professionals. The component architecture emphasizes reusability, maintainability, and progressive enhancement from existing HTML templates to a fully reactive single-page application.

The system implements a hierarchical component structure with atomic design principles, supporting both desktop and mobile interfaces with particular emphasis on iPad optimization for field sales representatives. State management through Pinia provides centralized data handling while maintaining component isolation and testability.

The architecture supports Progressive Web App (PWA) capabilities including offline functionality, push notifications, and native-like user experiences essential for mobile CRM operations. All components follow WCAG accessibility guidelines with enhanced touch targets and keyboard navigation support.

## Component Architecture Overview

### Atomic Design Methodology

The Kitchen Pantry CRM frontend follows atomic design principles, organizing components into five distinct levels that promote reusability and maintainability across the application.

**Atoms** represent the fundamental building blocks of the interface, including buttons, input fields, labels, and icons. These components are highly reusable and contain no business logic, focusing purely on presentation and basic interaction handling. Atoms establish the visual foundation and ensure consistency across all interface elements.

**Molecules** combine atoms to create functional interface components such as search bars, form fields with labels and validation, and navigation items. Molecules introduce basic functionality while remaining context-agnostic, making them suitable for use across different sections of the application.

**Organisms** are complex components that combine molecules and atoms to create distinct sections of the interface, such as navigation headers, data tables, and form panels. Organisms contain business logic and state management, serving as the primary building blocks for page layouts.

**Templates** define page layouts and structure without specific content, establishing the overall information architecture and responsive behavior. Templates provide the scaffolding for different page types while maintaining consistency in navigation, spacing, and content organization.

**Pages** represent complete interface views that combine templates with specific content and data, implementing route-specific logic and state management. Pages serve as the entry points for user interactions and coordinate between multiple organisms to deliver complete functionality.

### Component Hierarchy Structure

The component hierarchy reflects the application's information architecture and user workflow patterns:

```
src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   └── Icon/
│   ├── molecules/
│   │   ├── SearchBar/
│   │   ├── FormField/
│   │   ├── NavigationItem/
│   │   ├── ContactCard/
│   │   └── InteractionEntry/
│   ├── organisms/
│   │   ├── AppHeader/
│   │   ├── Sidebar/
│   │   ├── DataTable/
│   │   ├── OrganizationForm/
│   │   └── InteractionTimeline/
│   ├── templates/
│   │   ├── DashboardLayout/
│   │   ├── DetailLayout/
│   │   └── FormLayout/
│   └── pages/
│       ├── Dashboard/
│       ├── Organizations/
│       ├── Contacts/
│       └── Interactions/
```

This structure promotes component reusability while maintaining clear separation of concerns and enabling efficient development workflows.

## Core Component Specifications

### Atomic Components

#### Button Component

The Button component serves as the foundation for all interactive elements, providing consistent styling, accessibility, and touch optimization across the application.

```typescript
// components/atoms/Button/Button.vue
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
    :aria-label="ariaLabel"
  >
    <Icon v-if="icon && !loading" :name="icon" :size="iconSize" />
    <LoadingSpinner v-if="loading" :size="iconSize" />
    <span v-if="$slots.default" :class="textClasses">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
  touchOptimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  touchOptimized: true
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: props.touchOptimized ? 'px-4 py-2 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: props.touchOptimized ? 'px-6 py-3 text-lg min-h-[52px]' : 'px-6 py-3 text-lg',
    xl: props.touchOptimized ? 'px-8 py-4 text-xl min-h-[56px]' : 'px-8 py-4 text-xl'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant]
  ].join(' ')
})

const iconSize = computed(() => {
  const sizes = { sm: 16, md: 20, lg: 24, xl: 28 }
  return sizes[props.size]
})

const textClasses = computed(() => {
  return props.icon ? 'ml-2' : ''
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
```

The Button component implements comprehensive accessibility features including ARIA labels, keyboard navigation, and screen reader support. Touch optimization ensures minimum 44px touch targets with enhanced 48px targets for primary actions, exceeding WCAG AA requirements.

#### Input Component

The Input component provides consistent form input handling with validation, accessibility, and responsive design features.

```typescript
// components/atoms/Input/Input.vue
<template>
  <div class="relative">
    <input
      :id="inputId"
      ref="inputRef"
      v-model="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="inputClasses"
      :aria-describedby="errorId"
      :aria-invalid="hasError"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    
    <div v-if="icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon :name="icon" class="h-5 w-5 text-gray-400" />
    </div>
    
    <div v-if="hasError" class="absolute inset-y-0 right-0 pr-3 flex items-center">
      <Icon name="exclamation-circle" class="h-5 w-5 text-red-500" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { generateId } from '@/utils/helpers'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  icon?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  touchOptimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  touchOptimized: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  input: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputRef = ref<HTMLInputElement>()
const inputId = generateId('input')
const errorId = computed(() => `${inputId}-error`)
const hasError = computed(() => Boolean(props.error))

const inputClasses = computed(() => {
  const baseClasses = [
    'block w-full rounded-lg border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
  ]

  // Size classes with touch optimization
  const sizeClasses = {
    sm: props.touchOptimized ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: props.touchOptimized ? 'px-4 py-3 text-base min-h-[48px]' : 'px-4 py-3 text-base',
    lg: props.touchOptimized ? 'px-5 py-4 text-lg min-h-[52px]' : 'px-5 py-4 text-lg'
  }

  // State classes
  const stateClasses = hasError.value
    ? 'border-red-300 text-red-900 placeholder-red-300'
    : 'border-gray-300 text-gray-900 placeholder-gray-400'

  // Icon padding
  const iconClasses = props.icon ? 'pl-10' : ''

  return [
    ...baseClasses,
    sizeClasses[props.size],
    stateClasses,
    iconClasses
  ].join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

// Public methods
const focus = async () => {
  await nextTick()
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

defineExpose({ focus, blur })
</script>
```

The Input component includes comprehensive validation support, accessibility features, and responsive design patterns optimized for touch interfaces.

### Molecular Components

#### SearchBar Component

The SearchBar component combines input functionality with search-specific features including autocomplete, recent searches, and keyboard shortcuts.

```typescript
// components/molecules/SearchBar/SearchBar.vue
<template>
  <div class="relative" ref="searchContainer">
    <div class="relative">
      <Input
        v-model="searchQuery"
        type="search"
        :placeholder="placeholder"
        icon="search"
        :size="size"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      
      <div v-if="showClearButton" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          icon="x"
          @click="clearSearch"
          aria-label="Clear search"
        />
      </div>
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults"
      class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
    >
      <!-- Recent Searches -->
      <div v-if="recentSearches.length > 0 && !searchQuery" class="p-2">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1">
          Recent Searches
        </div>
        <button
          v-for="recent in recentSearches"
          :key="recent"
          class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
          @click="selectRecentSearch(recent)"
        >
          <Icon name="clock" class="h-4 w-4 text-gray-400 mr-2" />
          {{ recent }}
        </button>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="p-2">
        <div
          v-for="(result, index) in searchResults"
          :key="result.id"
          :class="[
            'px-3 py-2 text-sm cursor-pointer rounded flex items-center',
            index === selectedIndex ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
          ]"
          @click="selectResult(result)"
        >
          <Icon :name="getResultIcon(result.type)" class="h-4 w-4 mr-2" />
          <div class="flex-1">
            <div class="font-medium">{{ result.title }}</div>
            <div class="text-xs opacity-75">{{ result.subtitle }}</div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="searchQuery && searchResults.length === 0 && !isLoading" class="p-4 text-center text-gray-500">
        No results found for "{{ searchQuery }}"
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="p-4 text-center">
        <LoadingSpinner size="sm" />
        <span class="ml-2 text-sm text-gray-500">Searching...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import { useLocalStorage } from '@/composables/useLocalStorage'

interface SearchResult {
  id: string
  type: 'organization' | 'contact' | 'opportunity'
  title: string
  subtitle: string
  data: any
}

interface Props {
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  searchTypes?: string[]
  minSearchLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search organizations, contacts, opportunities...',
  size: 'md',
  searchTypes: () => ['organizations', 'contacts', 'opportunities'],
  minSearchLength: 2
})

const emit = defineEmits<{
  search: [query: string, types: string[]]
  select: [result: SearchResult]
}>()

const searchContainer = ref<HTMLElement>()
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const selectedIndex = ref(-1)
const showResults = ref(false)
const isLoading = ref(false)

// Recent searches persistence
const { value: recentSearches, setValue: setRecentSearches } = useLocalStorage<string[]>('recent-searches', [])

// Debounced search
const debouncedSearch = useDebounce((query: string) => {
  if (query.length >= props.minSearchLength) {
    performSearch(query)
  } else {
    searchResults.value = []
    isLoading.value = false
  }
}, 300)

const showClearButton = computed(() => searchQuery.value.length > 0)

const handleInput = () => {
  selectedIndex.value = -1
  if (searchQuery.value.length >= props.minSearchLength) {
    isLoading.value = true
    debouncedSearch(searchQuery.value)
  } else {
    searchResults.value = []
    isLoading.value = false
  }
}

const handleFocus = () => {
  showResults.value = true
}

const handleBlur = (event: FocusEvent) => {
  // Delay hiding results to allow for result selection
  setTimeout(() => {
    if (!searchContainer.value?.contains(event.relatedTarget as Node)) {
      showResults.value = false
    }
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && searchResults.value[selectedIndex.value]) {
        selectResult(searchResults.value[selectedIndex.value])
      } else if (searchQuery.value) {
        performSearch(searchQuery.value)
        addToRecentSearches(searchQuery.value)
      }
      break
    case 'Escape':
      showResults.value = false
      selectedIndex.value = -1
      break
  }
}

const performSearch = async (query: string) => {
  try {
    emit('search', query, props.searchTypes)
    // Results will be updated via props or store
  } catch (error) {
    console.error('Search error:', error)
    isLoading.value = false
  }
}

const selectResult = (result: SearchResult) => {
  searchQuery.value = result.title
  showResults.value = false
  selectedIndex.value = -1
  addToRecentSearches(result.title)
  emit('select', result)
}

const selectRecentSearch = (query: string) => {
  searchQuery.value = query
  performSearch(query)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
  selectedIndex.value = -1
}

const addToRecentSearches = (query: string) => {
  const updated = [query, ...recentSearches.value.filter(s => s !== query)].slice(0, 5)
  setRecentSearches(updated)
}

const getResultIcon = (type: string) => {
  const icons = {
    organization: 'building-office',
    contact: 'user',
    opportunity: 'currency-dollar'
  }
  return icons[type] || 'document'
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (!searchContainer.value?.contains(event.target as Node)) {
    showResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for external search results
watch(() => searchResults, (newResults) => {
  isLoading.value = false
}, { deep: true })
</script>
```

The SearchBar component provides comprehensive search functionality with keyboard navigation, recent search history, and result categorization optimized for CRM workflows.

### Organism Components

#### DataTable Component

The DataTable component provides comprehensive data display with sorting, filtering, pagination, and bulk actions optimized for CRM data management.

```typescript
// components/organisms/DataTable/DataTable.vue
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
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
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
                        ? 'text-primary'
                        : 'text-gray-400'
                    ]"
                  />
                  <Icon
                    name="chevron-down"
                    :class="[
                      'h-3 w-3 -mt-1',
                      sortField === column.key && sortOrder === 'desc'
                        ? 'text-primary'
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
              <input
                type="checkbox"
                :checked="selectedRows.includes(getRowKey(row, index))"
                @change="handleRowSelect(getRowKey(row, index))"
                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
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
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-count="totalCount"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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
  'page-size-change': [size: number]
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

const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
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

const handlePageSizeChange = (size: number) => {
  emit('page-size-change', size)
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
```

The DataTable component provides comprehensive data management capabilities with responsive design, accessibility features, and extensive customization options essential for CRM data operations.

## State Management Architecture

### Pinia Store Structure

The application uses Pinia for centralized state management with modular stores organized by business domain:

```typescript
// stores/index.ts
export { useAuthStore } from './auth'
export { useOrganizationsStore } from './organizations'
export { useContactsStore } from './contacts'
export { useInteractionsStore } from './interactions'
export { useOpportunitiesStore } from './opportunities'
export { useUIStore } from './ui'
```

#### Organizations Store

```typescript
// stores/organizations.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Organization, OrganizationFilters } from '@/types'
import { organizationsApi } from '@/api/organizations'

export const useOrganizationsStore = defineStore('organizations', () => {
  // State
  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<OrganizationFilters>({
    search: '',
    industry_segment: '',
    priority_level: '',
    assigned_user_id: ''
  })
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  // Getters
  const priorityOrganizations = computed(() => 
    organizations.value.filter(org => org.priority_level === 'A')
  )

  const organizationsBySegment = computed(() => {
    const grouped: Record<string, Organization[]> = {}
    organizations.value.forEach(org => {
      const segment = org.industry_segment || 'Other'
      if (!grouped[segment]) grouped[segment] = []
      grouped[segment].push(org)
    })
    return grouped
  })

  // Actions
  const fetchOrganizations = async (params?: Partial<OrganizationFilters>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await organizationsApi.list({
        ...filters.value,
        ...params,
        page: pagination.value.page,
        limit: pagination.value.limit
      })
      
      organizations.value = response.data
      pagination.value = {
        page: response.meta.pagination.page,
        limit: response.meta.pagination.limit,
        total: response.meta.pagination.total,
        pages: response.meta.pagination.pages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch organizations'
      console.error('Error fetching organizations:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchOrganization = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await organizationsApi.get(id)
      currentOrganization.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch organization'
      console.error('Error fetching organization:', err)
    } finally {
      loading.value = false
    }
  }

  const createOrganization = async (data: Partial<Organization>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await organizationsApi.create(data)
      organizations.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create organization'
      console.error('Error creating organization:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateOrganization = async (id: string, data: Partial<Organization>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await organizationsApi.update(id, data)
      const index = organizations.value.findIndex(org => org.id === id)
      if (index !== -1) {
        organizations.value[index] = response.data
      }
      if (currentOrganization.value?.id === id) {
        currentOrganization.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update organization'
      console.error('Error updating organization:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteOrganization = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await organizationsApi.delete(id)
      organizations.value = organizations.value.filter(org => org.id !== id)
      if (currentOrganization.value?.id === id) {
        currentOrganization.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete organization'
      console.error('Error deleting organization:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const setFilters = (newFilters: Partial<OrganizationFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // Reset to first page when filtering
  }

  const setPage = (page: number) => {
    pagination.value.page = page
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    organizations,
    currentOrganization,
    loading,
    error,
    filters,
    pagination,
    
    // Getters
    priorityOrganizations,
    organizationsBySegment,
    
    // Actions
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setFilters,
    setPage,
    clearError
  }
})
```

### Composables for Reusable Logic

The application uses Vue composables to encapsulate reusable logic and provide consistent interfaces across components:

```typescript
// composables/useFormValidation.ts
import { ref, computed, watch } from 'vue'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRules
) {
  const data = ref<T>({ ...initialData })
  const errors = ref<Record<string, string>>({})
  const touched = ref<Record<string, boolean>>({})

  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  const validateField = (field: string, value: any): string | null => {
    const rule = rules[field]
    if (!rule) return null

    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${field} is required`
    }

    if (value && rule.minLength && value.toString().length < rule.minLength) {
      return `${field} must be at least ${rule.minLength} characters`
    }

    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      return `${field} must be no more than ${rule.maxLength} characters`
    }

    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      return `${field} format is invalid`
    }

    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    Object.keys(rules).forEach(field => {
      const error = validateField(field, data.value[field])
      if (error) {
        newErrors[field] = error
      }
    })
    
    errors.value = newErrors
    return Object.keys(newErrors).length === 0
  }

  const validateSingleField = (field: string) => {
    const error = validateField(field, data.value[field])
    if (error) {
      errors.value[field] = error
    } else {
      delete errors.value[field]
    }
    touched.value[field] = true
  }

  const setFieldValue = (field: string, value: any) => {
    data.value[field] = value
    if (touched.value[field]) {
      validateSingleField(field)
    }
  }

  const setFieldTouched = (field: string) => {
    touched.value[field] = true
    validateSingleField(field)
  }

  const reset = () => {
    data.value = { ...initialData }
    errors.value = {}
    touched.value = {}
  }

  // Watch for data changes and validate touched fields
  watch(data, () => {
    Object.keys(touched.value).forEach(field => {
      if (touched.value[field]) {
        validateSingleField(field)
      }
    })
  }, { deep: true })

  return {
    data,
    errors,
    touched,
    isValid,
    validate,
    validateSingleField,
    setFieldValue,
    setFieldTouched,
    reset
  }
}
```

## Responsive Design and Touch Optimization

### Breakpoint System

The application implements a comprehensive responsive design system optimized for various device types:

```typescript
// utils/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
} as const

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.md})`,
  tablet: `(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `(min-width: ${breakpoints.lg})`,
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)'
} as const
```

### Touch-First Design Principles

All interactive elements follow touch-first design principles with enhanced accessibility:

**Minimum Touch Targets:** 44px × 44px for WCAG AA compliance, with 48px × 48px preferred for enhanced usability. Critical actions use 56px height for improved accessibility.

**Touch Gesture Support:** Swipe gestures for navigation, pull-to-refresh for data updates, and long-press for contextual actions. All gestures include visual feedback and haptic responses where supported.

**Responsive Typography:** Fluid typography scaling based on viewport size with enhanced readability on mobile devices. Font sizes automatically adjust for optimal reading distance on different screen sizes.

## Progressive Web App (PWA) Implementation

### Service Worker Architecture

The application implements comprehensive PWA capabilities through a sophisticated service worker strategy:

```typescript
// public/sw.js
const CACHE_NAME = 'kitchen-pantry-crm-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add other static assets
]

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
            .map(cacheName => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    )
    return
  }

  // Other requests - network first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
      .catch(() => caches.match('/offline.html'))
  )
})

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions())
  }
})

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('Kitchen Pantry CRM', options)
  )
})
```

### Offline Functionality

The application provides comprehensive offline capabilities essential for field sales operations:

**Offline Data Storage:** Critical CRM data is cached locally using IndexedDB for complex queries and localStorage for user preferences. The offline storage includes recent organizations, contacts, and interaction history.

**Offline Actions:** Users can create interactions, update contact information, and schedule follow-ups while offline. These actions are queued and synchronized when connectivity is restored through background sync.

**Conflict Resolution:** The system implements intelligent conflict resolution for data synchronization, prioritizing server data while preserving user changes made offline.

## Performance Optimization

### Code Splitting and Lazy Loading

The application implements comprehensive code splitting strategies:

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard/Dashboard.vue')
  },
  {
    path: '/organizations',
    name: 'Organizations',
    component: () => import('@/pages/Organizations/OrganizationsList.vue')
  },
  {
    path: '/organizations/:id',
    name: 'OrganizationDetail',
    component: () => import('@/pages/Organizations/OrganizationDetail.vue')
  },
  // Additional routes with lazy loading
]

export default createRouter({
  history: createWebHistory(),
  routes
})
```

**Route-based Splitting:** Each major section of the application is loaded on-demand, reducing initial bundle size and improving perceived performance.

**Component-level Splitting:** Heavy components like charts, forms, and data tables are loaded asynchronously when needed.

**Dynamic Imports:** Third-party libraries and utilities are loaded dynamically to minimize the initial application bundle.

### Bundle Optimization

The build process implements comprehensive optimization strategies:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
          utils: ['date-fns', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia']
  }
})
```

## Testing Architecture

### Component Testing Strategy

The application implements comprehensive testing coverage using Vitest and Vue Testing Library:

```typescript
// components/atoms/Button/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import Button from './Button.vue'

describe('Button Component', () => {
  it('renders with correct text', () => {
    const { getByText } = render(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(getByText('Click me')).toBeInTheDocument()
  })

  it('emits click event when clicked', async () => {
    const { getByRole, emitted } = render(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    const button = getByRole('button')
    await fireEvent.click(button)
    
    expect(emitted().click).toHaveLength(1)
  })

  it('applies correct classes for variant and size', () => {
    const { getByRole } = render(Button, {
      props: {
        variant: 'primary',
        size: 'lg'
      },
      slots: {
        default: 'Click me'
      }
    })
    
    const button = getByRole('button')
    expect(button).toHaveClass('bg-primary', 'min-h-[52px]')
  })

  it('is disabled when loading', () => {
    const { getByRole } = render(Button, {
      props: {
        loading: true
      },
      slots: {
        default: 'Click me'
      }
    })
    
    const button = getByRole('button')
    expect(button).toBeDisabled()
  })

  it('meets accessibility requirements', () => {
    const { getByRole } = render(Button, {
      props: {
        ariaLabel: 'Custom button label'
      },
      slots: {
        default: 'Click me'
      }
    })
    
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Custom button label')
  })
})
```

### Integration Testing

Integration tests verify component interactions and data flow:

```typescript
// tests/integration/OrganizationForm.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import OrganizationForm from '@/components/organisms/OrganizationForm/OrganizationForm.vue'
import { useOrganizationsStore } from '@/stores/organizations'

describe('OrganizationForm Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates organization successfully', async () => {
    const store = useOrganizationsStore()
    const createSpy = vi.spyOn(store, 'createOrganization').mockResolvedValue({
      id: '123',
      name: 'Test Organization'
    })

    const { getByLabelText, getByText } = render(OrganizationForm)
    
    await fireEvent.update(getByLabelText('Organization Name'), 'Test Organization')
    await fireEvent.click(getByText('Save'))
    
    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Test Organization'
      })
    })
  })
})
```

## Conclusion

The Kitchen Pantry CRM frontend component architecture provides a comprehensive, scalable foundation for food service industry relationship management. The atomic design methodology ensures component reusability and maintainability while supporting progressive enhancement from existing HTML templates.

The Vue.js 3 implementation with Composition API and TypeScript provides type safety, excellent developer experience, and optimal performance. The responsive design system with touch-first principles ensures optimal usability across all device types, particularly iPad interfaces used by field sales representatives.

Progressive Web App capabilities including offline functionality, push notifications, and native-like experiences provide essential features for mobile CRM operations. The comprehensive testing strategy ensures reliability and maintainability throughout the development lifecycle.

This component architecture serves as the foundation for all frontend development activities, providing clear specifications for component development, state management, and user interface implementation essential for Kitchen Pantry CRM success.

