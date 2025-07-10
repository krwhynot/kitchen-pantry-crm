<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <Sidebar
      :app-name="appName"
      :logo-src="logoSrc"
      :logo-alt="logoAlt"
      :current-user="currentUser"
      :navigation-sections="navigationSections"
      :footer-actions="footerActions"
      :collapsed="sidebarCollapsed"
      :collapsible="true"
      :show-header="true"
      :show-footer="true"
      :width="sidebarWidth"
      @item-click="handleNavigationClick"
      @footer-action="handleFooterAction"
      @user-menu-click="handleUserMenuClick"
      @toggle-collapse="handleSidebarToggle"
    />
    
    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <AppHeader
        :app-name="appName"
        :logo-src="logoSrc"
        :logo-alt="logoAlt"
        :current-user="currentUser"
        :navigation-items="headerNavigationItems"
        :header-actions="headerActions"
        :user-menu-items="userMenuItems"
        :show-mobile-menu="showMobileMenu"
        :show-navigation="showHeaderNavigation"
        :show-search="showSearch"
        :show-notifications="showNotifications"
        :search-placeholder="searchPlaceholder"
        :search-size="searchSize"
        :search-results="searchResults"
        :search-loading="searchLoading"
        :notification-count="notificationCount"
        @navigation-click="handleNavigationClick"
        @header-action="handleHeaderAction"
        @user-menu-click="handleUserMenuClick"
        @search="handleSearch"
        @search-select="handleSearchSelect"
        @notifications-toggle="handleNotificationsToggle"
        @mobile-menu-toggle="handleMobileMenuToggle"
      />
      
      <!-- Breadcrumb Navigation (if enabled) -->
      <Breadcrumb
        v-if="showBreadcrumb && breadcrumbItems.length > 0"
        :items="breadcrumbItems"
        class="border-b border-gray-200 bg-white px-6 py-3"
        @item-click="handleBreadcrumbClick"
      />
      
      <!-- Page content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Page loading overlay -->
        <PageLoader v-if="loading" />
        
        <!-- Router view content -->
        <div class="flex-1 flex flex-col p-6">
          <slot />
        </div>
      </main>
      
      <!-- Footer -->
      <Footer
        v-if="showFooter"
        :app-name="appName"
        :version="version"
        :copyright="copyright"
        :footer-links="footerLinks"
        :show-version="showVersion"
        :show-copyright="showCopyright"
        class="border-t border-gray-200"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppHeader, Sidebar } from '@/components/organisms'
import Breadcrumb from '@/components/atoms/Breadcrumb/Breadcrumb.vue'
import Footer from '@/components/atoms/Footer/Footer.vue'
import PageLoader from '@/components/atoms/PageLoader/PageLoader.vue'

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
  disabled?: boolean
  expanded?: boolean
  children?: NavigationItem[]
}

interface NavigationSection {
  key: string
  title?: string
  items: NavigationItem[]
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

interface FooterAction {
  key: string
  label: string
  icon?: string
}

interface BreadcrumbItem {
  key: string
  label: string
  to?: string
  href?: string
  active?: boolean
}

interface FooterLink {
  key: string
  label: string
  href: string
  external?: boolean
}

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  data: any
}

interface Props {
  // App configuration
  appName?: string
  logoSrc?: string
  logoAlt?: string
  version?: string
  copyright?: string
  
  // User and authentication
  currentUser?: User
  
  // Navigation configuration
  navigationSections?: NavigationSection[]
  headerNavigationItems?: NavigationItem[]
  footerActions?: FooterAction[]
  headerActions?: HeaderAction[]
  userMenuItems?: UserMenuItem[]
  breadcrumbItems?: BreadcrumbItem[]
  footerLinks?: FooterLink[]
  
  // Layout configuration
  sidebarCollapsed?: boolean
  sidebarWidth?: 'sm' | 'md' | 'lg'
  showMobileMenu?: boolean
  showHeaderNavigation?: boolean
  showBreadcrumb?: boolean
  showFooter?: boolean
  showVersion?: boolean
  showCopyright?: boolean
  
  // Search configuration
  showSearch?: boolean
  searchPlaceholder?: string
  searchSize?: 'sm' | 'md' | 'lg'
  searchResults?: SearchResult[]
  searchLoading?: boolean
  
  // Notifications
  showNotifications?: boolean
  notificationCount?: number
  
  // Loading state
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Kitchen Pantry CRM',
  logoAlt: 'Kitchen Pantry CRM',
  version: '1.0.0',
  copyright: '© 2024 Kitchen Pantry CRM. All rights reserved.',
  navigationSections: () => [],
  headerNavigationItems: () => [],
  footerActions: () => [],
  headerActions: () => [],
  userMenuItems: () => [],
  breadcrumbItems: () => [],
  footerLinks: () => [],
  sidebarCollapsed: false,
  sidebarWidth: 'md',
  showMobileMenu: true,
  showHeaderNavigation: false,
  showBreadcrumb: true,
  showFooter: true,
  showVersion: true,
  showCopyright: true,
  showSearch: false,
  searchPlaceholder: 'Search...',
  searchSize: 'md',
  searchResults: () => [],
  searchLoading: false,
  showNotifications: true,
  notificationCount: 0,
  loading: false
})

const emit = defineEmits<{
  'navigation-click': [item: NavigationItem]
  'header-action': [action: string]
  'footer-action': [action: string]
  'user-menu-click': [action: string]
  'breadcrumb-click': [item: BreadcrumbItem]
  'search': [query: string]
  'search-select': [result: SearchResult]
  'notifications-toggle': []
  'mobile-menu-toggle': []
  'sidebar-toggle': [collapsed: boolean]
}>()

const handleNavigationClick = (item: NavigationItem) => {
  emit('navigation-click', item)
}

const handleHeaderAction = (action: string) => {
  emit('header-action', action)
}

const handleFooterAction = (action: string) => {
  emit('footer-action', action)
}

const handleUserMenuClick = (action: string) => {
  emit('user-menu-click', action)
}

const handleBreadcrumbClick = (item: BreadcrumbItem) => {
  emit('breadcrumb-click', item)
}

const handleSearch = (query: string) => {
  emit('search', query)
}

const handleSearchSelect = (result: SearchResult) => {
  emit('search-select', result)
}

const handleNotificationsToggle = () => {
  emit('notifications-toggle')
}

const handleMobileMenuToggle = () => {
  emit('mobile-menu-toggle')
}

const handleSidebarToggle = (collapsed: boolean) => {
  emit('sidebar-toggle', collapsed)
}
</script>