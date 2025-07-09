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
            index === selectedIndex ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
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
import { Input, Button, Icon, LoadingSpinner } from '@/components/atoms'

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
  results?: SearchResult[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search organizations, contacts, opportunities...',
  size: 'md',
  searchTypes: () => ['organizations', 'contacts', 'opportunities'],
  minSearchLength: 2,
  results: () => [],
  loading: false
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

// Recent searches (simplified - in real app would use composable)
const recentSearches = ref<string[]>([])

// Debounced search
let searchTimeout: NodeJS.Timeout

const showClearButton = computed(() => searchQuery.value.length > 0)

const handleInput = () => {
  selectedIndex.value = -1
  
  // Clear previous timeout
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (searchQuery.value.length >= props.minSearchLength) {
    isLoading.value = true
    
    // Debounce search
    searchTimeout = setTimeout(() => {
      performSearch(searchQuery.value)
    }, 300)
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

const performSearch = (query: string) => {
  emit('search', query, props.searchTypes)
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
  recentSearches.value = updated
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
  if (searchTimeout) clearTimeout(searchTimeout)
})

// Watch for external search results
watch(() => props.results, (newResults) => {
  searchResults.value = newResults
  isLoading.value = false
}, { deep: true })

// Watch for loading state
watch(() => props.loading, (loading) => {
  isLoading.value = loading
})
</script>