# Audit Logging and Monitoring

## Overview

The system implements **comprehensive audit logging** for all user actions, data changes, and system events to provide accountability, compliance support, and security incident investigation capabilities.

## Audit Trail Components

### User Action Logging
**All user actions** are logged with detailed context:
- **Login and logout** events
- **Data access** and modifications
- **Failed authentication** attempts
- **Permission violations**

### Data Change Tracking
**Database triggers** capture all data modifications:
- **Before/after values** for all changes
- **Changed fields** identification
- **User context** and timestamps
- **Session information** tracking

### System Event Logging
**System events** are logged for security monitoring:
- **Authentication failures** with context
- **Permission violations** and attempts
- **Security incidents** and responses
- **System health** and performance events

## Database Implementation

### Audit Log Table Schema
```sql
-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255)
);
```

### Audit Trigger Implementation
```sql
-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_info RECORD;
BEGIN
  -- Get user information
  SELECT email INTO user_info FROM auth.users WHERE id = auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      table_name, record_id, action, old_values, 
      user_id, user_email, timestamp
    ) VALUES (
      TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD),
      auth.uid(), user_info.email, NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      table_name, record_id, action, old_values, new_values,
      user_id, user_email, timestamp
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW),
      auth.uid(), user_info.email, NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      table_name, record_id, action, new_values,
      user_id, user_email, timestamp
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW),
      auth.uid(), user_info.email, NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Application
```sql
-- Apply audit triggers to all main tables
CREATE TRIGGER audit_organizations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contacts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_interactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_opportunities_trigger
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Security Monitoring Features

### Failed Authentication Monitoring
**Automated detection** of suspicious login attempts:
- **Multiple failed attempts** trigger account lockout
- **IP-based tracking** for geographic analysis
- **Pattern detection** for coordinated attacks
- **Security alerts** for unusual activity

### Access Pattern Analysis
**Machine learning algorithms** analyze user behavior:
- **Unusual login times** detection
- **Geographic anomalies** identification
- **Data access patterns** monitoring
- **Automated security reviews** for anomalies

### Data Access Monitoring
**Comprehensive tracking** of data access:
- **Bulk data exports** monitoring
- **Sensitive data queries** logging
- **Unusual query patterns** detection
- **Insider threat** prevention

## Monitoring Service Implementation

```typescript
export class SecurityMonitoringService {
  private static readonly MAX_FAILED_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

  async recordFailedLogin(email: string, ipAddress: string, userAgent: string) {
    const key = `failed_login:${email}:${ipAddress}`
    const attempts = await this.getFailedAttempts(key)
    
    if (attempts >= SecurityMonitoringService.MAX_FAILED_ATTEMPTS) {
      await this.lockAccount(email)
      await this.sendSecurityAlert('ACCOUNT_LOCKED', { email, ipAddress })
    }
    
    await this.incrementFailedAttempts(key)
    await this.logSecurityEvent({
      event_type: 'FAILED_LOGIN',
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: 'MEDIUM'
    })
  }

  async detectDataAccessAnomaly(userId: string, action: string, resourceType: string) {
    const pattern = await this.analyzeAccessPattern(userId, action, resourceType)
    
    if (pattern.isAnomalous) {
      await this.logSecurityEvent({
        event_type: 'DATA_ACCESS_ANOMALY',
        user_id: userId,
        details: { action, resource_type: resourceType, anomaly_score: pattern.anomalyScore },
        severity: 'HIGH'
      })
    }
  }
}
```

## Compliance and Reporting

### Audit Report Generation
- **Automated reporting** for compliance requirements
- **Customizable time ranges** and filters
- **Export capabilities** for external auditors
- **Real-time dashboards** for security teams

### Data Retention
- **Configurable retention** policies
- **Secure archival** of historical data
- **Compliance requirements** adherence
- **Automated cleanup** of expired logs