<template>
  <div :class="cardClasses" @click="handleClick">
    <div class="flex items-center space-x-3">
      <!-- Avatar -->
      <Avatar
        :src="contact.avatar"
        :initials="generateInitials(contact.name)"
        :size="avatarSize"
        :status="contact.status"
      />
      
      <!-- Contact Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h3 :class="nameClasses">
            {{ contact.name }}
          </h3>
          
          <!-- Status Badge -->
          <Badge
            v-if="contact.priority"
            :variant="getPriorityVariant(contact.priority)"
            size="sm"
          >
            {{ contact.priority }}
          </Badge>
        </div>
        
        <p :class="titleClasses">
          {{ contact.title }}
        </p>
        
        <p :class="organizationClasses">
          {{ contact.organization }}
        </p>
        
        <!-- Contact Methods -->
        <div class="flex items-center space-x-4 mt-2">
          <button
            v-if="contact.email"
            @click.stop="handleEmailClick"
            class="flex items-center text-gray-400 hover:text-blue-600 transition-colors"
            :aria-label="`Email ${contact.name}`"
          >
            <Icon name="envelope" size="16" />
          </button>
          
          <button
            v-if="contact.phone"
            @click.stop="handlePhoneClick"
            class="flex items-center text-gray-400 hover:text-green-600 transition-colors"
            :aria-label="`Call ${contact.name}`"
          >
            <Icon name="phone" size="16" />
          </button>
          
          <!-- Last Interaction -->
          <div v-if="contact.lastInteraction" class="flex items-center text-gray-400 text-sm">
            <Icon name="clock" size="14" class="mr-1" />
            {{ formatLastInteraction(contact.lastInteraction) }}
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div v-if="!hideActions" class="flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          icon="ellipsis-horizontal"
          @click.stop="handleActionsClick"
          :aria-label="`More actions for ${contact.name}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, Badge, Button, Icon } from '@/components/atoms'

interface Contact {
  id: string
  name: string
  title?: string
  organization?: string
  email?: string
  phone?: string
  avatar?: string
  priority?: 'A' | 'B' | 'C'
  status?: 'online' | 'offline' | 'away' | 'busy'
  lastInteraction?: Date
}

interface Props {
  contact: Contact
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  hideActions?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  clickable: true,
  hideActions: false,
  selected: false
})

const emit = defineEmits<{
  click: [contact: Contact]
  email: [contact: Contact]
  phone: [contact: Contact]
  actions: [contact: Contact]
}>()

const cardClasses = computed(() => {
  const baseClasses = [
    'bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200'
  ]

  // Size classes
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  }

  // Interactive classes
  const interactiveClasses = props.clickable
    ? 'hover:shadow-md hover:border-gray-300 cursor-pointer'
    : ''

  // Selected state
  const selectedClasses = props.selected
    ? 'ring-2 ring-blue-500 border-blue-500'
    : ''

  return [
    ...baseClasses,
    sizeClasses[props.size],
    interactiveClasses,
    selectedClasses
  ].join(' ')
})

const avatarSize = computed(() => {
  const sizes = { sm: 'sm', md: 'md', lg: 'lg' }
  return sizes[props.size]
})

const nameClasses = computed(() => {
  const baseClasses = ['font-medium text-gray-900 truncate']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const titleClasses = computed(() => {
  const baseClasses = ['text-gray-600 truncate']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const organizationClasses = computed(() => {
  const baseClasses = ['text-gray-500 truncate']
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getPriorityVariant = (priority: string) => {
  const variants = {
    A: 'danger',
    B: 'warning',
    C: 'secondary'
  }
  return variants[priority] || 'default'
}

const formatLastInteraction = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.contact)
  }
}

const handleEmailClick = () => {
  emit('email', props.contact)
}

const handlePhoneClick = () => {
  emit('phone', props.contact)
}

const handleActionsClick = () => {
  emit('actions', props.contact)
}
</script>