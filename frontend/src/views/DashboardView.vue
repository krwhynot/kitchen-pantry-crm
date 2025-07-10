<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Dashboard Header -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Good {{ timeOfDay }}, {{ currentUser?.name?.split(' ')[0] || 'there' }}!
          </h1>
          <p class="mt-2 text-gray-600">
            Here's what's happening with your business today, {{ formatDate(new Date()) }}.
          </p>
        </div>
        
        <div class="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button
            variant="secondary"
            @click="refreshDashboard"
            :loading="isRefreshing"
          >
            <Icon name="arrow-path" class="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="primary"
            @click="openQuickActions"
          >
            <Icon name="plus" class="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State for Initial Load -->
    <div v-if="isInitialLoading" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="n in 4" :key="n" class="bg-white rounded-lg shadow animate-pulse">
          <div class="p-6">
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="bg-white rounded-lg shadow animate-pulse">
          <div class="p-6">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div class="space-y-3">
              <div v-for="i in 3" :key="i" class="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Grid -->
    <div v-else class="space-y-8">
      <!-- KPI Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget
          title="Total Organizations"
          :loading="kpiLoading"
          size="small"
        >
          <KPICard
            :value="dashboardData.totalOrganizations"
            :change="dashboardData.organizationsChange"
            :trend="dashboardData.organizationsTrend"
            icon="building-office"
            color="blue"
            @click="navigateToOrganizations"
          />
        </DashboardWidget>

        <DashboardWidget
          title="Total Contacts"
          :loading="kpiLoading"
          size="small"
        >
          <KPICard
            :value="dashboardData.totalContacts"
            :change="dashboardData.contactsChange"
            :trend="dashboardData.contactsTrend"
            icon="users"
            color="green"
            @click="navigateToContacts"
          />
        </DashboardWidget>

        <DashboardWidget
          title="Recent Interactions"
          :loading="kpiLoading"
          size="small"
        >
          <KPICard
            :value="dashboardData.recentInteractions"
            :change="dashboardData.interactionsChange"
            :trend="dashboardData.interactionsTrend"
            icon="chat-bubble-left-right"
            color="purple"
            @click="navigateToInteractions"
          />
        </DashboardWidget>

        <DashboardWidget
          title="Pipeline Value"
          :loading="kpiLoading"
          size="small"
        >
          <KPICard
            :value="formatCurrency(dashboardData.pipelineValue)"
            :change="dashboardData.pipelineChange"
            :trend="dashboardData.pipelineTrend"
            icon="currency-dollar"
            color="emerald"
            @click="navigateToOpportunities"
          />
        </DashboardWidget>
      </div>

      <!-- Main Content Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Activity -->
        <DashboardWidget
          title="Recent Activity"
          :loading="activityLoading"
          size="large"
          class="lg:col-span-2"
        >
          <template #header-actions>
            <Button
              variant="ghost"
              size="sm"
              @click="viewAllActivity"
            >
              View All
            </Button>
          </template>
          
          <div v-if="recentActivity.length === 0" class="py-8">
            <EmptyState
              icon="chat-bubble-left-right"
              title="No recent activity"
              description="Your team's interactions will appear here."
            >
              <Button @click="createInteraction">
                Log First Interaction
              </Button>
            </EmptyState>
          </div>
          
          <div v-else class="space-y-4">
            <ActivityItem
              v-for="activity in recentActivity"
              :key="activity.id"
              :activity="activity"
              @click="viewActivity(activity)"
            />
            <div v-if="recentActivity.length >= 5" class="pt-4 border-t border-gray-200 text-center">
              <Button variant="ghost" @click="viewAllActivity">
                View All Activity
              </Button>
            </div>
          </div>
        </DashboardWidget>

        <!-- Upcoming Tasks -->
        <DashboardWidget
          title="Upcoming Tasks"
          :loading="tasksLoading"
          size="medium"
        >
          <template #header-actions>
            <Badge :variant="overdueTasks > 0 ? 'danger' : 'secondary'">
              {{ upcomingTasks.length }}
            </Badge>
          </template>
          
          <div v-if="upcomingTasks.length === 0" class="py-6">
            <EmptyState
              icon="calendar"
              title="No upcoming tasks"
              description="You're all caught up!"
              size="sm"
            />
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="task in upcomingTasks.slice(0, 5)"
              :key="task.id"
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="viewTask(task)"
            >
              <div class="flex items-center space-x-3">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    task.isOverdue ? 'bg-red-500' : 'bg-blue-500'
                  ]"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ task.title }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ task.contactName }} • {{ formatTaskDate(task.scheduledAt) }}
                  </p>
                </div>
              </div>
              <Icon name="chevron-right" class="w-4 h-4 text-gray-400" />
            </div>
            
            <div v-if="upcomingTasks.length > 5" class="pt-3 border-t border-gray-200 text-center">
              <Button variant="ghost" size="sm" @click="viewAllTasks">
                View All Tasks ({{ upcomingTasks.length }})
              </Button>
            </div>
          </div>
        </DashboardWidget>
      </div>

      <!-- Quick Actions Row -->
      <DashboardWidget
        title="Quick Actions"
        size="medium"
      >
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="New Contact"
            description="Add a new business contact"
            icon="user-plus"
            color="blue"
            @click="createContact"
          />
          <QuickActionCard
            title="Log Interaction"
            description="Record a customer interaction"
            icon="chat-bubble-left-right"
            color="green"
            @click="createInteraction"
          />
          <QuickActionCard
            title="New Organization"
            description="Add a new organization"
            icon="building-office"
            color="purple"
            @click="createOrganization"
          />
          <QuickActionCard
            title="Import Data"
            description="Import contacts or organizations"
            icon="arrow-up-tray"
            color="orange"
            @click="importData"
          />
        </div>
      </DashboardWidget>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organizations'
import { useContactStore } from '@/stores/contacts'
import { useInteractionStore } from '@/stores/interactions'
import { Button, Icon, Badge } from '@/components/atoms'
import DashboardWidget from '@/components/organisms/DashboardWidget/DashboardWidget.vue'
import KPICard from '@/components/molecules/KPICard/KPICard.vue'
import ActivityItem from '@/components/molecules/ActivityItem/ActivityItem.vue'
import QuickActionCard from '@/components/molecules/QuickActionCard/QuickActionCard.vue'
import EmptyState from '@/components/atoms/EmptyState/EmptyState.vue'

const router = useRouter()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()
const contactStore = useContactStore()
const interactionStore = useInteractionStore()

// State
const isInitialLoading = ref(true)
const isRefreshing = ref(false)
const kpiLoading = ref(false)
const activityLoading = ref(false)
const tasksLoading = ref(false)

// Computed
const currentUser = computed(() => authStore.user)

const timeOfDay = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
})

// Dashboard data computed from stores
const dashboardData = computed(() => {
  const organizations = organizationStore.organizations
  const contacts = contactStore.contacts
  const interactions = interactionStore.interactions

  // Calculate changes (mock data for now - would come from API)
  return {
    totalOrganizations: organizations.length,
    organizationsChange: '+12%',
    organizationsTrend: 'up' as const,
    
    totalContacts: contacts.length,
    contactsChange: '+8%',
    contactsTrend: 'up' as const,
    
    recentInteractions: interactions.filter(i => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(i.createdAt || 0) > weekAgo
    }).length,
    interactionsChange: '+15%',
    interactionsTrend: 'up' as const,
    
    pipelineValue: 125000, // Mock value
    pipelineChange: '+5%',
    pipelineTrend: 'up' as const
  }
})

const recentActivity = computed(() => {
  return interactionStore.interactions
    .slice(0, 5)
    .map(interaction => ({
      id: interaction.id,
      type: interaction.type,
      description: `${formatType(interaction.type)} with ${getContactName(interaction.contactId)}`,
      contactName: getContactName(interaction.contactId),
      organizationName: getOrganizationName(interaction.organizationId),
      timestamp: interaction.createdAt,
      user: currentUser.value,
      icon: getTypeIcon(interaction.type)
    }))
})

const upcomingTasks = computed(() => {
  const upcoming = interactionStore.interactions
    .filter(interaction => {
      if (!interaction.scheduledAt) return false
      const scheduledDate = new Date(interaction.scheduledAt)
      const now = new Date()
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return scheduledDate >= now && scheduledDate <= weekFromNow
    })
    .map(interaction => ({
      id: interaction.id,
      title: `${formatType(interaction.type)} with ${getContactName(interaction.contactId)}`,
      contactName: getContactName(interaction.contactId),
      scheduledAt: interaction.scheduledAt!,
      isOverdue: new Date(interaction.scheduledAt!) < new Date(),
      type: interaction.type
    }))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  
  return upcoming
})

const overdueTasks = computed(() => {
  return upcomingTasks.value.filter(task => task.isOverdue).length
})

// Helper functions
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatType = (type: string) => {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone Call',
    meeting: 'Meeting',
    note: 'Note',
    task: 'Task'
  }
  return labels[type] || type
}

const formatTaskDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
  
  if (isToday) return 'Today'
  if (isTomorrow) return 'Tomorrow'
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getContactName = (contactId: string) => {
  const contact = contactStore.getContactById(contactId)
  return contact?.name || 'Unknown Contact'
}

const getOrganizationName = (organizationId: string) => {
  const org = organizationStore.getOrganizationById(organizationId)
  return org?.name || 'Unknown Organization'
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    email: 'envelope',
    phone: 'phone',
    meeting: 'calendar',
    note: 'document-text',
    task: 'check-circle'
  }
  return icons[type] || 'chat-bubble-left-right'
}

// Event handlers
const refreshDashboard = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      organizationStore.fetchOrganizations(),
      contactStore.fetchContacts(),
      interactionStore.fetchInteractions()
    ])
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
  } finally {
    isRefreshing.value = false
  }
}

const openQuickActions = () => {
  // Could open a modal with quick actions
  // For now, just scroll to quick actions section
  const quickActionsElement = document.querySelector('[data-widget="quick-actions"]')
  quickActionsElement?.scrollIntoView({ behavior: 'smooth' })
}

// Navigation methods
const navigateToOrganizations = () => router.push('/organizations')
const navigateToContacts = () => router.push('/contacts')
const navigateToInteractions = () => router.push('/interactions')
const navigateToOpportunities = () => router.push('/opportunities')

const createContact = () => router.push('/contacts/create')
const createInteraction = () => router.push('/interactions/create')
const createOrganization = () => router.push('/organizations/create')

const viewAllActivity = () => router.push('/interactions')
const viewAllTasks = () => router.push('/interactions?filter=scheduled')

const viewActivity = (activity: any) => {
  router.push(`/interactions/${activity.id}`)
}

const viewTask = (task: any) => {
  router.push(`/interactions/${task.id}`)
}

const importData = () => {
  // TODO: Implement import functionality
  console.log('Import data functionality')
}

// Lifecycle
const loadDashboardData = async () => {
  try {
    isInitialLoading.value = true
    
    // Load all necessary data
    await Promise.all([
      organizationStore.fetchOrganizations(),
      contactStore.fetchContacts(),
      interactionStore.fetchInteractions()
    ])
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isInitialLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>