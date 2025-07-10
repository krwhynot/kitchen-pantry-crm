# Lead Management System

**The Kitchen Pantry CRM lead management system** provides comprehensive capabilities for capturing, qualifying, and nurturing leads throughout the sales funnel. This system implements intelligent lead scoring, automated follow-up workflows, and conversion tracking to optimize sales performance.

## Core Architecture

### Lead Data Structure

**Comprehensive lead tracking** captures all essential information for food service industry prospects:

```typescript
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
```

### Lead Activity Tracking

**Detailed activity logging** maintains complete interaction history:

```typescript
interface LeadActivity {
  id: string
  type: 'email' | 'call' | 'meeting' | 'demo' | 'proposal' | 'follow_up'
  description: string
  outcome?: string
  scheduledAt?: Date
  completedAt?: Date
  createdBy: string
}
```

## Lead Capture System

### Multi-Channel Capture

**Automated lead capture** from multiple touchpoints with validation and deduplication:

```typescript
class LeadManagementSystem {
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

    // Auto-assign lead based on rules
    lead.assignedTo = await this.autoAssignLead(lead)

    // Start nurture sequence
    await this.startNurtureSequence(lead)

    // Save and trigger workflows
    this.leads.set(lead.id, lead)
    await this.saveLeadToDatabase(lead)
    await this.triggerWorkflow('lead_created', { lead })

    return lead
  }
}
```

### Duplicate Detection

**Intelligent duplicate prevention** based on multiple matching criteria:

```typescript
async checkForDuplicates(newLead: Partial<Lead>): Promise<Lead[]> {
  const existingLeads = Array.from(this.leads.values())
  const duplicates: Lead[] = []

  for (const lead of existingLeads) {
    let matchScore = 0

    // Email match (highest priority)
    if (newLead.contact?.email === lead.contact.email) {
      matchScore += 100
    }

    // Phone match
    if (newLead.contact?.phone === lead.contact.phone) {
      matchScore += 50
    }

    // Company and name match
    if (newLead.company?.name === lead.company.name && 
        newLead.contact?.firstName === lead.contact.firstName &&
        newLead.contact?.lastName === lead.contact.lastName) {
      matchScore += 75
    }

    // Consider it a duplicate if match score > 80
    if (matchScore > 80) {
      duplicates.push(lead)
    }
  }

  return duplicates
}
```

## Lead Scoring Engine

### Configurable Scoring Rules

**Flexible scoring system** evaluates lead quality based on multiple criteria:

```typescript
interface LeadScoringRule {
  id: string
  name: string
  field: string
  condition: string
  value: any
  points: number
  enabled: boolean
}

private async calculateLeadScore(lead: Lead): Promise<number> {
  let score = 0

  // Apply configured scoring rules
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
```

### Industry-Specific Scoring

**Food service industry scoring** considers relevant business factors:

```typescript
private async loadScoringRules(): Promise<void> {
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
    },
    {
      id: 'restaurant_industry',
      name: 'Restaurant Industry',
      field: 'company.industry',
      condition: 'equals',
      value: 'restaurant',
      points: 10,
      enabled: true
    },
    {
      id: 'catering_industry',
      name: 'Catering Industry',
      field: 'company.industry',
      condition: 'equals',
      value: 'catering',
      points: 12,
      enabled: true
    }
  ]
}
```

## Lead Qualification System

### Progressive Qualification

**Multi-stage qualification process** captures detailed requirements:

```typescript
async qualifyLead(leadId: string, qualificationData: any): Promise<Lead> {
  const lead = this.leads.get(leadId)
  if (!lead) throw new Error(`Lead ${leadId} not found`)

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

  // Recalculate score with new qualification data
  qualifiedLead.score = await this.calculateLeadScore(qualifiedLead)

  this.leads.set(leadId, qualifiedLead)
  await this.saveLeadToDatabase(qualifiedLead)

  // Trigger qualification workflow
  await this.triggerWorkflow('lead_qualified', { lead: qualifiedLead })

  return qualifiedLead
}
```

### BANT Qualification

**Budget, Authority, Need, Timeline** qualification for food service industry:

```typescript
interface BANTQualification {
  budget: {
    confirmed: boolean
    amount?: number
    timeframe?: string
  }
  authority: {
    isDecisionMaker: boolean
    decisionMakers?: string[]
    approvalProcess?: string
  }
  need: {
    currentSolution?: string
    painPoints: string[]
    requirements: string[]
  }
  timeline: {
    urgency: 'immediate' | 'within_month' | 'within_quarter' | 'future'
    implementationDate?: Date
    factors: string[]
  }
}

async performBANTQualification(leadId: string, bant: BANTQualification): Promise<Lead> {
  const lead = this.leads.get(leadId)
  if (!lead) throw new Error(`Lead ${leadId} not found`)

  // Calculate BANT score
  let bantScore = 0
  if (bant.budget.confirmed) bantScore += 25
  if (bant.authority.isDecisionMaker) bantScore += 25
  if (bant.need.painPoints.length > 0) bantScore += 25
  if (bant.timeline.urgency === 'immediate' || bant.timeline.urgency === 'within_month') bantScore += 25

  // Update lead with BANT data
  const qualifiedLead: Lead = {
    ...lead,
    status: bantScore >= 75 ? 'qualified' : 'unqualified',
    requirements: {
      ...lead.requirements,
      budget: bant.budget.amount,
      timeline: bant.timeline.implementationDate?.toISOString(),
      decisionMakers: bant.authority.decisionMakers,
      currentSolution: bant.need.currentSolution,
      painPoints: bant.need.painPoints
    },
    updatedAt: new Date()
  }

  // Add BANT qualification activity
  await this.addActivity(leadId, {
    type: 'follow_up',
    description: `BANT qualification completed - Score: ${bantScore}`,
    outcome: qualifiedLead.status,
    completedAt: new Date(),
    createdBy: 'system'
  })

  return qualifiedLead
}
```

## Lead Nurturing System

### Automated Nurture Sequences

**Personalized nurturing campaigns** based on lead characteristics and behavior:

```typescript
interface NurtureSequence {
  id: string
  name: string
  triggers: string[]
  steps: NurtureStep[]
}

interface NurtureStep {
  id: string
  delay: number // Days
  action: 'email' | 'task' | 'call' | 'content'
  template: string
  conditions?: any[]
  personalization?: Record<string, any>
}

private async startNurtureSequence(lead: Lead): Promise<void> {
  // Determine appropriate nurture sequence
  let sequenceId = 'default'

  if (lead.company.size === 'enterprise') {
    sequenceId = 'enterprise'
  } else if (lead.score > 70) {
    sequenceId = 'high_value'
  } else if (lead.company.industry === 'restaurant') {
    sequenceId = 'restaurant_focused'
  }

  const sequence = this.nurtureSequences.get(sequenceId)
  if (sequence) {
    await this.triggerWorkflow('start_nurture_sequence', { 
      lead, 
      sequence,
      personalization: {
        industry: lead.company.industry,
        companySize: lead.company.size,
        firstName: lead.contact.firstName
      }
    })
  }
}
```

### Behavioral Triggers

**Dynamic nurturing** based on lead engagement and behavior:

```typescript
async updateLeadEngagement(leadId: string, engagementData: any): Promise<void> {
  const lead = this.leads.get(leadId)
  if (!lead) return

  // Track engagement activity
  await this.addActivity(leadId, {
    type: 'email',
    description: `Email engagement: ${engagementData.action}`,
    outcome: engagementData.action,
    completedAt: new Date(),
    createdBy: 'system'
  })

  // Trigger behavioral workflows
  if (engagementData.action === 'clicked_pricing') {
    await this.triggerWorkflow('high_intent_detected', { lead, action: 'pricing_interest' })
  } else if (engagementData.action === 'downloaded_whitepaper') {
    await this.triggerWorkflow('content_engagement', { lead, content: 'whitepaper' })
  } else if (engagementData.action === 'visited_multiple_pages') {
    await this.triggerWorkflow('website_engagement', { lead, engagement: 'high' })
  }
}
```

## Lead Conversion System

### Opportunity Creation

**Seamless conversion** from qualified leads to sales opportunities:

```typescript
async convertLead(leadId: string, opportunityData: any): Promise<{ lead: Lead; opportunityId: string }> {
  const lead = this.leads.get(leadId)
  if (!lead) throw new Error(`Lead ${leadId} not found`)
  if (lead.status !== 'qualified') throw new Error('Lead must be qualified before conversion')

  // Create opportunity from lead data
  const opportunityId = await this.createOpportunityFromLead(lead, opportunityData)

  // Update lead status
  const convertedLead: Lead = {
    ...lead,
    status: 'converted',
    convertedAt: new Date(),
    convertedToOpportunityId: opportunityId,
    updatedAt: new Date()
  }

  // Log conversion activity
  await this.addActivity(leadId, {
    type: 'follow_up',
    description: `Lead converted to opportunity ${opportunityId}`,
    outcome: 'converted',
    completedAt: new Date(),
    createdBy: 'system'
  })

  this.leads.set(leadId, convertedLead)
  await this.saveLeadToDatabase(convertedLead)

  // Trigger conversion workflow
  await this.triggerWorkflow('lead_converted', { lead: convertedLead, opportunityId })

  return { lead: convertedLead, opportunityId }
}
```

### Conversion Analytics

**Detailed conversion tracking** provides insights into lead quality and source effectiveness:

```typescript
async getConversionMetrics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<ConversionMetrics> {
  const leads = Array.from(this.leads.values())
  const cutoff = this.getTimeframeCutoff(timeframe)
  const recentLeads = leads.filter(lead => lead.createdAt >= cutoff)

  const conversionsBySource = recentLeads.reduce((acc, lead) => {
    if (!acc[lead.source]) {
      acc[lead.source] = { total: 0, converted: 0, rate: 0 }
    }
    acc[lead.source].total++
    if (lead.status === 'converted') {
      acc[lead.source].converted++
    }
    return acc
  }, {} as Record<string, { total: number; converted: number; rate: number }>)

  // Calculate conversion rates
  Object.keys(conversionsBySource).forEach(source => {
    const data = conversionsBySource[source]
    data.rate = data.total > 0 ? (data.converted / data.total) * 100 : 0
  })

  const overallConversionRate = recentLeads.length > 0 
    ? (recentLeads.filter(lead => lead.status === 'converted').length / recentLeads.length) * 100
    : 0

  return {
    totalLeads: recentLeads.length,
    convertedLeads: recentLeads.filter(lead => lead.status === 'converted').length,
    overallConversionRate,
    conversionsBySource,
    averageTimeToConversion: this.calculateAverageTimeToConversion(recentLeads),
    topConvertingSources: Object.entries(conversionsBySource)
      .sort(([, a], [, b]) => b.rate - a.rate)
      .slice(0, 5)
      .map(([source, data]) => ({ source, ...data }))
  }
}
```

## Lead Analytics and Reporting

### Performance Dashboards

**Real-time analytics** provide actionable insights into lead management performance:

```typescript
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

  const byIndustry = recentLeads.reduce((acc, lead) => {
    acc[lead.company.industry] = (acc[lead.company.industry] || 0) + 1
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
    byIndustry,
    conversionRate,
    averageScore,
    topPerformingSources: Object.entries(bySource)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([source, count]) => ({ source, count })),
    leadVelocity: this.calculateLeadVelocity(recentLeads),
    scoreDistribution: this.calculateScoreDistribution(recentLeads)
  }
}
```

### Predictive Analytics

**Machine learning insights** predict lead conversion probability:

```typescript
async predictConversionProbability(leadId: string): Promise<ConversionPrediction> {
  const lead = this.leads.get(leadId)
  if (!lead) throw new Error(`Lead ${leadId} not found`)

  // Simple prediction model based on historical data
  // In production, use actual ML model
  let probability = 0

  // Score-based prediction
  if (lead.score >= 80) probability += 0.4
  else if (lead.score >= 60) probability += 0.3
  else if (lead.score >= 40) probability += 0.2
  else probability += 0.1

  // Activity-based prediction
  const recentActivities = lead.activities.filter(
    activity => activity.completedAt && 
    activity.completedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
  )

  if (recentActivities.length >= 3) probability += 0.3
  else if (recentActivities.length >= 2) probability += 0.2
  else if (recentActivities.length >= 1) probability += 0.1

  // Company size factor
  if (lead.company.size === 'enterprise') probability += 0.2
  else if (lead.company.size === 'large') probability += 0.1

  // Industry factor
  if (lead.company.industry === 'restaurant' || lead.company.industry === 'catering') {
    probability += 0.1
  }

  // Engagement factor
  const engagementScore = this.calculateEngagementScore(lead)
  probability += engagementScore * 0.1

  return {
    leadId,
    probability: Math.min(1, probability),
    confidence: 0.75, // Model confidence
    factors: [
      { name: 'Lead Score', weight: lead.score / 100 * 0.4 },
      { name: 'Recent Activity', weight: recentActivities.length / 5 * 0.3 },
      { name: 'Company Size', weight: lead.company.size === 'enterprise' ? 0.2 : 0.1 },
      { name: 'Industry Match', weight: ['restaurant', 'catering'].includes(lead.company.industry) ? 0.1 : 0.05 },
      { name: 'Engagement', weight: engagementScore * 0.1 }
    ],
    recommendedActions: this.getRecommendedActions(lead, probability)
  }
}
```

---

**Next Steps**: Learn about [Sales Processes](sales_processes.md) to understand how qualified leads progress through the sales pipeline.