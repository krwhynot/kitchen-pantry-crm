<template>
  <aside
    :class="sidebarClasses"
    :aria-label="'Main navigation'"
  >
    <!-- Sidebar header -->
    <div v-if="showHeader" class="px-4 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            :alt="logoAlt"
            class="h-8 w-auto"
          />
          <span v-if="!collapsed" class="text-lg font-semibold text-gray-900">
            {{ appName }}
          </span>
        </div>
        
        <Button
          v-if="collapsible"
          variant="ghost"
          size="sm"
          :icon="collapsed ? 'chevron-right' : 'chevron-left'"
          @click="toggleCollapse"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        />
      </div>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      <!-- Main navigation items -->
      <div v-for="section in navigationSections" :key="section.key" class="space-y-1">
        <h3
          v-if="section.title && !collapsed"
          class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
        >
          {{ section.title }}
        </h3>
        
        <NavigationItem
          v-for="item in section.items"
          :key="item.key"
          :to="item.to"
          :href="item.href"
          :icon="item.icon"
          :label="item.label"
          :active="item.active"
          :badge="item.badge"
          :disabled="item.disabled"
          :has-subitems="item.children && item.children.length > 0"
          :variant="collapsed ? 'compact' : 'default'"
          size="md"
          @click="handleItemClick(item)"
        />
        
        <!-- Submenu items -->
        <div
          v-if="item.children && item.expanded && !collapsed"
          v-for="item in section.items"
          :key="`${item.key}-children`"
          class="ml-6 space-y-1"
        >
          <NavigationItem
            v-for="child in item.children"
            :key="child.key"
            :to="child.to"
            :href="child.href"
            :icon="child.icon"
            :label="child.label"
            :active="child.active"
            :disabled="child.disabled"
            variant="default"
            size="sm"
            @click="handleItemClick(child)"
          />
        </div>
      </div>
    </nav>
    
    <!-- Sidebar footer -->
    <div v-if="showFooter" class="px-4 py-4 border-t border-gray-200">
      <div v-if="currentUser" class="flex items-center space-x-3">
        <Avatar
          :src="currentUser.avatar"
          :initials="getUserInitials(currentUser.name)"
          size="sm"
        />
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ currentUser.name }}
          </p>
          <p class="text-xs text-gray-500 truncate">
            {{ currentUser.email }}
          </p>
        </div>
        
        <Button
          v-if="!collapsed"
          variant="ghost"
          size="sm"
          icon="ellipsis-horizontal"
          @click="handleUserMenuClick"
          :aria-label="'User menu'"
        />
      </div>
      
      <!-- Footer actions -->
      <div v-if="footerActions.length > 0" class="mt-4 space-y-1">
        <NavigationItem
          v-for="action in footerActions"
          :key="action.key"
          :icon="action.icon"
          :label="action.label"
          :variant="collapsed ? 'compact' : 'default'"
          size="sm"
          @click="handleFooterAction(action.key)"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, Button } from '@/components/atoms'
import { NavigationItem } from '@/components/molecules'

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

interface FooterAction {
  key: string
  label: string
  icon?: string
}

interface Props {
  appName?: string
  logoSrc?: string
  logoAlt?: string
  currentUser?: User
  navigationSections: NavigationSection[]
  footerActions?: FooterAction[]
  collapsed?: boolean
  collapsible?: boolean
  showHeader?: boolean
  showFooter?: boolean
  width?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Kitchen Pantry CRM',
  logoAlt: 'Kitchen Pantry CRM',
  navigationSections: () => [],
  footerActions: () => [],
  collapsed: false,
  collapsible: true,
  showHeader: true,
  showFooter: true,
  width: 'md'
})

const emit = defineEmits<{
  'item-click': [item: NavigationItem]
  'footer-action': [action: string]
  'user-menu-click': []
  'toggle-collapse': [collapsed: boolean]
}>()

const sidebarClasses = computed(() => {
  const baseClasses = [
    'bg-white border-r border-gray-200 flex flex-col',
    'transition-all duration-300 ease-in-out'
  ]

  // Width classes
  const widthClasses = {
    sm: props.collapsed ? 'w-16' : 'w-48',
    md: props.collapsed ? 'w-16' : 'w-64',
    lg: props.collapsed ? 'w-16' : 'w-80'
  }

  return [
    ...baseClasses,
    widthClasses[props.width]
  ].join(' ')
})

const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const toggleCollapse = () => {
  emit('toggle-collapse', !props.collapsed)
}

const handleItemClick = (item: NavigationItem) => {
  emit('item-click', item)
}

const handleFooterAction = (action: string) => {
  emit('footer-action', action)
}

const handleUserMenuClick = () => {
  emit('user-menu-click')
}
</script>