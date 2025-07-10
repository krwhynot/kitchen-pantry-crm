# Sales Process Management

**The Kitchen Pantry CRM sales process management** provides complete sales pipeline automation including opportunity tracking, customer relationship management, and performance optimization features tailored for the food service industry.

## Opportunity Management System

### Opportunity Data Structure

**Comprehensive opportunity tracking** manages the entire sales lifecycle from qualification to close:

```typescript
interface Opportunity {
  id: string
  name: string
  accountId: string
  contactId: string
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  value: number
  expectedCloseDate: Date
  actualCloseDate?: Date
  source: string
  assignedTo: string
  products: OpportunityProduct[]
  competitors: string[]
  lostReason?: string
  activities: OpportunityActivity[]
  documents: OpportunityDocument[]
  createdAt: Date
  updatedAt: Date
}

interface OpportunityProduct {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
}

interface OpportunityActivity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'presentation'
  subject: string
  description: string
  outcome: 'positive' | 'neutral' | 'negative'
  nextSteps?: string
  scheduledAt?: Date
  completedAt?: Date
  createdBy: string
}
```

### Pipeline Management

**Automated pipeline progression** with stage-specific workflows and requirements:

```typescript
class OpportunityPipeline {
  private stages: Map<string, PipelineStage> = new Map()
  private stageRequirements: Map<string, StageRequirement[]> = new Map()

  async advanceOpportunity(opportunityId: string, newStage: string, data?: any): Promise<Opportunity> {
    const opportunity = await this.getOpportunity(opportunityId)
    if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`)

    // Validate stage requirements
    const requirements = this.stageRequirements.get(newStage) || []
    const validationResult = await this.validateStageRequirements(opportunity, requirements)
    
    if (!validationResult.isValid) {
      throw new Error(`Cannot advance to ${newStage}: ${validationResult.errors.join(', ')}`)
    }

    // Update opportunity stage
    const updatedOpportunity: Opportunity = {
      ...opportunity,
      stage: newStage as any,
      probability: this.calculateProbability(newStage),
      updatedAt: new Date(),
      ...data
    }

    // Log stage change activity
    await this.addActivity(opportunityId, {
      type: 'meeting',
      subject: `Stage advanced to ${newStage}`,
      description: `Opportunity moved from ${opportunity.stage} to ${newStage}`,
      outcome: 'positive',
      completedAt: new Date(),
      createdBy: 'system'
    })

    // Trigger stage-specific workflows
    await this.triggerStageWorkflows(updatedOpportunity, opportunity.stage, newStage)

    await this.saveOpportunity(updatedOpportunity)
    return updatedOpportunity
  }

  private async validateStageRequirements(opportunity: Opportunity, requirements: StageRequirement[]): Promise<ValidationResult> {
    const errors: string[] = []

    for (const requirement of requirements) {
      switch (requirement.type) {
        case 'activity_completed':
          const hasActivity = opportunity.activities.some(
            activity => activity.type === requirement.value && activity.completedAt
          )
          if (!hasActivity) {
            errors.push(`Required activity '${requirement.value}' not completed`)
          }
          break

        case 'field_populated':
          const fieldValue = this.getFieldValue(opportunity, requirement.field)
          if (!fieldValue) {
            errors.push(`Required field '${requirement.field}' not populated`)
          }
          break

        case 'minimum_value':
          if (opportunity.value < requirement.value) {
            errors.push(`Opportunity value must be at least ${requirement.value}`)
          }
          break

        case 'products_selected':
          if (opportunity.products.length === 0) {
            errors.push('At least one product must be selected')
          }
          break
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```

## Sales Stage Automation

### Stage-Specific Workflows

**Automated workflows** trigger based on opportunity stage progression:

```typescript
interface PipelineStage {
  id: string
  name: string
  order: number
  probability: number
  requirements: StageRequirement[]
  automations: StageAutomation[]
  duration: number // Expected days in stage
}

interface StageRequirement {
  type: 'activity_completed' | 'field_populated' | 'minimum_value' | 'products_selected'
  field?: string
  value: any
  required: boolean
}

interface StageAutomation {
  trigger: 'stage_entered' | 'stage_duration_exceeded' | 'stage_requirements_met'
  action: 'create_task' | 'send_email' | 'schedule_meeting' | 'update_field' | 'notify_manager'
  parameters: Record<string, any>
}

// Example: Discovery stage configuration
const discoveryStage: PipelineStage = {
  id: 'discovery',
  name: 'Discovery',
  order: 1,
  probability: 20,
  requirements: [
    {
      type: 'activity_completed',
      value: 'call',
      required: true
    },
    {
      type: 'field_populated',
      field: 'budget',
      value: null,
      required: true
    }
  ],
  automations: [
    {
      trigger: 'stage_entered',
      action: 'create_task',
      parameters: {
        title: 'Conduct discovery call',
        description: 'Schedule and conduct discovery call to understand customer needs',
        dueDate: '+3 days',
        priority: 'high'
      }
    },
    {
      trigger: 'stage_duration_exceeded',
      action: 'notify_manager',
      parameters: {
        threshold: 14, // 14 days
        message: 'Discovery stage duration exceeded'
      }
    }
  ],
  duration: 7
}
```

### Competitive Intelligence

**Competitive tracking** and positioning strategies:

```typescript
interface CompetitorInfo {
  name: string
  strengths: string[]
  weaknesses: string[]
  pricing: string
  marketShare: number
  battlecards: string[]
}

class CompetitiveIntelligence {
  private competitors: Map<string, CompetitorInfo> = new Map()
  private battlecards: Map<string, BattleCard> = new Map()

  async analyzeCompetition(opportunityId: string): Promise<CompetitiveAnalysis> {
    const opportunity = await this.getOpportunity(opportunityId)
    if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`)

    const analysis: CompetitiveAnalysis = {
      opportunityId,
      competitors: [],
      recommendations: [],
      winProbability: opportunity.probability
    }

    // Analyze each competitor
    for (const competitorName of opportunity.competitors) {
      const competitor = this.competitors.get(competitorName)
      if (!competitor) continue

      const competitorAnalysis: CompetitorAnalysis = {
        name: competitorName,
        threatLevel: this.calculateThreatLevel(competitor, opportunity),
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        positioning: this.getPositioningStrategy(competitor, opportunity),
        battlecards: competitor.battlecards.map(id => this.battlecards.get(id)!).filter(Boolean)
      }

      analysis.competitors.push(competitorAnalysis)
    }

    // Generate recommendations
    analysis.recommendations = this.generateCompetitiveRecommendations(analysis)

    return analysis
  }

  private calculateThreatLevel(competitor: CompetitorInfo, opportunity: Opportunity): 'low' | 'medium' | 'high' {
    let threatScore = 0

    // Market share factor
    if (competitor.marketShare > 0.3) threatScore += 3
    else if (competitor.marketShare > 0.1) threatScore += 2
    else threatScore += 1

    // Pricing factor
    if (competitor.pricing === 'lower') threatScore += 2
    else if (competitor.pricing === 'competitive') threatScore += 1

    // Strength factor
    threatScore += competitor.strengths.length * 0.5

    if (threatScore >= 5) return 'high'
    if (threatScore >= 3) return 'medium'
    return 'low'
  }
}
```

## Customer Relationship Management

### Account Management

**Comprehensive account tracking** with relationship mapping and engagement history:

```typescript
interface Account {
  id: string
  name: string
  industry: string
  size: 'small' | 'medium' | 'large' | 'enterprise'
  annualRevenue: number
  headquarters: Address
  locations: Location[]
  parentAccount?: string
  subsidiaries: string[]
  status: 'prospect' | 'customer' | 'partner' | 'inactive'
  tier: 'strategic' | 'key' | 'standard' | 'basic'
  assignedTo: string
  teamMembers: AccountTeamMember[]
  contracts: Contract[]
  opportunities: string[]
  healthScore: number
  lastActivityDate: Date
  renewalDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface AccountTeamMember {
  userId: string
  role: 'account_manager' | 'sales_rep' | 'support' | 'technical'
  isPrimary: boolean
  startDate: Date
  endDate?: Date
}

class AccountManager {
  async calculateAccountHealth(accountId: string): Promise<AccountHealth> {
    const account = await this.getAccount(accountId)
    if (!account) throw new Error(`Account ${accountId} not found`)

    let healthScore = 0
    const factors: HealthFactor[] = []

    // Recent activity factor
    const daysSinceLastActivity = (Date.now() - account.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLastActivity <= 7) {
      healthScore += 25
      factors.push({ name: 'Recent Activity', score: 25, impact: 'positive' })
    } else if (daysSinceLastActivity <= 30) {
      healthScore += 15
      factors.push({ name: 'Recent Activity', score: 15, impact: 'neutral' })
    } else {
      healthScore += 5
      factors.push({ name: 'Recent Activity', score: 5, impact: 'negative' })
    }

    // Contract value factor
    const totalContractValue = account.contracts.reduce((sum, contract) => sum + contract.value, 0)
    if (totalContractValue > 500000) {
      healthScore += 25
      factors.push({ name: 'Contract Value', score: 25, impact: 'positive' })
    } else if (totalContractValue > 100000) {
      healthScore += 15
      factors.push({ name: 'Contract Value', score: 15, impact: 'neutral' })
    } else {
      healthScore += 5
      factors.push({ name: 'Contract Value', score: 5, impact: 'negative' })
    }

    // Engagement factor
    const engagementScore = await this.calculateEngagementScore(accountId)
    healthScore += engagementScore
    factors.push({ name: 'Engagement', score: engagementScore, impact: engagementScore > 15 ? 'positive' : 'neutral' })

    // Growth factor
    const growthScore = await this.calculateGrowthScore(accountId)
    healthScore += growthScore
    factors.push({ name: 'Growth', score: growthScore, impact: growthScore > 10 ? 'positive' : 'neutral' })

    return {
      accountId,
      healthScore: Math.min(100, healthScore),
      factors,
      riskLevel: this.calculateRiskLevel(healthScore),
      recommendations: this.generateHealthRecommendations(factors)
    }
  }
}
```

### Interaction Tracking

**Comprehensive interaction history** with sentiment analysis and follow-up automation:

```typescript
interface CustomerInteraction {
  id: string
  accountId: string
  contactId: string
  opportunityId?: string
  type: 'email' | 'phone' | 'meeting' | 'demo' | 'support' | 'event'
  subject: string
  description: string
  outcome: 'positive' | 'neutral' | 'negative'
  sentiment: number // -1 to 1
  nextSteps?: string
  followUpDate?: Date
  attachments: string[]
  participants: InteractionParticipant[]
  duration?: number
  location?: string
  createdBy: string
  createdAt: Date
}

interface InteractionParticipant {
  contactId: string
  role: 'organizer' | 'attendee' | 'optional'
  attended: boolean
  feedback?: string
}

class InteractionManager {
  async recordInteraction(interactionData: Omit<CustomerInteraction, 'id' | 'createdAt'>): Promise<CustomerInteraction> {
    const interaction: CustomerInteraction = {
      ...interactionData,
      id: this.generateInteractionId(),
      createdAt: new Date()
    }

    // Analyze sentiment
    interaction.sentiment = await this.analyzeSentiment(interaction.description)

    // Save interaction
    await this.saveInteraction(interaction)

    // Update account last activity
    await this.updateAccountLastActivity(interaction.accountId, interaction.createdAt)

    // Trigger follow-up workflows
    if (interaction.followUpDate) {
      await this.scheduleFollowUp(interaction)
    }

    // Update opportunity if linked
    if (interaction.opportunityId) {
      await this.updateOpportunityActivity(interaction.opportunityId, interaction)
    }

    return interaction
  }

  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis - in production, use advanced NLP
    const positiveWords = ['excellent', 'great', 'positive', 'interested', 'excited', 'perfect', 'amazing']
    const negativeWords = ['concerned', 'disappointed', 'problem', 'issue', 'difficult', 'frustrated', 'unhappy']

    const words = text.toLowerCase().split(/\s+/)
    let score = 0

    for (const word of words) {
      if (positiveWords.includes(word)) score += 0.1
      if (negativeWords.includes(word)) score -= 0.1
    }

    return Math.max(-1, Math.min(1, score))
  }

  async getInteractionInsights(accountId: string, timeframe: string): Promise<InteractionInsights> {
    const interactions = await this.getAccountInteractions(accountId, timeframe)

    const byType = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageSentiment = interactions.length > 0
      ? interactions.reduce((sum, interaction) => sum + interaction.sentiment, 0) / interactions.length
      : 0

    const responseTime = await this.calculateAverageResponseTime(accountId, timeframe)

    return {
      accountId,
      totalInteractions: interactions.length,
      byType,
      averageSentiment,
      responseTime,
      trends: this.calculateInteractionTrends(interactions),
      recommendations: this.generateInteractionRecommendations(interactions)
    }
  }
}
```

## Sales Performance Analytics

### Pipeline Analytics

**Comprehensive pipeline analysis** with forecasting and performance metrics:

```typescript
interface PipelineAnalytics {
  totalOpportunities: number
  totalValue: number
  weightedValue: number
  averageDealSize: number
  averageSalesCycle: number
  conversionRates: Record<string, number>
  stageDistribution: Record<string, number>
  velocity: PipelineVelocity
  forecast: SalesForecast
  trends: PipelineTrends
}

class PipelineAnalytics {
  async generatePipelineReport(timeframe: string, filters?: PipelineFilters): Promise<PipelineAnalytics> {
    const opportunities = await this.getOpportunities(timeframe, filters)

    const totalOpportunities = opportunities.length
    const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0)
    const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0)

    const averageDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0

    const conversionRates = this.calculateConversionRates(opportunities)
    const stageDistribution = this.calculateStageDistribution(opportunities)
    const velocity = await this.calculatePipelineVelocity(opportunities)

    const forecast = await this.generateSalesForecast(opportunities)
    const trends = this.calculatePipelineTrends(opportunities)

    return {
      totalOpportunities,
      totalValue,
      weightedValue,
      averageDealSize,
      averageSalesCycle: await this.calculateAverageSalesCycle(opportunities),
      conversionRates,
      stageDistribution,
      velocity,
      forecast,
      trends
    }
  }

  private calculateConversionRates(opportunities: Opportunity[]): Record<string, number> {
    const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won']
    const rates: Record<string, number> = {}

    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i]
      const nextStage = stages[i + 1]

      const currentStageCount = opportunities.filter(opp => opp.stage === currentStage).length
      const nextStageCount = opportunities.filter(opp => opp.stage === nextStage).length

      rates[`${currentStage}_to_${nextStage}`] = currentStageCount > 0 
        ? (nextStageCount / currentStageCount) * 100 
        : 0
    }

    return rates
  }

  private async calculatePipelineVelocity(opportunities: Opportunity[]): Promise<PipelineVelocity> {
    const closedOpportunities = opportunities.filter(opp => 
      opp.stage === 'closed_won' || opp.stage === 'closed_lost'
    )

    if (closedOpportunities.length === 0) {
      return { averageVelocity: 0, byStage: {} }
    }

    const totalDuration = closedOpportunities.reduce((sum, opp) => {
      const duration = (opp.actualCloseDate?.getTime() || Date.now()) - opp.createdAt.getTime()
      return sum + duration
    }, 0)

    const averageVelocity = totalDuration / closedOpportunities.length / (1000 * 60 * 60 * 24) // Convert to days

    // Calculate velocity by stage
    const byStage: Record<string, number> = {}
    const stages = ['discovery', 'qualification', 'proposal', 'negotiation']

    for (const stage of stages) {
      const stageOpportunities = opportunities.filter(opp => opp.stage === stage)
      const stageAvgDuration = stageOpportunities.reduce((sum, opp) => {
        const duration = Date.now() - opp.updatedAt.getTime()
        return sum + duration
      }, 0) / stageOpportunities.length

      byStage[stage] = stageAvgDuration / (1000 * 60 * 60 * 24) // Convert to days
    }

    return { averageVelocity, byStage }
  }
}
```

### Sales Forecasting

**Predictive sales forecasting** with confidence intervals and scenario planning:

```typescript
interface SalesForecast {
  period: string
  totalForecast: number
  bestCase: number
  worstCase: number
  confidence: number
  byRep: Record<string, RepForecast>
  byProduct: Record<string, ProductForecast>
  methodology: string
  assumptions: string[]
}

class SalesForecaster {
  async generateForecast(period: string, method: 'pipeline' | 'historical' | 'hybrid' = 'hybrid'): Promise<SalesForecast> {
    const opportunities = await this.getOpportunities(period)
    
    let totalForecast = 0
    let bestCase = 0
    let worstCase = 0
    let confidence = 0

    switch (method) {
      case 'pipeline':
        ({ totalForecast, bestCase, worstCase, confidence } = await this.pipelineForecast(opportunities))
        break
      case 'historical':
        ({ totalForecast, bestCase, worstCase, confidence } = await this.historicalForecast(period))
        break
      case 'hybrid':
        ({ totalForecast, bestCase, worstCase, confidence } = await this.hybridForecast(opportunities, period))
        break
    }

    const byRep = await this.forecastByRep(opportunities)
    const byProduct = await this.forecastByProduct(opportunities)

    return {
      period,
      totalForecast,
      bestCase,
      worstCase,
      confidence,
      byRep,
      byProduct,
      methodology: method,
      assumptions: this.getForecastAssumptions(method)
    }
  }

  private async pipelineForecast(opportunities: Opportunity[]): Promise<ForecastResult> {
    // Weight opportunities by probability and close date
    const weightedValue = opportunities.reduce((sum, opp) => {
      const timeWeight = this.calculateTimeWeight(opp.expectedCloseDate)
      const probabilityWeight = opp.probability / 100
      return sum + (opp.value * probabilityWeight * timeWeight)
    }, 0)

    const bestCase = opportunities.reduce((sum, opp) => {
      return sum + (opp.value * Math.min(1, opp.probability / 100 + 0.2))
    }, 0)

    const worstCase = opportunities.reduce((sum, opp) => {
      return sum + (opp.value * Math.max(0, opp.probability / 100 - 0.2))
    }, 0)

    return {
      totalForecast: weightedValue,
      bestCase,
      worstCase,
      confidence: 0.75 // Based on pipeline accuracy
    }
  }

  private async historicalForecast(period: string): Promise<ForecastResult> {
    const historicalData = await this.getHistoricalSalesData(period)
    const seasonalAdjustment = await this.calculateSeasonalAdjustment(period)
    const trendAdjustment = await this.calculateTrendAdjustment(historicalData)

    const baselineForecast = historicalData.averageRevenue * seasonalAdjustment * trendAdjustment

    return {
      totalForecast: baselineForecast,
      bestCase: baselineForecast * 1.15,
      worstCase: baselineForecast * 0.85,
      confidence: 0.8 // Historical data is generally reliable
    }
  }

  private async hybridForecast(opportunities: Opportunity[], period: string): Promise<ForecastResult> {
    const pipelineResult = await this.pipelineForecast(opportunities)
    const historicalResult = await this.historicalForecast(period)

    // Weighted average of pipeline and historical forecasts
    const pipelineWeight = 0.6
    const historicalWeight = 0.4

    const totalForecast = (pipelineResult.totalForecast * pipelineWeight) + 
                         (historicalResult.totalForecast * historicalWeight)

    const bestCase = (pipelineResult.bestCase * pipelineWeight) + 
                    (historicalResult.bestCase * historicalWeight)

    const worstCase = (pipelineResult.worstCase * pipelineWeight) + 
                     (historicalResult.worstCase * historicalWeight)

    const confidence = (pipelineResult.confidence * pipelineWeight) + 
                      (historicalResult.confidence * historicalWeight)

    return { totalForecast, bestCase, worstCase, confidence }
  }
}
```

---

**Next Steps**: Review the [Implementation Guide](implementation_guide.md) for technical details on database schemas, API endpoints, and testing strategies.