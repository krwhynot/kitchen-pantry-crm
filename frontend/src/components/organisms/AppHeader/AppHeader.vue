<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Left section: Logo and Navigation -->
        <div class="flex items-center space-x-4">
          <!-- Mobile menu button -->
          <Button
            v-if="showMobileMenu"
            variant="ghost"
            size="sm"
            icon="bars-3"
            @click="toggleMobileMenu"
            class="md:hidden"
            aria-label="Toggle navigation menu"
          />
          
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center">
            <img
              v-if="logoSrc"
              :src="logoSrc"
              :alt="logoAlt"
              class="h-8 w-auto"
            />
            <span v-else class="text-xl font-bold text-gray-900">
              {{ appName }}
            </span>
          </div>
          
          <!-- Desktop navigation -->
          <nav v-if="showNavigation" class="hidden md:flex space-x-1">
            <NavigationItem
              v-for="item in navigationItems"
              :key="item.key"
              :to="item.to"
              :href="item.href"
              :icon="item.icon"
              :label="item.label"
              :active="item.active"
              :badge="item.badge"
              size="sm"
              variant="default"
              @click="handleNavigationClick(item)"
            />
          </nav>
        </div>
        
        <!-- Center section: Search (optional) -->
        <div v-if="showSearch" class="flex-1 max-w-md mx-4">
          <SearchBar
            :placeholder="searchPlaceholder"
            :size="searchSize"
            :results="searchResults"
            :loading="searchLoading"
            @search="handleSearch"
            @select="handleSearchSelect"
          />
        </div>
        
        <!-- Right section: Actions and User Menu -->
        <div class="flex items-center space-x-2">
          <!-- Header actions -->
          <div v-if="headerActions.length > 0" class="hidden sm:flex items-center space-x-2">
            <Button
              v-for="action in headerActions"
              :key="action.key"
              :variant="action.variant || 'ghost'"
              size="sm"
              :icon="action.icon"
              @click="handleHeaderAction(action.key)"
            >
              {{ action.label }}
            </Button>
          </div>
          
          <!-- Notifications -->
          <div v-if="showNotifications" class="relative">
            <Button
              variant="ghost"
              size="sm"
              icon="bell"
              @click="toggleNotifications"
              :aria-label="`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`"
            />
            <Badge
              v-if="notificationCount > 0"
              variant="danger"
              size="sm"
              class="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
            >
              {{ notificationCount > 99 ? '99+' : notificationCount }}
            </Badge>
          </div>
          
          <!-- User menu -->
          <div class="relative">
            <Button
              variant="ghost"
              size="sm"
              @click="toggleUserMenu"
              class="flex items-center space-x-2"
              :aria-label="'User menu'"
            >
              <Avatar
                :src="currentUser?.avatar"
                :initials="getUserInitials(currentUser?.name)"
                size="sm"
              />
              <span class="hidden sm:block text-sm font-medium text-gray-700">
                {{ currentUser?.name }}
              </span>
              <Icon name="chevron-down" size="16" class="text-gray-400" />
            </Button>
            
            <!-- User dropdown menu -->
            <div
              v-if="showUserDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
            >
              <div class="py-1">
                <div class="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <div class="font-medium">{{ currentUser?.name }}</div>
                  <div class="text-gray-500">{{ currentUser?.email }}</div>
                </div>
                
                <button
                  v-for="menuItem in userMenuItems"
                  :key="menuItem.key"
                  @click="handleUserMenuClick(menuItem.key)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Icon v-if="menuItem.icon" :name="menuItem.icon" size="16" />
                  <span>{{ menuItem.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile navigation -->
    <div v-if="showMobileNavigation" class="md:hidden border-t border-gray-200">
      <nav class="px-4 py-2 space-y-1">
        <NavigationItem
          v-for="item in navigationItems"
          :key="item.key"
          :to="item.to"
          :href="item.href"
          :icon="item.icon"
          :label="item.label"
          :active="item.active"
          :badge="item.badge"
          size="sm"
          variant="default"
          @click="handleNavigationClick(item)"
        />
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Avatar, Badge, Button, Icon } from '@/components/atoms'
import { NavigationItem, SearchBar } from '@/components/molecules'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface NavigationItem {
  key: string
  label: string
  to?: string
  href?: string
  icon?: string
  active?: boolean
  badge?: string | number
}

interface HeaderAction {
  key: string
  label: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

interface UserMenuItem {
  key: string
  label: string
  icon?: string
}

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  data: any
}

interface Props {
  appName?: string
  logoSrc?: string
  logoAlt?: string
  currentUser?: User
  navigationItems?: NavigationItem[]
  headerActions?: HeaderAction[]
  userMenuItems?: UserMenuItem[]
  showMobileMenu?: boolean
  showNavigation?: boolean
  showSearch?: boolean
  showNotifications?: boolean
  searchPlaceholder?: string
  searchSize?: 'sm' | 'md' | 'lg'
  searchResults?: SearchResult[]
  searchLoading?: boolean
  notificationCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Kitchen Pantry CRM',
  logoAlt: 'Kitchen Pantry CRM',
  navigationItems: () => [],
  headerActions: () => [],
  userMenuItems: () => [],
  showMobileMenu: true,
  showNavigation: true,
  showSearch: false,
  showNotifications: true,
  searchPlaceholder: 'Search...',
  searchSize: 'md',
  searchResults: () => [],
  searchLoading: false,
  notificationCount: 0
})

const emit = defineEmits<{
  'navigation-click': [item: NavigationItem]
  'header-action': [action: string]
  'user-menu-click': [action: string]
  'search': [query: string]
  'search-select': [result: SearchResult]
  'notifications-toggle': []
  'mobile-menu-toggle': []
}>()

const showMobileNavigation = ref(false)
const showUserDropdown = ref(false)
const showNotificationsPanel = ref(false)

const getUserInitials = (name?: string): string => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const toggleMobileMenu = () => {
  showMobileNavigation.value = !showMobileNavigation.value
  emit('mobile-menu-toggle')
}

const toggleUserMenu = () => {
  showUserDropdown.value = !showUserDropdown.value
  showNotificationsPanel.value = false
}

const toggleNotifications = () => {
  showNotificationsPanel.value = !showNotificationsPanel.value
  showUserDropdown.value = false
  emit('notifications-toggle')
}

const handleNavigationClick = (item: NavigationItem) => {
  showMobileNavigation.value = false
  emit('navigation-click', item)
}

const handleHeaderAction = (action: string) => {
  emit('header-action', action)
}

const handleUserMenuClick = (action: string) => {
  showUserDropdown.value = false
  emit('user-menu-click', action)
}

const handleSearch = (query: string) => {
  emit('search', query)
}

const handleSearchSelect = (result: SearchResult) => {
  emit('search-select', result)
}

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showUserDropdown.value = false
    showNotificationsPanel.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>