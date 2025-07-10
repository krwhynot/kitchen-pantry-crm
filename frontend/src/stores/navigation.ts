import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

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

export const useNavigationStore = defineStore('navigation', () => {
  const route = useRoute()
  
  // Navigation sections configuration
  const navigationSections = ref<NavigationSection[]>([
    {
      key: 'main',
      title: 'Main',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/dashboard',
          icon: 'home',
          active: false
        }
      ]
    },
    {
      key: 'crm',
      title: 'CRM',
      items: [
        {
          key: 'organizations',
          label: 'Organizations',
          to: '/organizations',
          icon: 'building-office',
          active: false
        },
        {
          key: 'contacts',
          label: 'Contacts',
          to: '/contacts',
          icon: 'users',
          active: false
        },
        {
          key: 'interactions',
          label: 'Interactions',
          to: '/interactions',
          icon: 'chat-bubble-left-right',
          active: false
        },
        {
          key: 'opportunities',
          label: 'Opportunities',
          to: '/opportunities',
          icon: 'currency-dollar',
          active: false
        }
      ]
    },
    {
      key: 'settings',
      title: 'Settings',
      items: [
        {
          key: 'profile',
          label: 'Profile',
          to: '/profile',
          icon: 'user',
          active: false
        },
        {
          key: 'settings',
          label: 'Settings',
          to: '/settings',
          icon: 'cog-6-tooth',
          active: false
        }
      ]
    }
  ])

  // Computed navigation with active state
  const computedNavigationSections = computed(() => {
    return navigationSections.value.map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        active: isItemActive(item)
      }))
    }))
  })

  // Helper function to determine if nav item is active
  const isItemActive = (item: NavigationItem): boolean => {
    if (!item.to) return false
    
    const currentPath = route.path
    
    // Exact match for dashboard
    if (item.to === '/dashboard') {
      return currentPath === '/dashboard'
    }
    
    // Prefix match for other routes
    return currentPath.startsWith(item.to)
  }

  // Footer actions
  const footerActions = ref([
    {
      key: 'help',
      label: 'Help & Support',
      icon: 'question-mark-circle'
    },
    {
      key: 'feedback',
      label: 'Send Feedback',
      icon: 'chat-bubble-bottom-center-text'
    }
  ])

  // User menu items
  const userMenuItems = ref([
    {
      key: 'profile',
      label: 'Your Profile',
      icon: 'user'
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'cog-6-tooth'
    },
    {
      key: 'divider',
      label: '',
      icon: ''
    },
    {
      key: 'logout',
      label: 'Sign out',
      icon: 'arrow-right-on-rectangle'
    }
  ])

  return {
    navigationSections: computedNavigationSections,
    footerActions,
    userMenuItems
  }
})