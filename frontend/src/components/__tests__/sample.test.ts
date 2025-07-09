import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestWrapper, waitForUpdate, createMockUser } from '../../test/utils'
import { ref } from 'vue'

// Sample component for testing
const SampleComponent = {
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <button @click="updateMessage">Update</button>
    </div>
  `,
  props: {
    title: {
      type: String,
      default: 'Default Title'
    }
  },
  setup() {
    const message = ref('Initial message')
    
    const updateMessage = () => {
      message.value = 'Updated message'
    }
    
    return {
      message,
      updateMessage
    }
  }
}

describe('Component Testing Utilities', () => {
  it('should create a test wrapper with proper setup', () => {
    const wrapper = createTestWrapper(SampleComponent, {
      props: {
        title: 'Test Title'
      }
    })
    
    expect(wrapper.text()).toContain('Test Title')
    expect(wrapper.text()).toContain('Initial message')
  })
  
  it('should handle component interactions', async () => {
    const wrapper = createTestWrapper(SampleComponent)
    
    // Initial state
    expect(wrapper.text()).toContain('Initial message')
    
    // Click button
    await wrapper.find('button').trigger('click')
    await waitForUpdate(wrapper)
    
    // Updated state
    expect(wrapper.text()).toContain('Updated message')
  })
  
  it('should create mock data correctly', () => {
    const user = createMockUser({
      name: 'Custom Name',
      email: 'custom@example.com'
    })
    
    expect(user.name).toBe('Custom Name')
    expect(user.email).toBe('custom@example.com')
    expect(user.id).toBe('1')
    expect(user.role).toBe('user')
  })
  
  it('should handle slots', () => {
    const ComponentWithSlots = {
      template: `
        <div>
          <slot name="header"></slot>
          <slot></slot>
        </div>
      `
    }
    
    const wrapper = createTestWrapper(ComponentWithSlots, {
      slots: {
        header: '<h1>Header Content</h1>',
        default: '<p>Default Slot Content</p>'
      }
    })
    
    expect(wrapper.html()).toContain('<h1>Header Content</h1>')
    expect(wrapper.html()).toContain('<p>Default Slot Content</p>')
  })
})