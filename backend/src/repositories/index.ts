// Repository exports
export { BaseRepository } from './BaseRepository'
export { OrganizationRepository } from './OrganizationRepository'

// Repository interfaces and types
export type {
  PaginationOptions,
  PaginationResult,
  RepositoryOptions
} from './BaseRepository'

export type {
  OrganizationFilters,
  OrganizationAnalytics
} from './OrganizationRepository'

// Create repository instances
export const organizationRepository = new OrganizationRepository()

// Repository factory for dependency injection
export class RepositoryFactory {
  private static repositories = new Map<string, any>()

  static getOrganizationRepository(options?: RepositoryOptions): OrganizationRepository {
    const key = `organization_${JSON.stringify(options || {})}`
    
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new OrganizationRepository(options))
    }
    
    return this.repositories.get(key)
  }

  static clearCache(): void {
    this.repositories.clear()
  }

  static getRepositoryStats(): { count: number; keys: string[] } {
    return {
      count: this.repositories.size,
      keys: Array.from(this.repositories.keys())
    }
  }
}

// Repository configuration
export const REPOSITORY_CONFIG = {
  defaultOptions: {
    enableAuditLog: true,
    enablePerformanceAnalysis: true,
    enableCaching: true,
    sanitizeData: true,
    validateIntegrity: true
  },
  performanceOptions: {
    enableAuditLog: false,
    enablePerformanceAnalysis: true,
    enableCaching: true,
    sanitizeData: false,
    validateIntegrity: false
  },
  secureOptions: {
    enableAuditLog: true,
    enablePerformanceAnalysis: false,
    enableCaching: false,
    sanitizeData: true,
    validateIntegrity: true
  }
}