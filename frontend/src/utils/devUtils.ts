// Development utilities and helpers
export class DevUtils {
  private static isDevMode = import.meta.env.DEV

  // Logger with different levels
  static log = {
    info: (message: string, ...args: any[]) => {
      if (this.isDevMode) {
        console.log(`[INFO] ${message}`, ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (this.isDevMode) {
        console.warn(`[WARN] ${message}`, ...args)
      }
    },
    error: (message: string, ...args: any[]) => {
      if (this.isDevMode) {
        console.error(`[ERROR] ${message}`, ...args)
      }
    },
    debug: (message: string, ...args: any[]) => {
      if (this.isDevMode) {
        console.debug(`[DEBUG] ${message}`, ...args)
      }
    }
  }

  // Performance utilities
  static performance = {
    mark: (name: string) => {
      if (this.isDevMode && performance.mark) {
        performance.mark(name)
      }
    },
    measure: (name: string, startMark: string, endMark?: string) => {
      if (this.isDevMode && performance.measure) {
        performance.measure(name, startMark, endMark)
        const measures = performance.getEntriesByName(name)
        const measure = measures[measures.length - 1]
        console.log(`[PERF] ${name}: ${measure.duration.toFixed(2)}ms`)
      }
    },
    time: (label: string) => {
      if (this.isDevMode) {
        console.time(label)
      }
    },
    timeEnd: (label: string) => {
      if (this.isDevMode) {
        console.timeEnd(label)
      }
    }
  }

  // State debugging
  static debugState = (label: string, state: any) => {
    if (this.isDevMode) {
      console.group(`[STATE] ${label}`)
      console.log('State:', state)
      console.trace()
      console.groupEnd()
    }
  }

  // Network debugging
  static debugNetwork = (method: string, url: string, data?: any, response?: any) => {
    if (this.isDevMode) {
      console.group(`[NETWORK] ${method.toUpperCase()} ${url}`)
      if (data) console.log('Request:', data)
      if (response) console.log('Response:', response)
      console.groupEnd()
    }
  }

  // Component lifecycle debugging
  static debugComponent = (componentName: string, lifecycle: string, props?: any) => {
    if (this.isDevMode) {
      console.log(`[COMPONENT] ${componentName} - ${lifecycle}`, props ? { props } : '')
    }
  }

  // Local storage helpers
  static storage = {
    set: (key: string, value: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        if (this.isDevMode) {
          console.log(`[STORAGE] Set ${key}:`, value)
        }
      } catch (error) {
        console.error('[STORAGE] Error setting item:', error)
      }
    },
    get: (key: string, defaultValue?: any) => {
      try {
        const item = localStorage.getItem(key)
        const value = item ? JSON.parse(item) : defaultValue
        if (this.isDevMode) {
          console.log(`[STORAGE] Get ${key}:`, value)
        }
        return value
      } catch (error) {
        console.error('[STORAGE] Error getting item:', error)
        return defaultValue
      }
    },
    remove: (key: string) => {
      try {
        localStorage.removeItem(key)
        if (this.isDevMode) {
          console.log(`[STORAGE] Removed ${key}`)
        }
      } catch (error) {
        console.error('[STORAGE] Error removing item:', error)
      }
    },
    clear: () => {
      try {
        localStorage.clear()
        if (this.isDevMode) {
          console.log('[STORAGE] Cleared all items')
        }
      } catch (error) {
        console.error('[STORAGE] Error clearing storage:', error)
      }
    }
  }

  // Feature flags for development
  static featureFlags = {
    get: (flag: string): boolean => {
      const flags = this.storage.get('dev_feature_flags', {})
      return flags[flag] ?? false
    },
    set: (flag: string, enabled: boolean) => {
      const flags = this.storage.get('dev_feature_flags', {})
      flags[flag] = enabled
      this.storage.set('dev_feature_flags', flags)
      console.log(`[FEATURE] ${flag} ${enabled ? 'enabled' : 'disabled'}`)
    },
    toggle: (flag: string): boolean => {
      const current = this.featureFlags.get(flag)
      this.featureFlags.set(flag, !current)
      return !current
    },
    list: () => {
      const flags = this.storage.get('dev_feature_flags', {})
      console.table(flags)
      return flags
    }
  }

  // Environment info
  static getEnvInfo = () => {
    const info = {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      ssr: import.meta.env.SSR,
      base: import.meta.env.BASE_URL,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
    
    if (this.isDevMode) {
      console.table(info)
    }
    
    return info
  }

  // Test data helpers
  static testData = {
    generateEmail: (prefix = 'test') => `${prefix}+${Date.now()}@example.com`,
    generatePhone: () => `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    generateId: () => Math.random().toString(36).substring(2, 15),
    generateName: () => {
      const first = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana']
      const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']
      return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
    }
  }

  // DOM utilities
  static dom = {
    findByTestId: (testId: string): HTMLElement | null => {
      return document.querySelector(`[data-testid="${testId}"]`)
    },
    findAllByTestId: (testId: string): NodeListOf<HTMLElement> => {
      return document.querySelectorAll(`[data-testid="${testId}"]`)
    },
    addTestId: (element: HTMLElement, testId: string) => {
      element.setAttribute('data-testid', testId)
    }
  }

  // Validation helpers
  static validate = {
    email: (email: string): boolean => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    },
    phone: (phone: string): boolean => {
      const re = /^\d{3}-\d{3}-\d{4}$/
      return re.test(phone)
    },
    required: (value: any): boolean => {
      return value !== null && value !== undefined && value !== ''
    }
  }
}

// Global access in development
if (import.meta.env.DEV) {
  (window as any).devUtils = DevUtils
}

export default DevUtils