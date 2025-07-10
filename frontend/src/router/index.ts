import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  // Public routes
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: false }
  },

  // Authentication routes
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('../views/auth/LoginView.vue'),
        meta: { requiresAuth: false, hideForAuthenticated: true }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('../views/auth/RegisterView.vue'),
        meta: { requiresAuth: false, hideForAuthenticated: true }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('../views/auth/PasswordResetView.vue'),
        meta: { requiresAuth: false, hideForAuthenticated: true }
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('../views/auth/PasswordResetView.vue'),
        meta: { requiresAuth: false, hideForAuthenticated: true }
      },
      {
        path: 'verify-email',
        name: 'verify-email',
        component: () => import('../views/auth/AuthSuccessView.vue'),
        meta: { requiresAuth: false },
        props: { successType: 'verification' }
      },
      {
        path: 'email-verified',
        name: 'email-verified',
        component: () => import('../views/auth/AuthSuccessView.vue'),
        meta: { requiresAuth: false },
        props: { successType: 'email-verified' }
      },
      {
        path: 'password-reset-success',
        name: 'password-reset-success',
        component: () => import('../views/auth/AuthSuccessView.vue'),
        meta: { requiresAuth: false },
        props: { successType: 'password-reset' }
      },
      {
        path: 'registration-success',
        name: 'registration-success',
        component: () => import('../views/auth/AuthSuccessView.vue'),
        meta: { requiresAuth: false },
        props: { successType: 'registration' }
      },
      {
        path: 'account-activated',
        name: 'account-activated',
        component: () => import('../views/auth/AuthSuccessView.vue'),
        meta: { requiresAuth: false },
        props: { successType: 'account-activated' }
      },
      {
        path: 'error',
        name: 'auth-error',
        component: () => import('../views/auth/AuthErrorView.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },

  // Protected routes with DefaultLayout
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { 
      requiresAuth: true,
      layout: 'default'
    }
  },

  // Organization routes
  {
    path: '/organizations',
    meta: { requiresAuth: true, layout: 'default' },
    children: [
      {
        path: '',
        name: 'organizations',
        component: () => import('../views/organizations/OrganizationsListView.vue')
      },
      {
        path: 'create',
        name: 'organizations-create',
        component: () => import('../views/organizations/OrganizationCreateView.vue')
      },
      {
        path: ':id',
        name: 'organization-detail',
        component: () => import('../views/organizations/OrganizationDetailView.vue'),
        props: true
      },
      {
        path: ':id/edit',
        name: 'organization-edit',
        component: () => import('../views/organizations/OrganizationEditView.vue'),
        props: true
      }
    ]
  },

  // Contact routes
  {
    path: '/contacts',
    meta: { requiresAuth: true, layout: 'default' },
    children: [
      {
        path: '',
        name: 'contacts',
        component: () => import('../views/contacts/ContactsListView.vue')
      },
      {
        path: 'create',
        name: 'contacts-create',
        component: () => import('../views/contacts/ContactCreateView.vue')
      },
      {
        path: ':id',
        name: 'contact-detail',
        component: () => import('../views/contacts/ContactDetailView.vue'),
        props: true
      },
      {
        path: ':id/edit',
        name: 'contact-edit',
        component: () => import('../views/contacts/ContactEditView.vue'),
        props: true
      }
    ]
  },

  // Interaction routes
  {
    path: '/interactions',
    meta: { requiresAuth: true, layout: 'default' },
    children: [
      {
        path: '',
        name: 'interactions',
        component: () => import('../views/interactions/InteractionsListView.vue')
      },
      {
        path: 'create',
        name: 'interactions-create',
        component: () => import('../views/interactions/InteractionCreateView.vue')
      },
      {
        path: ':id',
        name: 'interaction-detail',
        component: () => import('../views/interactions/InteractionDetailView.vue'),
        props: true
      },
      {
        path: ':id/edit',
        name: 'interaction-edit',
        component: () => import('../views/interactions/InteractionEditView.vue'),
        props: true
      }
    ]
  },

  // Opportunity routes
  {
    path: '/opportunities',
    meta: { requiresAuth: true, layout: 'default' },
    children: [
      {
        path: '',
        name: 'opportunities',
        component: () => import('../views/opportunities/OpportunitiesListView.vue')
      },
      {
        path: 'create',
        name: 'opportunities-create',
        component: () => import('../views/opportunities/OpportunityCreateView.vue')
      },
      {
        path: ':id',
        name: 'opportunity-detail',
        component: () => import('../views/opportunities/OpportunityDetailView.vue'),
        props: true
      }
    ]
  },

  // User management routes
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/user/ProfileView.vue'),
    meta: { requiresAuth: true, layout: 'default' }
  },
  {
    path: '/settings',
    meta: { requiresAuth: true, layout: 'default' },
    children: [
      {
        path: '',
        name: 'settings',
        component: () => import('../views/settings/SettingsView.vue')
      },
      {
        path: 'security',
        name: 'settings-security',
        component: () => import('../views/settings/SecuritySettingsView.vue')
      },
      {
        path: 'notifications',
        name: 'settings-notifications',
        component: () => import('../views/settings/NotificationSettingsView.vue')
      }
    ]
  },

  // Error routes
  {
    path: '/error',
    name: 'error',
    component: () => import('../views/ErrorView.vue'),
    meta: { requiresAuth: false }
  },

  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated && authStore.token) {
    try {
      await authStore.getCurrentUser()
    } catch (error) {
      authStore.logout()
    }
  }

  // Check authentication requirements
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Hide auth pages for authenticated users
  if (to.meta.hideForAuthenticated && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // Check role requirements
  if (to.meta.requiresRole && authStore.user) {
    const requiredRoles = to.meta.requiresRole as string[]
    if (!requiredRoles.includes(authStore.user.role)) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router