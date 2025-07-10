<template>
  <nav :aria-label="ariaLabel" :class="containerClasses">
    <ol class="flex items-center space-x-1">
      <!-- Home link (optional) -->
      <li v-if="showHome">
        <div>
          <a
            :href="homeLink.href || '/'"
            class="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            @click="handleHomeClick"
          >
            <Icon :name="homeIcon" :size="iconSize" :aria-label="homeLink.label || 'Home'" />
          </a>
        </div>
      </li>
      
      <!-- Separator after home -->
      <li v-if="showHome && items.length > 0">
        <Icon :name="separatorIcon" :size="separatorSize" class="text-gray-300" />
      </li>
      
      <!-- Breadcrumb items -->
      <li v-for="(item, index) in items" :key="item.key" class="flex items-center">
        <!-- Separator (not for first item if no home) -->
        <Icon 
          v-if="index > 0 || showHome"
          :name="separatorIcon"
          :size="separatorSize"
          class="text-gray-300 mr-1"
        />
        
        <div class="flex items-center space-x-2 ml-1">
          <!-- Item content -->
          <component
            :is="getItemComponent(item, index)"
            v-bind="getItemProps(item, index)"
            :class="getItemClasses(item, index)"
            @click="handleItemClick(item, index)"
          >
            <!-- Icon (optional) -->
            <Icon 
              v-if="item.icon" 
              :name="item.icon" 
              :size="iconSize" 
              class="mr-1"
            />
            
            <!-- Label -->
            <span>{{ item.label }}</span>
            
            <!-- Badge (optional) -->
            <Badge
              v-if="item.badge"
              :variant="getBadgeVariant(item)"
              size="sm"
              class="ml-2"
            >
              {{ item.badge }}
            </Badge>
          </component>
          
          <!-- Dropdown for overflow items (optional) -->
          <div v-if="item.children && item.children.length > 0" class="relative">
            <Button
              variant="ghost"
              size="xs"
              icon="chevron-down"
              @click="toggleDropdown(item.key)"
              :aria-label="`Show ${item.label} submenu`"
            />
            
            <!-- Dropdown menu -->
            <div
              v-if="openDropdown === item.key"
              class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
            >
              <div class="py-1">
                <a
                  v-for="child in item.children"
                  :key="child.key"
                  :href="child.href"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  @click="handleChildClick(child, item)"
                >
                  <Icon v-if="child.icon" :name="child.icon" size="16" class="mr-2" />
                  {{ child.label }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon, Badge, Button } from '@/components/atoms'

interface BreadcrumbItem {
  key: string
  label: string
  href?: string
  to?: string
  icon?: string
  active?: boolean
  disabled?: boolean
  badge?: string | number
  children?: BreadcrumbItem[]
}

interface HomeLink {
  label?: string
  href?: string
}

interface Props {
  // Breadcrumb items
  items: BreadcrumbItem[]
  
  // Home configuration
  showHome?: boolean
  homeLink?: HomeLink
  homeIcon?: string
  
  // Styling
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'simple' | 'minimal'
  separatorIcon?: string
  
  // Accessibility
  ariaLabel?: string
  
  // Behavior
  maxItems?: number
  collapsible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  showHome: true,
  homeLink: () => ({ label: 'Home', href: '/' }),
  homeIcon: 'home',
  size: 'md',
  variant: 'default',
  separatorIcon: 'chevron-right',
  ariaLabel: 'Breadcrumb navigation',
  maxItems: 5,
  collapsible: true
})

const emit = defineEmits<{
  'item-click': [item: BreadcrumbItem, index: number]
  'home-click': []
  'child-click': [child: BreadcrumbItem, parent: BreadcrumbItem]
}>()

const openDropdown = ref<string | null>(null)

const containerClasses = computed(() => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  const variantClasses = {
    default: 'py-2',
    simple: 'py-1',
    minimal: ''
  }
  
  return [
    'flex',
    sizeClasses[props.size],
    variantClasses[props.variant]
  ].join(' ')
})

const iconSize = computed(() => {
  const sizes = {
    sm: '16',
    md: '16',
    lg: '20'
  }
  return sizes[props.size]
})

const separatorSize = computed(() => {
  const sizes = {
    sm: '14',
    md: '16',
    lg: '18'
  }
  return sizes[props.size]
})

const getItemComponent = (item: BreadcrumbItem, index: number) => {
  const isLast = index === props.items.length - 1
  const isActive = item.active || isLast
  
  if (isActive || item.disabled || (!item.href && !item.to)) {
    return 'span'
  }
  
  return 'a'
}

const getItemProps = (item: BreadcrumbItem, index: number) => {
  const isLast = index === props.items.length - 1
  const isActive = item.active || isLast
  
  if (isActive || item.disabled || (!item.href && !item.to)) {
    return {}
  }
  
  return {
    href: item.href,
    'aria-current': isActive ? 'page' : undefined
  }
}

const getItemClasses = (item: BreadcrumbItem, index: number) => {
  const isLast = index === props.items.length - 1
  const isActive = item.active || isLast
  
  const baseClasses = ['flex items-center transition-colors duration-200']
  
  if (isActive) {
    baseClasses.push('text-gray-900 font-medium cursor-default')
  } else if (item.disabled) {
    baseClasses.push('text-gray-400 cursor-not-allowed')
  } else {
    baseClasses.push('text-gray-500 hover:text-gray-700 cursor-pointer')
  }
  
  return baseClasses.join(' ')
}

const getBadgeVariant = (item: BreadcrumbItem) => {
  if (item.active) return 'primary'
  return 'secondary'
}

const toggleDropdown = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key
}

const handleItemClick = (item: BreadcrumbItem, index: number) => {
  if (!item.disabled) {
    emit('item-click', item, index)
  }
}

const handleHomeClick = () => {
  emit('home-click')
}

const handleChildClick = (child: BreadcrumbItem, parent: BreadcrumbItem) => {
  openDropdown.value = null
  emit('child-click', child, parent)
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown]')) {
    openDropdown.value = null
  }
}

// Add click outside listener
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>