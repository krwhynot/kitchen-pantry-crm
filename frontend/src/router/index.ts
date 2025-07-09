import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
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