<template>
  <div
    class="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
    @click="handleClick"
  >
    <!-- Activity Icon -->
    <div :class="iconContainerClasses">
      <Icon :name="activity.icon || getDefaultIcon(activity.type)" :class="iconClasses" />
    </div>

    <!-- Activity Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <!-- Activity Description -->
          <p class="text-sm text-gray-900 group-hover:text-gray-700">
            <span class="font-medium">{{ activity.user?.name || 'Someone' }}</span>
            {{ getActivityDescription() }}
          </p>
          
          <!-- Activity Details -->
          <div class="mt-1 flex items-center space-x-2 text-xs text-gray-500">
            <span>{{ activity.contactName }}</span>
            <span>•</span>
            <span>{{ activity.organizationName }}</span>
            <span>•</span>
            <span>{{ formatTimeAgo(activity.timestamp) }}</span>
          </div>

          <!-- Activity Metadata -->
          <div v-if="activity.outcome || activity.followUpRequired" class="mt-2 flex items-center space-x-2">
            <Badge
              v-if="activity.outcome"
              :variant="getOutcomeVariant(activity.outcome)"
              size="sm"
            >
              {{ formatOutcome(activity.outcome) }}
            </Badge>
            <Badge
              v-if="activity.followUpRequired"
              variant="warning"
              size="sm"
            >
              Follow-up Required
            </Badge>
          </div>
        </div>

        <!-- Activity Timestamp -->
        <div class="flex-shrink-0 text-xs text-gray-400">
          {{ formatTime(activity.timestamp) }}
        </div>
      </div>

      <!-- Activity Notes Preview -->
      <div v-if="activity.notes && showPreview" class="mt-2 text-sm text-gray-600 line-clamp-2">
        {{ activity.notes }}
      </div>
    </div>

    <!-- Action Arrow -->
    <div class="flex-shrink-0">
      <Icon
        name="chevron-right"
        class="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon, Badge } from '@/components/atoms'

interface User {
  id: string
  name: string
  avatar?: string
}

interface Activity {
  id: string
  type: string
  description: string
  contactName: string
  organizationName: string
  timestamp: string
  user?: User
  icon?: string
  outcome?: string
  followUpRequired?: boolean
  notes?: string
}

interface Props {
  activity: Activity
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: false
})

const emit = defineEmits<{
  click: [activity: Activity]
}>()

// Computed properties
const iconContainerClasses = computed(() => {
  const baseClasses = 'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center'
  const typeColors: Record<string, string> = {
    email: 'bg-blue-100',
    phone: 'bg-green-100',
    meeting: 'bg-purple-100',
    note: 'bg-gray-100',
    task: 'bg-orange-100'
  }
  
  const colorClass = typeColors[props.activity.type] || 'bg-gray-100'
  return `${baseClasses} ${colorClass}`
})

const iconClasses = computed(() => {
  const typeColors: Record<string, string> = {
    email: 'text-blue-600',
    phone: 'text-green-600',
    meeting: 'text-purple-600',
    note: 'text-gray-600',
    task: 'text-orange-600'
  }
  
  const colorClass = typeColors[props.activity.type] || 'text-gray-600'
  return `h-4 w-4 ${colorClass}`
})

// Helper functions
const getDefaultIcon = (type: string) => {
  const icons: Record<string, string> = {
    email: 'envelope',
    phone: 'phone',
    meeting: 'calendar',
    note: 'document-text',
    task: 'check-circle'
  }
  return icons[type] || 'chat-bubble-left-right'
}

const getActivityDescription = () => {
  const actions: Record<string, string> = {
    email: 'sent an email to',
    phone: 'had a phone call with',
    meeting: 'met with',
    note: 'added a note about',
    task: 'completed a task for'
  }
  
  const action = actions[props.activity.type] || 'interacted with'
  return action
}

const getOutcomeVariant = (outcome: string) => {
  const variants: Record<string, string> = {
    positive: 'success',
    neutral: 'secondary',
    negative: 'danger',
    follow_up_required: 'warning'
  }
  return variants[outcome] || 'secondary'
}

const formatOutcome = (outcome: string) => {
  const labels: Record<string, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    follow_up_required: 'Follow-up Required'
  }
  return labels[outcome] || outcome
}

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Event handlers
const handleClick = () => {
  emit('click', props.activity)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>