<template>
  <component :is="layoutComponent" v-bind="layoutProps">
    <RouterView />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'
import { DefaultLayout, AuthLayout, FullscreenLayout } from '@/layouts'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// Get layout from route meta or default to 'default'
const layoutName = computed(() => route.meta?.layout || 'default')

// Map layout names to components
const layoutComponents = {
  default: DefaultLayout,
  auth: AuthLayout,
  fullscreen: FullscreenLayout
}

const layoutComponent = computed(() => {
  return layoutComponents[layoutName.value as keyof typeof layoutComponents] || DefaultLayout
})

// Layout props based on layout type
const layoutProps = computed(() => {
  const baseProps = {
    appName: 'Kitchen Pantry CRM',
    logoAlt: 'Kitchen Pantry CRM Logo',
    version: '1.0.0',
    copyright: '© 2024 Kitchen Pantry CRM. All rights reserved.'
  }

  // Auth layout props
  if (layoutName.value === 'auth') {
    return {
      ...baseProps,
      showFooter: true,
      showVersion: true,
      centerContent: true
    }
  }

  // Fullscreen layout props
  if (layoutName.value === 'fullscreen') {
    return baseProps
  }

  // Default layout props
  return {
    ...baseProps,
    currentUser: authStore.user,
    navigationSections: navigationStore.navigationSections,
    footerActions: navigationStore.footerActions,
    userMenuItems: navigationStore.userMenuItems,
    sidebarCollapsed: false,
    sidebarWidth: 'md',
    showMobileMenu: true,
    showHeaderNavigation: false,
    showBreadcrumb: false,
    showFooter: true,
    showVersion: true,
    showCopyright: true,
    showSearch: false,
    showNotifications: true,
    notificationCount: 0,
    loading: false
  }
})

// Handle navigation events
const handleNavigationClick = (item: any) => {
  if (item.to) {
    router.push(item.to)
  } else if (item.href) {
    window.open(item.href, '_blank')
  }
}

const handleFooterAction = (action: string) => {
  switch (action) {
    case 'help':
      // Handle help action
      console.log('Open help')
      break
    case 'feedback':
      // Handle feedback action
      console.log('Open feedback')
      break
  }
}

const handleUserMenuClick = (action: string) => {
  switch (action) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      authStore.logout()
      router.push('/auth/login')
      break
  }
}

// Provide event handlers to layout if it's default layout
if (layoutName.value === 'default') {
  Object.assign(layoutProps.value, {
    onNavigationClick: handleNavigationClick,
    onFooterAction: handleFooterAction,
    onUserMenuClick: handleUserMenuClick
  })
}
</script>