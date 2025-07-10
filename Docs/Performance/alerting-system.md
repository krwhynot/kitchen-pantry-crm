# Real-Time Alerting System

## Overview

The real-time alerting system provides **comprehensive alerting capabilities** with multiple notification channels and intelligent alert management. The system implements **severity-based escalation**, **alert deduplication**, and **notification optimization** for effective incident response.

## Alert Management System

### Alert Structure and Types

Define **comprehensive alert types** and **severity levels** for effective incident classification and response.

```typescript
// monitoring/alerting.ts - Real-time alerting system
interface Alert {
  id: string
  type: 'performance' | 'error' | 'security' | 'business'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: number
  metadata: any
  resolved: boolean
  resolvedAt?: number
}

interface AlertRule {
  id: string
  name: string
  condition: (metrics: any) => boolean
  severity: Alert['severity']
  type: Alert['type']
  cooldown: number // Minutes between alerts
  channels: ('email' | 'slack' | 'webhook')[]
}
```

### Alert Rules Configuration

Implement **predefined alert rules** for common performance and error scenarios.

```typescript
class AlertingService {
  private alertRules: AlertRule[] = [
    {
      id: 'high_response_time',
      name: 'High Response Time',
      condition: (metrics) => metrics.p95ResponseTime > 2000,
      severity: 'high',
      type: 'performance',
      cooldown: 15,
      channels: ['email', 'slack']
    },
    {
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 0.05,
      severity: 'critical',
      type: 'error',
      cooldown: 5,
      channels: ['email', 'slack', 'webhook']
    },
    {
      id: 'memory_usage_high',
      name: 'High Memory Usage',
      condition: (metrics) => {
        const usage = metrics.memoryUsage.current
        return usage.heapUsed / usage.heapTotal > 0.85
      },
      severity: 'medium',
      type: 'performance',
      cooldown: 30,
      channels: ['slack']
    },
    {
      id: 'database_connection_issues',
      name: 'Database Connection Issues',
      condition: (metrics) => metrics.databaseErrors > 10,
      severity: 'critical',
      type: 'error',
      cooldown: 5,
      channels: ['email', 'slack', 'webhook']
    },
    {
      id: 'failed_login_attempts',
      name: 'Multiple Failed Login Attempts',
      condition: (metrics) => metrics.failedLogins > 50,
      severity: 'high',
      type: 'security',
      cooldown: 10,
      channels: ['email', 'slack']
    }
  ]
}
```

### Alert Monitoring and Trigger Logic

Implement **continuous monitoring** and **intelligent alert triggering** with cooldown management.

```typescript
class AlertingService {
  private alerts: Alert[] = []
  private alertHistory: Alert[] = []
  private lastAlertTimes: Map<string, number> = new Map()

  private startMonitoring() {
    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts()
    }, 60000)

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts()
    }, 3600000)
  }

  private async checkAlerts() {
    try {
      // Get current metrics from APM service
      const metrics = await this.getCurrentMetrics()

      for (const rule of this.alertRules) {
        if (this.shouldCheckRule(rule) && rule.condition(metrics)) {
          await this.triggerAlert(rule, metrics)
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  private shouldCheckRule(rule: AlertRule): boolean {
    const lastAlertTime = this.lastAlertTimes.get(rule.id) || 0
    const cooldownMs = rule.cooldown * 60 * 1000
    return Date.now() - lastAlertTime > cooldownMs
  }

  private async triggerAlert(rule: AlertRule, metrics: any) {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, metrics),
      timestamp: Date.now(),
      metadata: { rule: rule.id, metrics },
      resolved: false
    }

    this.alerts.push(alert)
    this.alertHistory.push(alert)
    this.lastAlertTimes.set(rule.id, Date.now())

    // Send notifications
    await this.sendNotifications(alert, rule.channels)

    console.log(`Alert triggered: ${alert.title}`)
  }

  private generateAlertDescription(rule: AlertRule, metrics: any): string {
    switch (rule.id) {
      case 'high_response_time':
        return `95th percentile response time is ${metrics.p95ResponseTime.toFixed(2)}ms (threshold: 2000ms)`
      
      case 'high_error_rate':
        return `Error rate is ${(metrics.errorRate * 100).toFixed(2)}% (threshold: 5%)`
      
      case 'memory_usage_high':
        const usage = metrics.memoryUsage.current
        const percent = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(1)
        return `Memory usage is ${percent}% (threshold: 85%)`
      
      case 'database_connection_issues':
        return `${metrics.databaseErrors} database errors in the last hour (threshold: 10)`
      
      case 'failed_login_attempts':
        return `${metrics.failedLogins} failed login attempts in the last hour (threshold: 50)`
      
      default:
        return 'Alert condition met'
    }
  }
}
```

## Notification Channels

### Email Notifications

Implement **comprehensive email alerting** with HTML templates and delivery optimization.

```typescript
class AlertingService {
  private emailTransporter: nodemailer.Transporter

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  }

  private async sendEmailAlert(alert: Alert) {
    try {
      const subject = `[${alert.severity.toUpperCase()}] Kitchen Pantry CRM Alert: ${alert.title}`
      const html = this.generateEmailTemplate(alert)

      await this.emailTransporter.sendMail({
        from: env.ALERT_FROM_EMAIL,
        to: env.ALERT_TO_EMAILS?.split(',') || [],
        subject,
        html
      })
    } catch (error) {
      console.error('Failed to send email alert:', error)
    }
  }

  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center;">
            <h1>Kitchen Pantry CRM Alert</h1>
            <h2>${alert.title}</h2>
          </div>
          
          <div style="padding: 20px;">
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            
            <h3>Description</h3>
            <p>${alert.description}</p>
            
            <h3>Metadata</h3>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alert.metadata, null, 2)}
            </pre>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p>This alert was generated by Kitchen Pantry CRM monitoring system.</p>
            <p>Please investigate and resolve the issue promptly.</p>
          </div>
        </body>
      </html>
    `
  }

  private getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'low': return '#28a745'
      case 'medium': return '#ffc107'
      case 'high': return '#fd7e14'
      case 'critical': return '#dc3545'
      default: return '#6c757d'
    }
  }
}
```

### Slack Notifications

Implement **Slack integration** with rich formatting and interactive elements.

```typescript
class AlertingService {
  private slackClient: WebClient

  constructor() {
    // Initialize Slack client
    this.slackClient = new WebClient(env.SLACK_BOT_TOKEN)
  }

  private async sendSlackAlert(alert: Alert) {
    try {
      const color = this.getSeverityColor(alert.severity)
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.title}*\n${alert.description}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Severity: ${alert.severity} | Time: ${new Date(alert.timestamp).toISOString()}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard'
              },
              url: `${env.FRONTEND_URL}/dashboard/performance`,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Acknowledge'
              },
              action_id: 'acknowledge_alert',
              value: alert.id
            }
          ]
        }
      ]

      await this.slackClient.chat.postMessage({
        channel: env.SLACK_ALERT_CHANNEL,
        text: `Alert: ${alert.title}`,
        blocks,
        attachments: [
          {
            color,
            fallback: alert.description
          }
        ]
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }
}
```

### Webhook Notifications

Implement **webhook integration** for external systems and custom notification handlers.

```typescript
class AlertingService {
  private async sendWebhookAlert(alert: Alert) {
    try {
      if (!env.ALERT_WEBHOOK_URL) return

      const response = await fetch(env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ALERT_WEBHOOK_TOKEN}`
        },
        body: JSON.stringify({
          alert,
          timestamp: Date.now(),
          service: 'kitchen-pantry-crm',
          version: process.env.npm_package_version
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }

  private async sendNotifications(alert: Alert, channels: string[]) {
    const promises = channels.map(channel => {
      switch (channel) {
        case 'email':
          return this.sendEmailAlert(alert)
        case 'slack':
          return this.sendSlackAlert(alert)
        case 'webhook':
          return this.sendWebhookAlert(alert)
        default:
          return Promise.resolve()
      }
    })

    await Promise.allSettled(promises)
  }
}
```

## Alert Management Features

### Alert Resolution and Lifecycle

Implement **alert resolution tracking** and **lifecycle management** for effective incident response.

```typescript
class AlertingService {
  // Public methods for alert management
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  getAlertHistory(limit = 100): Alert[] {
    return this.alertHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      return true
    }
    return false
  }

  getAlertStats(timeWindow = 24 * 60 * 60 * 1000): any {
    const cutoff = Date.now() - timeWindow
    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp > cutoff)

    const byType = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySeverity = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: recentAlerts.length,
      active: this.getActiveAlerts().length,
      byType,
      bySeverity,
      averageResolutionTime: this.calculateAverageResolutionTime(recentAlerts)
    }
  }

  private calculateAverageResolutionTime(alerts: Alert[]): number {
    const resolvedAlerts = alerts.filter(alert => alert.resolved && alert.resolvedAt)
    if (resolvedAlerts.length === 0) return 0

    const totalTime = resolvedAlerts.reduce((sum, alert) => 
      sum + (alert.resolvedAt! - alert.timestamp), 0
    )

    return totalTime / resolvedAlerts.length
  }

  private cleanupOldAlerts() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff)
    
    // Remove resolved alerts older than 24 hours
    const resolvedCutoff = Date.now() - (24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > resolvedCutoff
    )
  }
}
```

### Alert Escalation and Deduplication

Implement **alert escalation** and **deduplication logic** to prevent alert fatigue.

```typescript
class AlertingService {
  private escalationRules: Map<string, number> = new Map()
  private alertCounts: Map<string, number> = new Map()

  private async triggerAlert(rule: AlertRule, metrics: any) {
    // Check for escalation
    const alertCount = this.alertCounts.get(rule.id) || 0
    const shouldEscalate = this.shouldEscalate(rule, alertCount)

    if (shouldEscalate) {
      // Escalate alert severity
      rule.severity = this.escalateSeverity(rule.severity)
      rule.channels = this.addEscalationChannels(rule.channels)
    }

    // Standard alert creation logic
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, metrics),
      timestamp: Date.now(),
      metadata: { 
        rule: rule.id, 
        metrics,
        escalated: shouldEscalate,
        alertCount: alertCount + 1
      },
      resolved: false
    }

    this.alerts.push(alert)
    this.alertHistory.push(alert)
    this.lastAlertTimes.set(rule.id, Date.now())
    this.alertCounts.set(rule.id, alertCount + 1)

    // Send notifications
    await this.sendNotifications(alert, rule.channels)

    console.log(`Alert triggered: ${alert.title}${shouldEscalate ? ' (ESCALATED)' : ''}`)
  }

  private shouldEscalate(rule: AlertRule, alertCount: number): boolean {
    const escalationThreshold = this.getEscalationThreshold(rule.severity)
    return alertCount >= escalationThreshold
  }

  private getEscalationThreshold(severity: Alert['severity']): number {
    switch (severity) {
      case 'low': return 5
      case 'medium': return 3
      case 'high': return 2
      case 'critical': return 1
      default: return 3
    }
  }

  private escalateSeverity(severity: Alert['severity']): Alert['severity'] {
    switch (severity) {
      case 'low': return 'medium'
      case 'medium': return 'high'
      case 'high': return 'critical'
      case 'critical': return 'critical'
      default: return severity
    }
  }

  private addEscalationChannels(channels: string[]): string[] {
    // Add webhook for escalated alerts
    if (!channels.includes('webhook')) {
      return [...channels, 'webhook']
    }
    return channels
  }
}
```

## Express Route Handlers

### Alert API Endpoints

Create **comprehensive API endpoints** for alert management and monitoring.

```typescript
export const alertingService = new AlertingService()

// Express route handlers
export const getActiveAlertsHandler = (req: Request, res: Response) => {
  const alerts = alertingService.getActiveAlerts()
  res.json({ success: true, data: alerts })
}

export const getAlertHistoryHandler = (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  const history = alertingService.getAlertHistory(limit)
  res.json({ success: true, data: history })
}

export const resolveAlertHandler = (req: Request, res: Response) => {
  const { alertId } = req.params
  const resolved = alertingService.resolveAlert(alertId)
  
  if (resolved) {
    res.json({ success: true, message: 'Alert resolved' })
  } else {
    res.status(404).json({ success: false, message: 'Alert not found or already resolved' })
  }
}

export const getAlertStatsHandler = (req: Request, res: Response) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || (24 * 60 * 60 * 1000)
  const stats = alertingService.getAlertStats(timeWindow)
  res.json({ success: true, data: stats })
}

export const createAlertRuleHandler = (req: Request, res: Response) => {
  const { rule } = req.body
  
  try {
    alertingService.addAlertRule(rule)
    res.json({ success: true, message: 'Alert rule created' })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const updateAlertRuleHandler = (req: Request, res: Response) => {
  const { ruleId } = req.params
  const { rule } = req.body
  
  try {
    alertingService.updateAlertRule(ruleId, rule)
    res.json({ success: true, message: 'Alert rule updated' })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}
```

## Integration Best Practices

### Alert Configuration

- Set **appropriate cooldown periods** to prevent alert flooding
- Configure **severity levels** based on business impact
- Implement **alert deduplication** to reduce noise
- Use **escalation policies** for critical alerts

### Notification Optimization

- **Batch notifications** during high-alert periods
- Use **different channels** for different severity levels
- Implement **quiet hours** for non-critical alerts
- Provide **rich context** in alert messages

### Alert Response

- Create **runbook links** in alert notifications
- Implement **alert acknowledgment** workflows
- Track **mean time to resolution** (MTTR)
- Set up **post-incident reviews** for critical alerts

## Related Documentation

- [Overview](./overview.md) - Performance architecture and strategy
- [Monitoring and APM](./monitoring-apm.md) - Application performance monitoring
- [Frontend Optimization](./frontend-optimization.md) - Client-side optimization
- [Backend Optimization](./backend-optimization.md) - Server-side optimization