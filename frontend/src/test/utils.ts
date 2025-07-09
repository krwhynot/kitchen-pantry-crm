import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'

// Test utilities for component testing
export interface TestWrapperOptions {
  props?: Record<string, any>
  slots?: Record<string, any>
  global?: {
    plugins?: any[]
    mocks?: Record<string, any>
    stubs?: Record<string, any>
  }
  route?: string
}

/**
 * Create a test wrapper with common setup
 */
export function createTestWrapper(
  component: Component,
  options: TestWrapperOptions = {}
): VueWrapper<any> {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/test', component: { template: '<div>Test</div>' } }
    ]
  })

  const wrapper = mount(component, {
    props: options.props,
    slots: options.slots,
    global: {
      plugins: [pinia, router, ...(options.global?.plugins || [])],
      mocks: options.global?.mocks || {},
      stubs: options.global?.stubs || {}
    }
  })

  if (options.route) {
    router.push(options.route)
  }

  return wrapper
}

/**
 * Wait for Vue's next tick and component updates
 */
export async function waitForUpdate(wrapper: VueWrapper<any>): Promise<void> {
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Create mock data for testing
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides
  }
}

export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: '1',
    name: 'Test Organization',
    type: 'restaurant',
    status: 'active',
    email: 'test@organization.com',
    phone: '555-0123',
    address: '123 Test St',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides
  }
}

export function createMockContact(overrides: Partial<any> = {}) {
  return {
    id: '1',
    organization_id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    position: 'Manager',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides
  }
}

export function createMockOpportunity(overrides: Partial<any> = {}) {
  return {
    id: '1',
    organization_id: '1',
    name: 'Test Opportunity',
    stage: 'prospecting',
    value: 10000,
    probability: 25,
    expected_close_date: '2023-12-31',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Mock API responses
 */
export const mockApiResponse = {
  success: (data: any) => ({ data, status: 200 }),
  error: (message: string, status: number = 400) => ({ 
    message, 
    status, 
    response: { data: { message } } 
  })
}

/**
 * Test helpers for form validation
 */
export function triggerFormValidation(wrapper: VueWrapper<any>, formSelector = 'form') {
  const form = wrapper.find(formSelector)
  if (form.exists()) {
    form.trigger('submit')
  }
}

export function setInputValue(wrapper: VueWrapper<any>, selector: string, value: string) {
  const input = wrapper.find(selector)
  if (input.exists()) {
    input.setValue(value)
  }
}

/**
 * Test helpers for async operations
 */
export function mockAsyncOperation<T>(data: T, delay = 100): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

export function mockAsyncError(message: string, delay = 100): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}