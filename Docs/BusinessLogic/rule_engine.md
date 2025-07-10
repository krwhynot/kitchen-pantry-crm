# Business Rule Engine Framework

**The Kitchen Pantry CRM rule engine** provides sophisticated business logic configuration and automated decision-making capabilities. This system enables flexible rule configuration without code changes, supporting complex conditional logic and automated actions across all system components.

## Core Architecture

### Rule Definition Structure

Business rules use a **declarative syntax** that allows non-technical users to configure business logic. Each rule contains conditions, actions, and metadata for complete context and maintenance tracking.

```typescript
interface BusinessRule {
  id: string
  name: string
  description: string
  priority: number
  enabled: boolean
  conditions: RuleCondition[]
  actions: RuleAction[]
  metadata: {
    createdBy: string
    createdAt: Date
    updatedBy: string
    updatedAt: Date
    version: number
  }
}
```

### Rule Conditions

**Flexible condition evaluation** supports multiple operators and logical combinations:

```typescript
interface RuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}
```

**Example Conditions:**
- **Company Size**: `company.size equals "enterprise"`
- **Revenue Threshold**: `company.annualRevenue greater_than 10000000`
- **Title Contains**: `contact.title contains "director"`
- **Multiple Industries**: `company.industry in ["restaurant", "catering"]`

### Rule Actions

**Automated actions** execute when conditions are met:

```typescript
interface RuleAction {
  type: 'set_field' | 'send_notification' | 'create_task' | 'update_status' | 'trigger_workflow'
  parameters: Record<string, any>
}
```

**Action Types:**
- **Set Field**: Update entity properties
- **Send Notification**: Email/SMS alerts
- **Create Task**: Generate follow-up tasks
- **Update Status**: Change entity status
- **Trigger Workflow**: Start automated processes

## Rule Execution Engine

### Priority-Based Processing

The execution engine processes rules based on **priority levels** with conflict resolution:

```typescript
class BusinessRuleEngine {
  async executeRules(entity: string, context: RuleContext): Promise<RuleExecutionResult> {
    const entityRules = this.rules.get(entity) || []
    const executedRules: string[] = []
    const actions: RuleAction[] = []
    const errors: string[] = []

    // Process rules by priority (highest first)
    for (const rule of entityRules) {
      if (!rule.enabled) continue

      try {
        if (await this.evaluateConditions(rule.conditions, context)) {
          executedRules.push(rule.id)
          actions.push(...rule.actions)
          this.logRuleExecution(rule, context, true)
        }
      } catch (error) {
        errors.push(`Rule ${rule.id}: ${error.message}`)
        this.logRuleExecution(rule, context, false, error.message)
      }
    }

    const actionResults = await this.executeActions(actions, context)
    return { executedRules, actions: actionResults, errors }
  }
}
```

### Condition Evaluation

**Flexible condition evaluation** supports complex logical operations:

```typescript
private async evaluateConditions(conditions: RuleCondition[], context: RuleContext): Promise<boolean> {
  if (conditions.length === 0) return true

  let result = true
  let currentLogicalOperator: 'AND' | 'OR' = 'AND'

  for (const condition of conditions) {
    const conditionResult = await this.evaluateCondition(condition, context)
    
    if (currentLogicalOperator === 'AND') {
      result = result && conditionResult
    } else {
      result = result || conditionResult
    }

    if (condition.logicalOperator) {
      currentLogicalOperator = condition.logicalOperator
    }
  }

  return result
}
```

## Rule Management Interface

### Rule Creation

**Visual rule builder** enables non-technical users to create complex business rules:

```typescript
async createRule(rule: Omit<BusinessRule, 'id' | 'metadata'>): Promise<BusinessRule> {
  const newRule: BusinessRule = {
    ...rule,
    id: this.generateRuleId(),
    metadata: {
      createdBy: 'system',
      createdAt: new Date(),
      updatedBy: 'system',
      updatedAt: new Date(),
      version: 1
    }
  }

  await this.saveRuleToDatabase(newRule)
  await this.loadRules() // Reload rules cache
  return newRule
}
```

### Rule Testing

**Built-in testing capabilities** allow validation before deployment:

```typescript
async testRule(rule: BusinessRule, testData: any): Promise<RuleTestResult> {
  const context: RuleContext = {
    entity: 'test',
    entityId: 'test_123',
    data: testData,
    user: { id: 'test_user', role: 'admin', permissions: [] },
    timestamp: new Date()
  }

  const result = await this.executeRules('test', context)
  return {
    passed: result.errors.length === 0,
    executedRules: result.executedRules,
    errors: result.errors,
    actions: result.actions
  }
}
```

## Action Execution

### Built-in Actions

**Pre-defined actions** handle common business operations:

```typescript
private async executeAction(action: RuleAction, context: RuleContext): Promise<any> {
  switch (action.type) {
    case 'set_field':
      return this.setFieldAction(action.parameters, context)
    case 'send_notification':
      return this.sendNotificationAction(action.parameters, context)
    case 'create_task':
      return this.createTaskAction(action.parameters, context)
    case 'update_status':
      return this.updateStatusAction(action.parameters, context)
    case 'trigger_workflow':
      return this.triggerWorkflowAction(action.parameters, context)
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}
```

### Custom Actions

**Extensible action system** allows custom business logic:

```typescript
// Example: Custom lead scoring action
private async customLeadScoringAction(parameters: any, context: RuleContext): Promise<void> {
  const { scoringModel, weights } = parameters
  const lead = context.data
  
  let score = 0
  
  // Apply scoring model
  if (lead.company.size === 'enterprise') score += weights.companySize
  if (lead.contact.title.includes('director')) score += weights.titleWeight
  if (lead.requirements.budget > 50000) score += weights.budgetWeight
  
  // Update lead score
  await this.updateEntityField(context.entity, context.entityId, 'score', score)
}
```

## Real-World Examples

### Lead Qualification Rules

**Automated lead qualification** based on company and contact characteristics:

```typescript
// High-value enterprise lead rule
const enterpriseLeadRule: BusinessRule = {
  id: 'enterprise_lead_qualification',
  name: 'Enterprise Lead Qualification',
  description: 'Automatically qualify high-value enterprise leads',
  priority: 100,
  enabled: true,
  conditions: [
    { field: 'company.size', operator: 'equals', value: 'enterprise' },
    { field: 'company.annualRevenue', operator: 'greater_than', value: 50000000, logicalOperator: 'AND' },
    { field: 'contact.title', operator: 'contains', value: 'director', logicalOperator: 'AND' }
  ],
  actions: [
    { type: 'set_field', parameters: { field: 'status', value: 'qualified' } },
    { type: 'set_field', parameters: { field: 'priority', value: 'high' } },
    { type: 'create_task', parameters: { 
      title: 'Follow up with enterprise lead',
      assignee: 'sales_manager',
      dueDate: '2024-01-15'
    }},
    { type: 'trigger_workflow', parameters: { workflowId: 'enterprise_nurture' } }
  ],
  metadata: {
    createdBy: 'admin',
    createdAt: new Date(),
    updatedBy: 'admin',
    updatedAt: new Date(),
    version: 1
  }
}
```

### Opportunity Management Rules

**Automated opportunity progression** based on customer interactions:

```typescript
// Opportunity stage progression rule
const opportunityProgressionRule: BusinessRule = {
  id: 'opportunity_progression',
  name: 'Opportunity Stage Progression',
  description: 'Automatically advance opportunities based on customer engagement',
  priority: 90,
  enabled: true,
  conditions: [
    { field: 'lastInteraction.type', operator: 'equals', value: 'demo' },
    { field: 'lastInteraction.outcome', operator: 'equals', value: 'positive', logicalOperator: 'AND' },
    { field: 'stage', operator: 'equals', value: 'discovery', logicalOperator: 'AND' }
  ],
  actions: [
    { type: 'update_status', parameters: { status: 'proposal' } },
    { type: 'create_task', parameters: {
      title: 'Prepare proposal',
      assignee: 'sales_rep',
      dueDate: '+3 days'
    }},
    { type: 'send_notification', parameters: {
      recipient: 'sales_manager',
      template: 'opportunity_advanced',
      data: { stage: 'proposal' }
    }}
  ],
  metadata: {
    createdBy: 'sales_manager',
    createdAt: new Date(),
    updatedBy: 'sales_manager',
    updatedAt: new Date(),
    version: 1
  }
}
```

## Performance Optimization

### Rule Caching

**Intelligent rule caching** improves execution performance:

```typescript
class RuleCache {
  private cache: Map<string, BusinessRule[]> = new Map()
  private lastRefresh: Date = new Date()

  async getRules(entity: string): Promise<BusinessRule[]> {
    if (this.shouldRefreshCache()) {
      await this.refreshCache()
    }
    
    return this.cache.get(entity) || []
  }

  private shouldRefreshCache(): boolean {
    const cacheAge = Date.now() - this.lastRefresh.getTime()
    return cacheAge > 5 * 60 * 1000 // 5 minutes
  }
}
```

### Batch Processing

**Efficient batch rule execution** for multiple entities:

```typescript
async executeRulesForBatch(entities: Array<{entity: string, context: RuleContext}>): Promise<BatchResult> {
  const results: RuleExecutionResult[] = []
  const promises = entities.map(({entity, context}) => 
    this.executeRules(entity, context)
  )
  
  const batchResults = await Promise.all(promises)
  return { results: batchResults, totalProcessed: entities.length }
}
```

## Monitoring and Analytics

### Execution Tracking

**Comprehensive execution logging** provides insights into rule performance:

```typescript
interface RuleExecution {
  ruleId: string
  ruleName: string
  entity: string
  entityId: string
  userId: string
  timestamp: Date
  success: boolean
  executionTime: number
  error?: string
}
```

### Performance Metrics

**Real-time performance monitoring** identifies optimization opportunities:

```typescript
getRulePerformanceMetrics(timeframe: string): Promise<RuleMetrics> {
  return {
    totalExecutions: 1500,
    successRate: 98.5,
    averageExecutionTime: 45,
    topPerformingRules: [
      { ruleId: 'lead_scoring', executions: 450, successRate: 99.2 },
      { ruleId: 'opportunity_progression', executions: 320, successRate: 97.8 }
    ]
  }
}
```

---

**Next Steps**: Learn about [Workflow Automation](workflow_automation.md) to see how rules integrate with automated processes.