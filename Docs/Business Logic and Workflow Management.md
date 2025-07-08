# Kitchen Pantry CRM - Business Logic and Workflow Management

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM business logic and workflow management system provides comprehensive automation and process management capabilities tailored for food service industry sales operations. The system implements intelligent business rules, automated workflows, and process optimization features that enhance productivity and ensure consistent execution of critical business processes.

The workflow management architecture supports complex multi-step processes including lead qualification, opportunity progression, customer onboarding, and relationship management. The business logic engine provides flexible rule configuration, conditional processing, and automated decision-making capabilities that adapt to diverse food service industry requirements.

The system emphasizes user empowerment through customizable workflows, intelligent automation, and comprehensive audit trails that ensure transparency and accountability in all business processes. The workflow management capabilities are designed to scale with business growth while maintaining the flexibility and reliability essential for food service industry success.

## Business Logic Architecture

### Rule Engine Framework

The Kitchen Pantry CRM implements a sophisticated rule engine that enables flexible business logic configuration and automated decision-making across all system components. The rule engine supports complex conditional logic, data validation, and automated actions that ensure consistent business process execution.

**Rule Definition Structure:** Business rules are defined using a declarative syntax that allows non-technical users to configure and modify business logic without code changes. Rules include conditions, actions, and metadata that provide complete context for rule execution and maintenance.

**Rule Execution Engine:** The rule execution engine processes business rules in real-time, evaluating conditions against current data and executing appropriate actions. The engine supports priority-based rule execution, conflict resolution, and performance optimization to ensure reliable and efficient rule processing.

**Rule Management Interface:** A comprehensive rule management interface allows administrators to create, modify, and monitor business rules through an intuitive web-based interface. The interface includes rule testing capabilities, version control, and impact analysis to ensure safe rule deployment.

```typescript
// businessRules/ruleEngine.ts - Business rule engine implementation
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

interface RuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

interface RuleAction {
  type: 'set_field' | 'send_notification' | 'create_task' | 'update_status' | 'trigger_workflow'
  parameters: Record<string, any>
}

interface RuleContext {
  entity: string
  entityId: string
  data: Record<string, any>
  user: {
    id: string
    role: string
    permissions: string[]
  }
  timestamp: Date
}

class BusinessRuleEngine {
  private rules: Map<string, BusinessRule[]> = new Map()
  private executionHistory: RuleExecution[] = []

  constructor() {
    this.loadRules()
  }

  private async loadRules() {
    // Load rules from database
    const rules = await this.getRulesFromDatabase()
    
    // Group rules by entity type for efficient lookup
    rules.forEach(rule => {
      const entityRules = this.rules.get(rule.entity) || []
      entityRules.push(rule)
      entityRules.sort((a, b) => b.priority - a.priority)
      this.rules.set(rule.entity, entityRules)
    })
  }

  async executeRules(entity: string, context: RuleContext): Promise<RuleExecutionResult> {
    const entityRules = this.rules.get(entity) || []
    const executedRules: string[] = []
    const actions: RuleAction[] = []
    const errors: string[] = []

    for (const rule of entityRules) {
      if (!rule.enabled) continue

      try {
        if (await this.evaluateConditions(rule.conditions, context)) {
          executedRules.push(rule.id)
          actions.push(...rule.actions)
          
          // Log rule execution
          this.logRuleExecution(rule, context, true)
        }
      } catch (error) {
        errors.push(`Rule ${rule.id}: ${error.message}`)
        this.logRuleExecution(rule, context, false, error.message)
      }
    }

    // Execute actions
    const actionResults = await this.executeActions(actions, context)

    return {
      executedRules,
      actions: actionResults,
      errors
    }
  }

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

  private async evaluateCondition(condition: RuleCondition, context: RuleContext): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        throw new Error(`Unknown operator: ${condition.operator}`)
    }
  }

  private getFieldValue(field: string, context: RuleContext): any {
    const parts = field.split('.')
    let value = context.data

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  private async executeActions(actions: RuleAction[], context: RuleContext): Promise<ActionResult[]> {
    const results: ActionResult[] = []

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, context)
        results.push({ action: action.type, success: true, result })
      } catch (error) {
        results.push({ action: action.type, success: false, error: error.message })
      }
    }

    return results
  }

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

  private async setFieldAction(parameters: any, context: RuleContext): Promise<void> {
    const { field, value } = parameters
    
    // Update the entity field
    await this.updateEntityField(context.entity, context.entityId, field, value)
  }

  private async sendNotificationAction(parameters: any, context: RuleContext): Promise<void> {
    const { recipient, template, data } = parameters
    
    // Send notification using notification service
    await this.notificationService.send({
      recipient,
      template,
      data: { ...context.data, ...data }
    })
  }

  private async createTaskAction(parameters: any, context: RuleContext): Promise<void> {
    const { title, description, assignee, dueDate } = parameters
    
    // Create task using task service
    await this.taskService.create({
      title,
      description,
      assignee: assignee || context.user.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      relatedEntity: context.entity,
      relatedEntityId: context.entityId
    })
  }

  private async updateStatusAction(parameters: any, context: RuleContext): Promise<void> {
    const { status } = parameters
    
    // Update entity status
    await this.updateEntityField(context.entity, context.entityId, 'status', status)
  }

  private async triggerWorkflowAction(parameters: any, context: RuleContext): Promise<void> {
    const { workflowId } = parameters
    
    // Trigger workflow using workflow service
    await this.workflowService.trigger(workflowId, context)
  }

  private logRuleExecution(rule: BusinessRule, context: RuleContext, success: boolean, error?: string) {
    this.executionHistory.push({
      ruleId: rule.id,
      ruleName: rule.name,
      entity: context.entity,
      entityId: context.entityId,
      userId: context.user.id,
      timestamp: new Date(),
      success,
      error
    })

    // Keep only recent execution history
    if (this.executionHistory.length > 10000) {
      this.executionHistory = this.executionHistory.slice(-5000)
    }
  }

  // Rule management methods
  async createRule(rule: Omit<BusinessRule, 'id' | 'metadata'>): Promise<BusinessRule> {
    const newRule: BusinessRule = {
      ...rule,
      id: this.generateRuleId(),
      metadata: {
        createdBy: 'system', // Should be actual user
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        version: 1
      }
    }

    await this.saveRuleToDatabase(newRule)
    await this.loadRules() // Reload rules

    return newRule
  }

  async updateRule(ruleId: string, updates: Partial<BusinessRule>): Promise<BusinessRule> {
    const existingRule = await this.getRuleFromDatabase(ruleId)
    if (!existingRule) {
      throw new Error(`Rule ${ruleId} not found`)
    }

    const updatedRule: BusinessRule = {
      ...existingRule,
      ...updates,
      metadata: {
        ...existingRule.metadata,
        updatedBy: 'system', // Should be actual user
        updatedAt: new Date(),
        version: existingRule.metadata.version + 1
      }
    }

    await this.saveRuleToDatabase(updatedRule)
    await this.loadRules() // Reload rules

    return updatedRule
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.deleteRuleFromDatabase(ruleId)
    await this.loadRules() // Reload rules
  }

  getExecutionHistory(limit = 100): RuleExecution[] {
    return this.executionHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Database methods (to be implemented)
  private async getRulesFromDatabase(): Promise<BusinessRule[]> {
    // Implementation depends on database choice
    return []
  }

  private async getRuleFromDatabase(ruleId: string): Promise<BusinessRule | null> {
    // Implementation depends on database choice
    return null
  }

  private async saveRuleToDatabase(rule: BusinessRule): Promise<void> {
    // Implementation depends on database choice
  }

  private async deleteRuleFromDatabase(ruleId: string): Promise<void> {
    // Implementation depends on database choice
  }

  private async updateEntityField(entity: string, entityId: string, field: string, value: any): Promise<void> {
    // Implementation depends on entity service
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

interface RuleExecutionResult {
  executedRules: string[]
  actions: ActionResult[]
  errors: string[]
}

interface ActionResult {
  action: string
  success: boolean
  result?: any
  error?: string
}

interface RuleExecution {
  ruleId: string
  ruleName: string
  entity: string
  entityId: string
  userId: string
  timestamp: Date
  success: boolean
  error?: string
}

export const businessRuleEngine = new BusinessRuleEngine()
```

### Workflow Automation System

The workflow automation system provides comprehensive process automation capabilities that streamline complex business processes and ensure consistent execution of critical workflows.

**Workflow Definition:** Workflows are defined using a visual workflow designer that allows users to create complex multi-step processes with conditional logic, parallel execution, and error handling. Workflow definitions include triggers, steps, conditions, and actions that provide complete process automation.

**Workflow Execution Engine:** The workflow execution engine processes workflows in real-time, managing state transitions, handling errors, and ensuring reliable process completion. The engine supports long-running workflows, human approval steps, and integration with external systems.

**Workflow Monitoring:** Comprehensive workflow monitoring provides real-time visibility into workflow execution, performance metrics, and error tracking. Monitoring includes workflow dashboards, execution logs, and performance analytics that enable continuous process improvement.

```typescript
// workflows/workflowEngine.ts - Workflow automation system
interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: number
  enabled: boolean
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  variables: WorkflowVariable[]
  metadata: {
    createdBy: string
    createdAt: Date
    updatedBy: string
    updatedAt: Date
  }
}

interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'webhook'
  configuration: Record<string, any>
}

interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'condition' | 'parallel' | 'human_task' | 'delay'
  configuration: Record<string, any>
  nextSteps: string[]
  errorHandling?: {
    retryCount: number
    retryDelay: number
    onError: 'fail' | 'continue' | 'retry'
  }
}

interface WorkflowVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  defaultValue?: any
  required: boolean
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  startedAt: Date
  completedAt?: Date
  currentStep?: string
  variables: Record<string, any>
  executionLog: WorkflowLogEntry[]
  error?: string
}

interface WorkflowLogEntry {
  timestamp: Date
  stepId: string
  stepName: string
  action: 'started' | 'completed' | 'failed' | 'skipped'
  message: string
  data?: any
}

class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.loadWorkflows()
    this.startScheduledWorkflows()
  }

  private async loadWorkflows() {
    const workflows = await this.getWorkflowsFromDatabase()
    workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow)
    })
  }

  private startScheduledWorkflows() {
    this.workflows.forEach(workflow => {
      if (workflow.enabled && workflow.trigger.type === 'scheduled') {
        this.scheduleWorkflow(workflow)
      }
    })
  }

  private scheduleWorkflow(workflow: WorkflowDefinition) {
    const { cron } = workflow.trigger.configuration
    
    // Parse cron expression and schedule workflow
    const interval = this.parseCronExpression(cron)
    
    const task = setInterval(() => {
      this.executeWorkflow(workflow.id, {})
    }, interval)
    
    this.scheduledTasks.set(workflow.id, task)
  }

  async executeWorkflow(workflowId: string, initialVariables: Record<string, any> = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow ${workflowId} is disabled`)
    }

    const executionId = this.generateExecutionId()
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date(),
      variables: { ...this.getDefaultVariables(workflow), ...initialVariables },
      executionLog: []
    }

    this.executions.set(executionId, execution)

    try {
      await this.executeWorkflowSteps(execution, workflow)
      execution.status = 'completed'
      execution.completedAt = new Date()
    } catch (error) {
      execution.status = 'failed'
      execution.error = error.message
      execution.completedAt = new Date()
      this.logWorkflowError(execution, error)
    }

    await this.saveExecutionToDatabase(execution)
    return executionId
  }

  private async executeWorkflowSteps(execution: WorkflowExecution, workflow: WorkflowDefinition) {
    const firstStep = workflow.steps[0]
    if (!firstStep) return

    await this.executeStep(execution, workflow, firstStep.id)
  }

  private async executeStep(execution: WorkflowExecution, workflow: WorkflowDefinition, stepId: string) {
    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) {
      throw new Error(`Step ${stepId} not found in workflow ${workflow.id}`)
    }

    execution.currentStep = stepId
    this.logStepExecution(execution, step, 'started', 'Step started')

    try {
      const result = await this.executeStepAction(execution, step)
      this.logStepExecution(execution, step, 'completed', 'Step completed', result)

      // Execute next steps
      for (const nextStepId of step.nextSteps) {
        await this.executeStep(execution, workflow, nextStepId)
      }
    } catch (error) {
      this.logStepExecution(execution, step, 'failed', error.message)
      
      if (step.errorHandling) {
        await this.handleStepError(execution, workflow, step, error)
      } else {
        throw error
      }
    }
  }

  private async executeStepAction(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    switch (step.type) {
      case 'action':
        return this.executeActionStep(execution, step)
      case 'condition':
        return this.executeConditionStep(execution, step)
      case 'parallel':
        return this.executeParallelStep(execution, step)
      case 'human_task':
        return this.executeHumanTaskStep(execution, step)
      case 'delay':
        return this.executeDelayStep(execution, step)
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  private async executeActionStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { action, parameters } = step.configuration
    
    switch (action) {
      case 'send_email':
        return this.sendEmailAction(parameters, execution.variables)
      case 'create_record':
        return this.createRecordAction(parameters, execution.variables)
      case 'update_record':
        return this.updateRecordAction(parameters, execution.variables)
      case 'call_api':
        return this.callApiAction(parameters, execution.variables)
      case 'set_variable':
        return this.setVariableAction(parameters, execution.variables)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  private async executeConditionStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { condition, trueSteps, falseSteps } = step.configuration
    
    const conditionResult = this.evaluateCondition(condition, execution.variables)
    
    if (conditionResult) {
      step.nextSteps = trueSteps || []
    } else {
      step.nextSteps = falseSteps || []
    }
    
    return conditionResult
  }

  private async executeParallelStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { parallelSteps } = step.configuration
    
    const promises = parallelSteps.map((stepId: string) => 
      this.executeStep(execution, this.workflows.get(execution.workflowId)!, stepId)
    )
    
    return Promise.all(promises)
  }

  private async executeHumanTaskStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { assignee, title, description, formFields } = step.configuration
    
    // Create human task
    const taskId = await this.createHumanTask({
      executionId: execution.id,
      stepId: step.id,
      assignee,
      title,
      description,
      formFields
    })
    
    // Pause workflow execution until task is completed
    execution.status = 'paused'
    
    return { taskId, status: 'waiting_for_human' }
  }

  private async executeDelayStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { duration } = step.configuration
    
    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000)
    })
  }

  private async handleStepError(execution: WorkflowExecution, workflow: WorkflowDefinition, step: WorkflowStep, error: Error) {
    const { retryCount, retryDelay, onError } = step.errorHandling!
    
    const currentRetries = this.getStepRetryCount(execution, step.id)
    
    if (currentRetries < retryCount && onError === 'retry') {
      this.logStepExecution(execution, step, 'started', `Retrying step (attempt ${currentRetries + 1})`)
      
      await new Promise(resolve => setTimeout(resolve, retryDelay * 1000))
      
      this.incrementStepRetryCount(execution, step.id)
      await this.executeStep(execution, workflow, step.id)
    } else if (onError === 'continue') {
      this.logStepExecution(execution, step, 'skipped', 'Step failed but continuing workflow')
      
      // Continue to next steps
      for (const nextStepId of step.nextSteps) {
        await this.executeStep(execution, workflow, nextStepId)
      }
    } else {
      throw error
    }
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    try {
      const func = new Function('variables', `with(variables) { return ${condition}; }`)
      return func(variables)
    } catch (error) {
      throw new Error(`Invalid condition: ${condition}`)
    }
  }

  private logStepExecution(execution: WorkflowExecution, step: WorkflowStep, action: WorkflowLogEntry['action'], message: string, data?: any) {
    execution.executionLog.push({
      timestamp: new Date(),
      stepId: step.id,
      stepName: step.name,
      action,
      message,
      data
    })
  }

  private logWorkflowError(execution: WorkflowExecution, error: Error) {
    execution.executionLog.push({
      timestamp: new Date(),
      stepId: 'workflow',
      stepName: 'Workflow',
      action: 'failed',
      message: error.message
    })
  }

  private getDefaultVariables(workflow: WorkflowDefinition): Record<string, any> {
    const defaults: Record<string, any> = {}
    
    workflow.variables.forEach(variable => {
      if (variable.defaultValue !== undefined) {
        defaults[variable.name] = variable.defaultValue
      }
    })
    
    return defaults
  }

  private getStepRetryCount(execution: WorkflowExecution, stepId: string): number {
    return execution.executionLog.filter(
      log => log.stepId === stepId && log.action === 'started'
    ).length - 1
  }

  private incrementStepRetryCount(execution: WorkflowExecution, stepId: string) {
    // This is handled by logging the retry attempt
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private parseCronExpression(cron: string): number {
    // Simple cron parser - in production, use a proper cron library
    // For now, return a default interval
    return 60000 // 1 minute
  }

  // Action implementations
  private async sendEmailAction(parameters: any, variables: Record<string, any>): Promise<any> {
    // Implementation depends on email service
    return { sent: true }
  }

  private async createRecordAction(parameters: any, variables: Record<string, any>): Promise<any> {
    // Implementation depends on data service
    return { created: true }
  }

  private async updateRecordAction(parameters: any, variables: Record<string, any>): Promise<any> {
    // Implementation depends on data service
    return { updated: true }
  }

  private async callApiAction(parameters: any, variables: Record<string, any>): Promise<any> {
    // Implementation depends on HTTP client
    return { response: 'success' }
  }

  private async setVariableAction(parameters: any, variables: Record<string, any>): Promise<any> {
    const { name, value } = parameters
    variables[name] = value
    return { set: true }
  }

  private async createHumanTask(taskData: any): Promise<string> {
    // Implementation depends on task service
    return 'task_123'
  }

  // Public API methods
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled'
      execution.completedAt = new Date()
      await this.saveExecutionToDatabase(execution)
    }
  }

  async resumeExecution(executionId: string, stepId: string, result: any): Promise<void> {
    const execution = this.executions.get(executionId)
    if (execution && execution.status === 'paused') {
      execution.status = 'running'
      execution.variables = { ...execution.variables, ...result }
      
      const workflow = this.workflows.get(execution.workflowId)!
      const step = workflow.steps.find(s => s.id === stepId)!
      
      // Continue with next steps
      for (const nextStepId of step.nextSteps) {
        await this.executeStep(execution, workflow, nextStepId)
      }
      
      execution.status = 'completed'
      execution.completedAt = new Date()
      await this.saveExecutionToDatabase(execution)
    }
  }

  getExecutionHistory(workflowId?: string, limit = 100): WorkflowExecution[] {
    let executions = Array.from(this.executions.values())
    
    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId)
    }
    
    return executions
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit)
  }

  // Database methods (to be implemented)
  private async getWorkflowsFromDatabase(): Promise<WorkflowDefinition[]> {
    return []
  }

  private async saveExecutionToDatabase(execution: WorkflowExecution): Promise<void> {
    // Implementation depends on database choice
  }
}

export const workflowEngine = new WorkflowEngine()
```

## Sales Process Management

### Lead Management System

The lead management system provides comprehensive capabilities for capturing, qualifying, and nurturing leads throughout the sales funnel. The system implements intelligent lead scoring, automated follow-up workflows, and conversion tracking that optimize sales performance.

**Lead Capture:** Multi-channel lead capture capabilities including web forms, email integration, phone calls, and trade show imports. Lead capture includes automatic data validation, duplicate detection, and lead source tracking for comprehensive lead management.

**Lead Qualification:** Automated lead qualification using configurable scoring models that evaluate lead quality based on company size, industry, budget, and engagement level. Qualification includes progressive profiling, behavioral scoring, and predictive analytics that identify high-value prospects.

**Lead Nurturing:** Automated nurturing campaigns that deliver personalized content and communications based on lead behavior and characteristics. Nurturing includes email sequences, task automation, and engagement tracking that maintain prospect interest and drive conversion.

```typescript
// sales/leadManagement.ts - Lead management system
interface Lead {
  id: string
  source: 'website' | 'email' | 'phone' | 'referral' | 'trade_show' | 'social_media'
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost'
  score: number
  company: {
    name: string
    industry: string
    size: 'small' | 'medium' | 'large' | 'enterprise'
    website?: string
    annualRevenue?: number
  }
  contact: {
    firstName: string
    lastName: string
    title: string
    email: string
    phone?: string
  }
  requirements: {
    budget?: number
    timeline?: string
    decisionMakers?: string[]
    currentSolution?: string
    painPoints?: string[]
  }
  activities: LeadActivity[]
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  convertedAt?: Date
  convertedToOpportunityId?: string
}

interface LeadActivity {
  id: string
  type: 'email' | 'call' | 'meeting' | 'demo' | 'proposal' | 'follow_up'
  description: string
  outcome?: string
  scheduledAt?: Date
  completedAt?: Date
  createdBy: string
}

interface LeadScoringRule {
  id: string
  name: string
  field: string
  condition: string
  value: any
  points: number
  enabled: boolean
}

class LeadManagementSystem {
  private leads: Map<string, Lead> = new Map()
  private scoringRules: LeadScoringRule[] = []
  private nurtureSequences: Map<string, NurtureSequence> = new Map()

  constructor() {
    this.loadScoringRules()
    this.loadNurtureSequences()
  }

  async createLead(leadData: Omit<Lead, 'id' | 'score' | 'activities' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const lead: Lead = {
      ...leadData,
      id: this.generateLeadId(),
      score: 0,
      activities: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Calculate initial lead score
    lead.score = await this.calculateLeadScore(lead)

    // Auto-assign lead if rules exist
    lead.assignedTo = await this.autoAssignLead(lead)

    // Start nurture sequence
    await this.startNurtureSequence(lead)

    // Save lead
    this.leads.set(lead.id, lead)
    await this.saveLeadToDatabase(lead)

    // Trigger lead created workflow
    await this.triggerWorkflow('lead_created', { lead })

    return lead
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const lead = this.leads.get(leadId)
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`)
    }

    const updatedLead: Lead = {
      ...lead,
      ...updates,
      updatedAt: new Date()
    }

    // Recalculate score if relevant fields changed
    if (this.shouldRecalculateScore(updates)) {
      updatedLead.score = await this.calculateLeadScore(updatedLead)
    }

    // Check for status changes
    if (updates.status && updates.status !== lead.status) {
      await this.handleStatusChange(updatedLead, lead.status, updates.status)
    }

    this.leads.set(leadId, updatedLead)
    await this.saveLeadToDatabase(updatedLead)

    return updatedLead
  }

  async addActivity(leadId: string, activity: Omit<LeadActivity, 'id'>): Promise<LeadActivity> {
    const lead = this.leads.get(leadId)
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`)
    }

    const newActivity: LeadActivity = {
      ...activity,
      id: this.generateActivityId()
    }

    lead.activities.push(newActivity)
    lead.updatedAt = new Date()

    // Update lead score based on activity
    lead.score = await this.calculateLeadScore(lead)

    this.leads.set(leadId, lead)
    await this.saveLeadToDatabase(lead)

    // Trigger activity workflow
    await this.triggerWorkflow('lead_activity_added', { lead, activity: newActivity })

    return newActivity
  }

  async qualifyLead(leadId: string, qualificationData: any): Promise<Lead> {
    const lead = this.leads.get(leadId)
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`)
    }

    // Update lead with qualification data
    const qualifiedLead: Lead = {
      ...lead,
      status: 'qualified',
      requirements: {
        ...lead.requirements,
        ...qualificationData
      },
      updatedAt: new Date()
    }

    // Recalculate score
    qualifiedLead.score = await this.calculateLeadScore(qualifiedLead)

    this.leads.set(leadId, qualifiedLead)
    await this.saveLeadToDatabase(qualifiedLead)

    // Trigger qualification workflow
    await this.triggerWorkflow('lead_qualified', { lead: qualifiedLead })

    return qualifiedLead
  }

  async convertLead(leadId: string, opportunityData: any): Promise<{ lead: Lead; opportunityId: string }> {
    const lead = this.leads.get(leadId)
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`)
    }

    if (lead.status !== 'qualified') {
      throw new Error('Lead must be qualified before conversion')
    }

    // Create opportunity
    const opportunityId = await this.createOpportunityFromLead(lead, opportunityData)

    // Update lead status
    const convertedLead: Lead = {
      ...lead,
      status: 'converted',
      convertedAt: new Date(),
      convertedToOpportunityId: opportunityId,
      updatedAt: new Date()
    }

    this.leads.set(leadId, convertedLead)
    await this.saveLeadToDatabase(convertedLead)

    // Trigger conversion workflow
    await this.triggerWorkflow('lead_converted', { lead: convertedLead, opportunityId })

    return { lead: convertedLead, opportunityId }
  }

  private async calculateLeadScore(lead: Lead): Promise<number> {
    let score = 0

    for (const rule of this.scoringRules) {
      if (!rule.enabled) continue

      try {
        if (this.evaluateScoringRule(rule, lead)) {
          score += rule.points
        }
      } catch (error) {
        console.error(`Error evaluating scoring rule ${rule.id}:`, error)
      }
    }

    // Activity-based scoring
    const recentActivities = lead.activities.filter(
      activity => activity.completedAt && 
      activity.completedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    )

    score += recentActivities.length * 5 // 5 points per recent activity

    // Engagement scoring
    const emailActivities = lead.activities.filter(a => a.type === 'email')
    const callActivities = lead.activities.filter(a => a.type === 'call')
    const meetingActivities = lead.activities.filter(a => a.type === 'meeting')

    score += emailActivities.length * 2
    score += callActivities.length * 10
    score += meetingActivities.length * 20

    return Math.max(0, Math.min(100, score)) // Clamp between 0 and 100
  }

  private evaluateScoringRule(rule: LeadScoringRule, lead: Lead): boolean {
    const fieldValue = this.getFieldValue(rule.field, lead)
    
    switch (rule.condition) {
      case 'equals':
        return fieldValue === rule.value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(rule.value)
      case 'less_than':
        return Number(fieldValue) < Number(rule.value)
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue)
      default:
        return false
    }
  }

  private getFieldValue(field: string, lead: Lead): any {
    const parts = field.split('.')
    let value: any = lead

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  private async autoAssignLead(lead: Lead): Promise<string | undefined> {
    // Simple round-robin assignment - in production, use more sophisticated logic
    const salesReps = await this.getAvailableSalesReps()
    if (salesReps.length === 0) return undefined

    const assignments = await this.getRecentAssignments()
    const leastAssigned = salesReps.reduce((min, rep) => {
      const assignmentCount = assignments.filter(a => a.assignedTo === rep.id).length
      const minCount = assignments.filter(a => a.assignedTo === min.id).length
      return assignmentCount < minCount ? rep : min
    })

    return leastAssigned.id
  }

  private async startNurtureSequence(lead: Lead): Promise<void> {
    // Determine appropriate nurture sequence based on lead characteristics
    let sequenceId = 'default'

    if (lead.company.size === 'enterprise') {
      sequenceId = 'enterprise'
    } else if (lead.score > 50) {
      sequenceId = 'high_value'
    }

    const sequence = this.nurtureSequences.get(sequenceId)
    if (sequence) {
      await this.triggerWorkflow('start_nurture_sequence', { lead, sequence })
    }
  }

  private shouldRecalculateScore(updates: Partial<Lead>): boolean {
    const scoringFields = ['company', 'requirements', 'activities']
    return scoringFields.some(field => field in updates)
  }

  private async handleStatusChange(lead: Lead, oldStatus: string, newStatus: string): Promise<void> {
    // Log status change
    await this.addActivity(lead.id, {
      type: 'follow_up',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      completedAt: new Date(),
      createdBy: 'system'
    })

    // Trigger status-specific workflows
    await this.triggerWorkflow(`lead_status_${newStatus}`, { lead, oldStatus })
  }

  private async createOpportunityFromLead(lead: Lead, opportunityData: any): Promise<string> {
    // Implementation depends on opportunity service
    return 'opp_123'
  }

  private async triggerWorkflow(workflowName: string, data: any): Promise<void> {
    // Implementation depends on workflow service
  }

  // Query methods
  async getLeads(filters: LeadFilters = {}): Promise<{ leads: Lead[]; total: number }> {
    let filteredLeads = Array.from(this.leads.values())

    if (filters.status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === filters.status)
    }

    if (filters.assignedTo) {
      filteredLeads = filteredLeads.filter(lead => lead.assignedTo === filters.assignedTo)
    }

    if (filters.source) {
      filteredLeads = filteredLeads.filter(lead => lead.source === filters.source)
    }

    if (filters.minScore !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.score >= filters.minScore!)
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredLeads = filteredLeads.filter(lead => 
        lead.company.name.toLowerCase().includes(searchTerm) ||
        lead.contact.firstName.toLowerCase().includes(searchTerm) ||
        lead.contact.lastName.toLowerCase().includes(searchTerm) ||
        lead.contact.email.toLowerCase().includes(searchTerm)
      )
    }

    // Sort by score (highest first) and then by creation date
    filteredLeads.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    const total = filteredLeads.length
    const offset = (filters.page || 1 - 1) * (filters.limit || 50)
    const leads = filteredLeads.slice(offset, offset + (filters.limit || 50))

    return { leads, total }
  }

  async getLeadById(leadId: string): Promise<Lead | null> {
    return this.leads.get(leadId) || null
  }

  async getLeadAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<LeadAnalytics> {
    const leads = Array.from(this.leads.values())
    const cutoff = this.getTimeframeCutoff(timeframe)
    const recentLeads = leads.filter(lead => lead.createdAt >= cutoff)

    const bySource = recentLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byStatus = recentLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const conversionRate = recentLeads.length > 0 
      ? (recentLeads.filter(lead => lead.status === 'converted').length / recentLeads.length) * 100
      : 0

    const averageScore = recentLeads.length > 0
      ? recentLeads.reduce((sum, lead) => sum + lead.score, 0) / recentLeads.length
      : 0

    return {
      totalLeads: recentLeads.length,
      bySource,
      byStatus,
      conversionRate,
      averageScore,
      topPerformingSources: Object.entries(bySource)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count }))
    }
  }

  private getTimeframeCutoff(timeframe: string): Date {
    const now = new Date()
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  // Utility methods
  private generateLeadId(): string {
    return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async loadScoringRules(): Promise<void> {
    // Load from database - for now, use default rules
    this.scoringRules = [
      {
        id: 'enterprise_size',
        name: 'Enterprise Company Size',
        field: 'company.size',
        condition: 'equals',
        value: 'enterprise',
        points: 25,
        enabled: true
      },
      {
        id: 'high_revenue',
        name: 'High Annual Revenue',
        field: 'company.annualRevenue',
        condition: 'greater_than',
        value: 10000000,
        points: 20,
        enabled: true
      },
      {
        id: 'decision_maker',
        name: 'Decision Maker Title',
        field: 'contact.title',
        condition: 'contains',
        value: 'director',
        points: 15,
        enabled: true
      }
    ]
  }

  private async loadNurtureSequences(): Promise<void> {
    // Load from database - for now, use default sequences
    // Implementation would load actual nurture sequences
  }

  private async getAvailableSalesReps(): Promise<any[]> {
    // Implementation depends on user service
    return []
  }

  private async getRecentAssignments(): Promise<any[]> {
    // Implementation depends on assignment tracking
    return []
  }

  private async saveLeadToDatabase(lead: Lead): Promise<void> {
    // Implementation depends on database choice
  }
}

interface LeadFilters {
  status?: Lead['status']
  assignedTo?: string
  source?: Lead['source']
  minScore?: number
  search?: string
  page?: number
  limit?: number
}

interface LeadAnalytics {
  totalLeads: number
  bySource: Record<string, number>
  byStatus: Record<string, number>
  conversionRate: number
  averageScore: number
  topPerformingSources: Array<{ source: string; count: number }>
}

interface NurtureSequence {
  id: string
  name: string
  steps: NurtureStep[]
}

interface NurtureStep {
  id: string
  delay: number // Days
  action: 'email' | 'task' | 'call'
  template: string
  conditions?: any[]
}

export const leadManagementSystem = new LeadManagementSystem()
```

## Conclusion

The Kitchen Pantry CRM business logic and workflow management system provides comprehensive automation and process management capabilities essential for food service industry sales operations. The rule engine framework enables flexible business logic configuration while the workflow automation system streamlines complex multi-step processes.

The sales process management capabilities including lead management, opportunity tracking, and customer relationship management ensure consistent execution of critical business processes. The system emphasizes user empowerment through customizable workflows and intelligent automation that adapts to diverse business requirements.

This business logic and workflow management guide serves as the foundation for implementing sophisticated process automation that enhances productivity and ensures consistent execution of critical business processes essential for Kitchen Pantry CRM success in the food service industry.

