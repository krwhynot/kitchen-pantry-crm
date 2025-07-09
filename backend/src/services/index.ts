// Base service
export { BaseService } from './BaseService'

// Authentication and authorization services
export { AuthService } from './AuthService'
export { RBACService } from './RBACService'
export { SessionService } from './SessionService'

// Core business logic services
export { OrganizationService } from './OrganizationService'
export { ContactService } from './ContactService'
export { InteractionService } from './InteractionService'
export { OpportunityService } from './OpportunityService'
export { ProductService } from './ProductService'

// Service types and interfaces
export type {
  OrganizationSearchOptions,
  OrganizationCreateData,
  OrganizationUpdateData,
  OrganizationPerformanceMetrics,
  OrganizationActivityFeed
} from './OrganizationService'

export type {
  ContactSearchOptions,
  ContactCreateData,
  ContactUpdateData,
  ContactRelationship,
  ContactCommunicationHistory,
  ContactEngagementMetrics,
  ContactAnalytics
} from './ContactService'

export type {
  InteractionSearchOptions,
  InteractionCreateData,
  InteractionUpdateData,
  InteractionTemplate,
  InteractionAnalytics,
  InteractionInsights,
  InteractionAutomationRule
} from './InteractionService'

export type {
  OpportunitySearchOptions,
  OpportunityCreateData,
  OpportunityUpdateData,
  OpportunityStageTransition,
  OpportunityAnalytics,
  OpportunityForecast,
  OpportunityInsights,
  OpportunityWorkflow
} from './OpportunityService'