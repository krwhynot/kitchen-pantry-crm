<template>
  <div :class="entryClasses">
    <div class="flex space-x-3">
      <!-- Timeline indicator -->
      <div class="flex-shrink-0">
        <div :class="indicatorClasses">
          <Icon :name="getTypeIcon(interaction.type)" size="16" class="text-white" />
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <p :class="titleClasses">
              {{ interaction.title }}
            </p>
            
            <Badge
              :variant="getTypeVariant(interaction.type)"
              size="sm"
            >
              {{ interaction.type }}
            </Badge>
          </div>
          
          <div class="flex items-center space-x-2">
            <time :class="dateClasses" :datetime="interaction.date.toISOString()">
              {{ formatDate(interaction.date) }}
            </time>
            
            <Button
              v-if="!hideActions"
              variant="ghost"
              size="sm"
              icon="ellipsis-horizontal"
              @click="handleActionsClick"
              :aria-label="`More actions for ${interaction.title}`"
            />
          </div>
        </div>
        
        <!-- Participants -->
        <div v-if="interaction.participants.length > 0" class="flex items-center space-x-2 mt-1">
          <Icon name="user-group" size="14" class="text-gray-400" />
          <p :class="participantsClasses">
            {{ formatParticipants(interaction.participants) }}
          </p>
        </div>
        
        <!-- Description -->
        <div v-if="interaction.description" class="mt-2">
          <p :class="descriptionClasses">
            {{ interaction.description }}
          </p>
        </div>
        
        <!-- Outcome -->
        <div v-if="interaction.outcome" class="mt-2">
          <div class="flex items-center space-x-2">
            <Icon name="check-circle" size="16" class="text-green-500" />
            <p :class="outcomeClasses">
              {{ interaction.outcome }}
            </p>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div v-if="interaction.nextSteps && interaction.nextSteps.length > 0" class="mt-2">
          <div class="flex items-center space-x-2 mb-1">
            <Icon name="arrow-right" size="14" class="text-gray-400" />
            <p :class="nextStepsLabelClasses">Next Steps:</p>
          </div>
          
          <ul :class="nextStepsListClasses">
            <li
              v-for="step in interaction.nextSteps"
              :key="step.id"
              class="flex items-center space-x-2"
            >
              <Icon name="arrow-right" size="12" class="text-gray-400" />
              <span>{{ step.description }}</span>
              <time v-if="step.dueDate" class="text-gray-500 text-sm">
                (Due: {{ formatDate(step.dueDate) }})
              </time>
            </li>
          </ul>
        </div>
        
        <!-- Attachments -->
        <div v-if="interaction.attachments && interaction.attachments.length > 0" class="mt-2">
          <div class="flex items-center space-x-2">
            <Icon name="document" size="14" class="text-gray-400" />
            <p :class="attachmentsClasses">
              {{ interaction.attachments.length }} attachment{{ interaction.attachments.length > 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge, Button, Icon } from '@/components/atoms'

interface NextStep {
  id: string
  description: string
  dueDate?: Date
}

interface Attachment {
  id: string
  name: string
  type: string
  url: string
}

interface Interaction {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description?: string
  participants: string[]
  date: Date
  outcome?: string
  nextSteps?: NextStep[]
  attachments?: Attachment[]
}

interface Props {
  interaction: Interaction
  size?: 'sm' | 'md' | 'lg'
  hideActions?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  hideActions: false,
  compact: false
})

const emit = defineEmits<{
  actions: [interaction: Interaction]
}>()

const entryClasses = computed(() => {
  const baseClasses = ['relative']
  
  // Size classes
  const sizeClasses = {
    sm: 'pb-3',
    md: 'pb-4',
    lg: 'pb-5'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const indicatorClasses = computed(() => {
  const baseClasses = [
    'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white'
  ]
  
  // Type-specific colors
  const typeColors = {
    call: 'bg-green-500',
    email: 'bg-blue-500',
    meeting: 'bg-purple-500',
    note: 'bg-gray-500',
    task: 'bg-yellow-500'
  }

  return [
    ...baseClasses,
    typeColors[props.interaction.type]
  ].join(' ')
})

const titleClasses = computed(() => {
  const baseClasses = ['font-medium text-gray-900']
  
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

const dateClasses = computed(() => {
  const baseClasses = ['text-gray-500']
  
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

const participantsClasses = computed(() => {
  const baseClasses = ['text-gray-600']
  
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

const descriptionClasses = computed(() => {
  const baseClasses = ['text-gray-700']
  
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

const outcomeClasses = computed(() => {
  const baseClasses = ['text-green-700 font-medium']
  
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

const nextStepsLabelClasses = computed(() => {
  const baseClasses = ['text-gray-700 font-medium']
  
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

const nextStepsListClasses = computed(() => {
  const baseClasses = ['space-y-1 text-gray-600']
  
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

const attachmentsClasses = computed(() => {
  const baseClasses = ['text-gray-600']
  
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

const getTypeIcon = (type: string): string => {
  const icons = {
    call: 'phone',
    email: 'envelope',
    meeting: 'calendar',
    note: 'document',
    task: 'check-circle'
  }
  return icons[type] || 'document'
}

const getTypeVariant = (type: string) => {
  const variants = {
    call: 'success',
    email: 'primary',
    meeting: 'info',
    note: 'secondary',
    task: 'warning'
  }
  return variants[type] || 'default'
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

const formatParticipants = (participants: string[]): string => {
  if (participants.length === 1) {
    return participants[0]
  } else if (participants.length === 2) {
    return `${participants[0]} and ${participants[1]}`
  } else {
    return `${participants[0]} and ${participants.length - 1} others`
  }
}

const handleActionsClick = () => {
  emit('actions', props.interaction)
}
</script>