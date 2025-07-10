# Implementation Guide

**Technical implementation guidance** for the Kitchen Pantry CRM business logic and workflow management system, including database schemas, API endpoints, testing strategies, and deployment considerations.

## Database Schema Design

### Core Tables Structure

**Optimized database schema** supporting business rules, workflows, and sales processes:

```sql
-- Business Rules Tables
CREATE TABLE business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP DEFAULT now(),
    version INTEGER DEFAULT 1
);

-- Workflow Definitions
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT true,
    trigger_config JSONB NOT NULL,
    steps JSONB NOT NULL,
    variables JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP DEFAULT now()
);

-- Workflow Executions
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP,
    current_step VARCHAR(100),
    variables JSONB,
    execution_log JSONB,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id)
);

-- Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    score INTEGER DEFAULT 0,
    company_name VARCHAR(255) NOT NULL,
    company_industry VARCHAR(100),
    company_size VARCHAR(50),
    company_website VARCHAR(255),
    company_annual_revenue DECIMAL(15,2),
    contact_first_name VARCHAR(100) NOT NULL,
    contact_last_name VARCHAR(100) NOT NULL,
    contact_title VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    requirements JSONB,
    assigned_to UUID REFERENCES profiles(id),
    converted_at TIMESTAMP,
    converted_to_opportunity_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Lead Activities
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    outcome VARCHAR(50),
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Opportunities Table
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    account_id UUID REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    stage VARCHAR(50) DEFAULT 'discovery',
    probability INTEGER DEFAULT 0,
    value DECIMAL(15,2) NOT NULL,
    expected_close_date DATE,
    actual_close_date DATE,
    source VARCHAR(100),
    assigned_to UUID REFERENCES profiles(id),
    competitors TEXT[],
    lost_reason TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Opportunity Products
CREATE TABLE opportunity_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0
);

-- Customer Interactions
CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    opportunity_id UUID REFERENCES opportunities(id),
    interaction_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    outcome VARCHAR(50),
    sentiment DECIMAL(3,2), -- -1 to 1
    next_steps TEXT,
    follow_up_date DATE,
    duration_minutes INTEGER,
    location VARCHAR(255),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT now()
);
```

### Indexes and Performance

**Optimized indexes** for business logic queries:

```sql
-- Business Rules Indexes
CREATE INDEX idx_business_rules_entity_enabled ON business_rules(entity_type, enabled);
CREATE INDEX idx_business_rules_priority ON business_rules(priority DESC);

-- Workflow Indexes
CREATE INDEX idx_workflows_enabled ON workflows(enabled);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);

-- Lead Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_source ON leads(source);

-- Opportunity Indexes
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_value ON opportunities(value DESC);

-- Interaction Indexes
CREATE INDEX idx_customer_interactions_account_id ON customer_interactions(account_id);
CREATE INDEX idx_customer_interactions_created_at ON customer_interactions(created_at DESC);
CREATE INDEX idx_customer_interactions_type ON customer_interactions(interaction_type);
```

## API Endpoints

### Business Rules API

**RESTful endpoints** for business rule management:

```typescript
// Business Rules Controller
export class BusinessRulesController {
  // GET /api/v1/business-rules
  async getRules(req: Request, res: Response): Promise<void> {
    const { entity, enabled, page = 1, limit = 50 } = req.query
    
    const filters: RuleFilters = {
      entity: entity as string,
      enabled: enabled === 'true',
      page: Number(page),
      limit: Number(limit)
    }
    
    const result = await this.businessRuleService.getRules(filters)
    res.json({
      success: true,
      data: result.rules,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(result.total / filters.limit)
      }
    })
  }

  // POST /api/v1/business-rules
  async createRule(req: Request, res: Response): Promise<void> {
    const ruleData = req.body
    const userId = req.user.id
    
    const rule = await this.businessRuleService.createRule(ruleData, userId)
    res.status(201).json({
      success: true,
      data: rule
    })
  }

  // PUT /api/v1/business-rules/:id
  async updateRule(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const updates = req.body
    const userId = req.user.id
    
    const rule = await this.businessRuleService.updateRule(id, updates, userId)
    res.json({
      success: true,
      data: rule
    })
  }

  // DELETE /api/v1/business-rules/:id
  async deleteRule(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    
    await this.businessRuleService.deleteRule(id)
    res.json({
      success: true,
      message: 'Rule deleted successfully'
    })
  }

  // POST /api/v1/business-rules/:id/test
  async testRule(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const testData = req.body
    
    const result = await this.businessRuleService.testRule(id, testData)
    res.json({
      success: true,
      data: result
    })
  }

  // GET /api/v1/business-rules/execution-history
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    const { ruleId, limit = 100 } = req.query
    
    const history = await this.businessRuleService.getExecutionHistory(ruleId as string, Number(limit))
    res.json({
      success: true,
      data: history
    })
  }
}
```

### Workflow Management API

**Comprehensive workflow management endpoints**:

```typescript
// Workflow Controller
export class WorkflowController {
  // GET /api/v1/workflows
  async getWorkflows(req: Request, res: Response): Promise<void> {
    const { enabled, page = 1, limit = 50 } = req.query
    
    const workflows = await this.workflowService.getWorkflows({
      enabled: enabled === 'true',
      page: Number(page),
      limit: Number(limit)
    })
    
    res.json({
      success: true,
      data: workflows
    })
  }

  // POST /api/v1/workflows
  async createWorkflow(req: Request, res: Response): Promise<void> {
    const workflowData = req.body
    const userId = req.user.id
    
    const workflow = await this.workflowService.createWorkflow(workflowData, userId)
    res.status(201).json({
      success: true,
      data: workflow
    })
  }

  // POST /api/v1/workflows/:id/execute
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const initialVariables = req.body.variables || {}
    
    const executionId = await this.workflowService.executeWorkflow(id, initialVariables)
    res.json({
      success: true,
      data: { executionId }
    })
  }

  // GET /api/v1/workflows/executions/:id
  async getExecution(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    
    const execution = await this.workflowService.getExecution(id)
    if (!execution) {
      res.status(404).json({
        success: false,
        error: 'Execution not found'
      })
      return
    }
    
    res.json({
      success: true,
      data: execution
    })
  }

  // POST /api/v1/workflows/executions/:id/resume
  async resumeExecution(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { stepId, result } = req.body
    
    await this.workflowService.resumeExecution(id, stepId, result)
    res.json({
      success: true,
      message: 'Execution resumed successfully'
    })
  }

  // POST /api/v1/workflows/executions/:id/cancel
  async cancelExecution(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    
    await this.workflowService.cancelExecution(id)
    res.json({
      success: true,
      message: 'Execution cancelled successfully'
    })
  }
}
```

### Lead Management API

**Lead processing and management endpoints**:

```typescript
// Lead Controller
export class LeadController {
  // GET /api/v1/leads
  async getLeads(req: Request, res: Response): Promise<void> {
    const filters = this.parseLeadFilters(req.query)
    
    const result = await this.leadService.getLeads(filters)
    res.json({
      success: true,
      data: result.leads,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit
      }
    })
  }

  // POST /api/v1/leads
  async createLead(req: Request, res: Response): Promise<void> {
    const leadData = req.body
    
    // Check for duplicates
    const duplicates = await this.leadService.checkForDuplicates(leadData)
    if (duplicates.length > 0) {
      res.status(409).json({
        success: false,
        error: 'Duplicate lead detected',
        duplicates: duplicates.map(d => ({ id: d.id, name: `${d.contact.firstName} ${d.contact.lastName}` }))
      })
      return
    }
    
    const lead = await this.leadService.createLead(leadData)
    res.status(201).json({
      success: true,
      data: lead
    })
  }

  // PUT /api/v1/leads/:id/qualify
  async qualifyLead(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const qualificationData = req.body
    
    const lead = await this.leadService.qualifyLead(id, qualificationData)
    res.json({
      success: true,
      data: lead
    })
  }

  // POST /api/v1/leads/:id/convert
  async convertLead(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const opportunityData = req.body
    
    const result = await this.leadService.convertLead(id, opportunityData)
    res.json({
      success: true,
      data: result
    })
  }

  // POST /api/v1/leads/:id/activities
  async addActivity(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const activityData = {
      ...req.body,
      createdBy: req.user.id
    }
    
    const activity = await this.leadService.addActivity(id, activityData)
    res.status(201).json({
      success: true,
      data: activity
    })
  }

  // GET /api/v1/leads/analytics
  async getLeadAnalytics(req: Request, res: Response): Promise<void> {
    const { timeframe = 'month' } = req.query
    
    const analytics = await this.leadService.getLeadAnalytics(timeframe as string)
    res.json({
      success: true,
      data: analytics
    })
  }
}
```

## Service Layer Implementation

### Business Rule Service

**Core business rule processing logic**:

```typescript
export class BusinessRuleService {
  private ruleEngine: BusinessRuleEngine
  private repository: BusinessRuleRepository

  constructor(ruleEngine: BusinessRuleEngine, repository: BusinessRuleRepository) {
    this.ruleEngine = ruleEngine
    this.repository = repository
  }

  async createRule(ruleData: CreateRuleRequest, userId: string): Promise<BusinessRule> {
    // Validate rule syntax
    await this.validateRuleDefinition(ruleData)
    
    // Create rule with metadata
    const rule: BusinessRule = {
      ...ruleData,
      id: this.generateRuleId(),
      metadata: {
        createdBy: userId,
        createdAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
        version: 1
      }
    }
    
    // Save to database
    await this.repository.save(rule)
    
    // Reload rules in engine
    await this.ruleEngine.reloadRules()
    
    return rule
  }

  async executeRulesForEntity(entity: string, entityId: string, data: any, userId: string): Promise<RuleExecutionResult> {
    const context: RuleContext = {
      entity,
      entityId,
      data,
      user: { id: userId, role: 'user', permissions: [] },
      timestamp: new Date()
    }
    
    const result = await this.ruleEngine.executeRules(entity, context)
    
    // Log execution for audit
    await this.logRuleExecution(entity, entityId, result, userId)
    
    return result
  }

  async testRule(ruleId: string, testData: any): Promise<RuleTestResult> {
    const rule = await this.repository.findById(ruleId)
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`)
    }
    
    const context: RuleContext = {
      entity: 'test',
      entityId: 'test_' + Date.now(),
      data: testData,
      user: { id: 'test_user', role: 'admin', permissions: [] },
      timestamp: new Date()
    }
    
    try {
      const conditionResult = await this.ruleEngine.evaluateConditions(rule.conditions, context)
      let actionResults: any[] = []
      
      if (conditionResult) {
        actionResults = await this.ruleEngine.executeActions(rule.actions, context)
      }
      
      return {
        passed: true,
        conditionResult,
        actionResults,
        errors: []
      }
    } catch (error) {
      return {
        passed: false,
        conditionResult: false,
        actionResults: [],
        errors: [error.message]
      }
    }
  }

  private async validateRuleDefinition(ruleData: CreateRuleRequest): Promise<void> {
    // Validate conditions
    if (!ruleData.conditions || ruleData.conditions.length === 0) {
      throw new Error('Rule must have at least one condition')
    }
    
    for (const condition of ruleData.conditions) {
      if (!condition.field || !condition.operator) {
        throw new Error('Invalid condition: field and operator are required')
      }
      
      if (!['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in'].includes(condition.operator)) {
        throw new Error(`Invalid operator: ${condition.operator}`)
      }
    }
    
    // Validate actions
    if (!ruleData.actions || ruleData.actions.length === 0) {
      throw new Error('Rule must have at least one action')
    }
    
    for (const action of ruleData.actions) {
      if (!action.type || !action.parameters) {
        throw new Error('Invalid action: type and parameters are required')
      }
      
      if (!['set_field', 'send_notification', 'create_task', 'update_status', 'trigger_workflow'].includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`)
      }
    }
  }
}
```

## Testing Strategy

### Unit Testing

**Comprehensive unit tests** for business logic components:

```typescript
// Business Rule Engine Tests
describe('BusinessRuleEngine', () => {
  let ruleEngine: BusinessRuleEngine
  let mockRepository: jest.Mocked<BusinessRuleRepository>

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    }
    ruleEngine = new BusinessRuleEngine(mockRepository)
  })

  describe('executeRules', () => {
    it('should execute all applicable rules for entity', async () => {
      // Arrange
      const leadRule: BusinessRule = {
        id: 'lead_rule_1',
        name: 'High Value Lead',
        description: 'Identify high value leads',
        entity: 'lead',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'company.size', operator: 'equals', value: 'enterprise' },
          { field: 'score', operator: 'greater_than', value: 70, logicalOperator: 'AND' }
        ],
        actions: [
          { type: 'set_field', parameters: { field: 'priority', value: 'high' } },
          { type: 'create_task', parameters: { title: 'Follow up with high value lead' } }
        ],
        metadata: {
          createdBy: 'test_user',
          createdAt: new Date(),
          updatedBy: 'test_user',
          updatedAt: new Date(),
          version: 1
        }
      }

      mockRepository.findAll.mockResolvedValue([leadRule])

      const context: RuleContext = {
        entity: 'lead',
        entityId: 'lead_123',
        data: {
          company: { size: 'enterprise' },
          score: 85
        },
        user: { id: 'user_123', role: 'admin', permissions: [] },
        timestamp: new Date()
      }

      // Act
      const result = await ruleEngine.executeRules('lead', context)

      // Assert
      expect(result.executedRules).toContain('lead_rule_1')
      expect(result.actions).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle rule execution errors gracefully', async () => {
      // Arrange
      const faultyRule: BusinessRule = {
        id: 'faulty_rule',
        name: 'Faulty Rule',
        description: 'Rule with invalid condition',
        entity: 'lead',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'nonexistent.field', operator: 'equals', value: 'test' }
        ],
        actions: [
          { type: 'set_field', parameters: { field: 'status', value: 'processed' } }
        ],
        metadata: {
          createdBy: 'test_user',
          createdAt: new Date(),
          updatedBy: 'test_user',
          updatedAt: new Date(),
          version: 1
        }
      }

      mockRepository.findAll.mockResolvedValue([faultyRule])

      const context: RuleContext = {
        entity: 'lead',
        entityId: 'lead_123',
        data: { company: { size: 'small' } },
        user: { id: 'user_123', role: 'admin', permissions: [] },
        timestamp: new Date()
      }

      // Act
      const result = await ruleEngine.executeRules('lead', context)

      // Assert
      expect(result.executedRules).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('faulty_rule')
    })
  })

  describe('evaluateConditions', () => {
    it('should evaluate AND conditions correctly', async () => {
      // Arrange
      const conditions: RuleCondition[] = [
        { field: 'company.size', operator: 'equals', value: 'enterprise' },
        { field: 'score', operator: 'greater_than', value: 70, logicalOperator: 'AND' }
      ]

      const context: RuleContext = {
        entity: 'lead',
        entityId: 'lead_123',
        data: {
          company: { size: 'enterprise' },
          score: 85
        },
        user: { id: 'user_123', role: 'admin', permissions: [] },
        timestamp: new Date()
      }

      // Act
      const result = await ruleEngine.evaluateConditions(conditions, context)

      // Assert
      expect(result).toBe(true)
    })

    it('should evaluate OR conditions correctly', async () => {
      // Arrange
      const conditions: RuleCondition[] = [
        { field: 'company.size', operator: 'equals', value: 'enterprise' },
        { field: 'score', operator: 'greater_than', value: 90, logicalOperator: 'OR' }
      ]

      const context: RuleContext = {
        entity: 'lead',
        entityId: 'lead_123',
        data: {
          company: { size: 'small' },
          score: 85
        },
        user: { id: 'user_123', role: 'admin', permissions: [] },
        timestamp: new Date()
      }

      // Act
      const result = await ruleEngine.evaluateConditions(conditions, context)

      // Assert
      expect(result).toBe(false)
    })
  })
})
```

### Integration Testing

**End-to-end integration tests** for complete workflows:

```typescript
// Workflow Integration Tests
describe('Workflow Integration', () => {
  let workflowEngine: WorkflowEngine
  let leadService: LeadService
  let testDatabase: TestDatabase

  beforeAll(async () => {
    testDatabase = new TestDatabase()
    await testDatabase.setup()
    
    workflowEngine = new WorkflowEngine(testDatabase.connection)
    leadService = new LeadService(testDatabase.connection)
  })

  afterAll(async () => {
    await testDatabase.cleanup()
  })

  afterEach(async () => {
    await testDatabase.clearData()
  })

  describe('Lead Nurturing Workflow', () => {
    it('should execute complete lead nurturing sequence', async () => {
      // Arrange
      const lead = await leadService.createLead({
        source: 'website',
        status: 'new',
        company: {
          name: 'Test Restaurant',
          industry: 'restaurant',
          size: 'medium'
        },
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          title: 'Manager',
          email: 'john@testrestaurant.com'
        }
      })

      const nurtureWorkflow = await workflowEngine.createWorkflow({
        name: 'Lead Nurturing Test',
        trigger: { type: 'manual' },
        steps: [
          {
            id: 'send_welcome_email',
            name: 'Send Welcome Email',
            type: 'action',
            configuration: {
              action: 'send_email',
              parameters: {
                template: 'welcome_lead',
                recipient: '{{lead.contact.email}}'
              }
            },
            nextSteps: ['wait_2_days']
          },
          {
            id: 'wait_2_days',
            name: 'Wait 2 Days',
            type: 'delay',
            configuration: { duration: 2 },
            nextSteps: ['send_followup']
          },
          {
            id: 'send_followup',
            name: 'Send Follow-up',
            type: 'action',
            configuration: {
              action: 'send_email',
              parameters: {
                template: 'followup_lead',
                recipient: '{{lead.contact.email}}'
              }
            },
            nextSteps: []
          }
        ],
        variables: [
          { name: 'lead', type: 'object', required: true }
        ]
      })

      // Act
      const executionId = await workflowEngine.executeWorkflow(nurtureWorkflow.id, { lead })

      // Assert
      const execution = await workflowEngine.getExecution(executionId)
      expect(execution).toBeDefined()
      expect(execution!.status).toBe('completed')
      expect(execution!.executionLog).toHaveLength(3)
      expect(execution!.executionLog[0].stepName).toBe('Send Welcome Email')
      expect(execution!.executionLog[1].stepName).toBe('Wait 2 Days')
      expect(execution!.executionLog[2].stepName).toBe('Send Follow-up')
    })
  })
})
```

## Performance Considerations

### Caching Strategy

**Multi-level caching** for optimal performance:

```typescript
// Rule Cache Implementation
class RuleCache {
  private memoryCache: Map<string, BusinessRule[]> = new Map()
  private redisClient: Redis
  private cacheKeyPrefix = 'business_rules:'

  constructor(redisClient: Redis) {
    this.redisClient = redisClient
  }

  async getRules(entity: string): Promise<BusinessRule[]> {
    // Check memory cache first
    if (this.memoryCache.has(entity)) {
      return this.memoryCache.get(entity)!
    }

    // Check Redis cache
    const cacheKey = `${this.cacheKeyPrefix}${entity}`
    const cachedRules = await this.redisClient.get(cacheKey)
    
    if (cachedRules) {
      const rules = JSON.parse(cachedRules)
      this.memoryCache.set(entity, rules)
      return rules
    }

    // Load from database
    const rules = await this.loadRulesFromDatabase(entity)
    
    // Cache in both memory and Redis
    this.memoryCache.set(entity, rules)
    await this.redisClient.setex(cacheKey, 300, JSON.stringify(rules)) // 5 minutes
    
    return rules
  }

  async invalidateCache(entity?: string): Promise<void> {
    if (entity) {
      this.memoryCache.delete(entity)
      await this.redisClient.del(`${this.cacheKeyPrefix}${entity}`)
    } else {
      this.memoryCache.clear()
      const keys = await this.redisClient.keys(`${this.cacheKeyPrefix}*`)
      if (keys.length > 0) {
        await this.redisClient.del(...keys)
      }
    }
  }
}
```

### Database Optimization

**Query optimization** and connection pooling:

```typescript
// Database Connection Pool
class DatabasePool {
  private pool: Pool

  constructor(config: PoolConfig) {
    this.pool = new Pool({
      ...config,
      max: 20, // Maximum connections
      min: 5,  // Minimum connections
      acquire: 30000, // 30 seconds
      idle: 10000,    // 10 seconds
      evict: 1000     // 1 second
    })
  }

  async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(query, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async executeTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
```

## Deployment Configuration

### Environment Setup

**Configuration management** for different environments:

```typescript
// Environment Configuration
export interface AppConfig {
  database: {
    host: string
    port: number
    database: string
    username: string
    password: string
    ssl: boolean
    poolSize: number
  }
  redis: {
    host: string
    port: number
    password?: string
    db: number
  }
  workflow: {
    maxConcurrentExecutions: number
    executionTimeout: number
    retryAttempts: number
  }
  businessRules: {
    cacheTimeout: number
    maxRulesPerEntity: number
    enableAuditLogging: boolean
  }
}

export const config: AppConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'kitchen_pantry',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  workflow: {
    maxConcurrentExecutions: parseInt(process.env.WORKFLOW_MAX_CONCURRENT || '100'),
    executionTimeout: parseInt(process.env.WORKFLOW_TIMEOUT || '300000'), // 5 minutes
    retryAttempts: parseInt(process.env.WORKFLOW_RETRY_ATTEMPTS || '3')
  },
  businessRules: {
    cacheTimeout: parseInt(process.env.RULES_CACHE_TIMEOUT || '300'), // 5 minutes
    maxRulesPerEntity: parseInt(process.env.RULES_MAX_PER_ENTITY || '50'),
    enableAuditLogging: process.env.RULES_AUDIT_LOGGING === 'true'
  }
}
```

### Monitoring and Logging

**Comprehensive monitoring** and observability:

```typescript
// Application Monitoring
class ApplicationMonitor {
  private metrics: MetricsCollector
  private logger: Logger

  constructor(metrics: MetricsCollector, logger: Logger) {
    this.metrics = metrics
    this.logger = logger
  }

  trackRuleExecution(ruleId: string, executionTime: number, success: boolean): void {
    this.metrics.increment('business_rules.executions.total', {
      rule_id: ruleId,
      success: success.toString()
    })

    this.metrics.histogram('business_rules.execution_time', executionTime, {
      rule_id: ruleId
    })

    if (!success) {
      this.logger.error('Rule execution failed', {
        ruleId,
        executionTime,
        timestamp: new Date()
      })
    }
  }

  trackWorkflowExecution(workflowId: string, executionTime: number, status: string): void {
    this.metrics.increment('workflows.executions.total', {
      workflow_id: workflowId,
      status
    })

    this.metrics.histogram('workflows.execution_time', executionTime, {
      workflow_id: workflowId
    })

    this.logger.info('Workflow execution completed', {
      workflowId,
      status,
      executionTime,
      timestamp: new Date()
    })
  }

  trackLeadProcessing(leadId: string, processingTime: number, outcome: string): void {
    this.metrics.increment('leads.processed.total', {
      outcome
    })

    this.metrics.histogram('leads.processing_time', processingTime)

    this.logger.info('Lead processed', {
      leadId,
      outcome,
      processingTime,
      timestamp: new Date()
    })
  }
}
```

---

**Implementation Complete**: The business logic and workflow management system is now fully documented with modular, Claude-friendly formatting and comprehensive technical implementation guidance.