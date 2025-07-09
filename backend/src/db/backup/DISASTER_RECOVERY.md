# Kitchen Pantry CRM - Disaster Recovery Procedures

## Overview

This document outlines the disaster recovery procedures for the Kitchen Pantry CRM database system. It provides step-by-step instructions for recovering from various types of failures and ensuring business continuity.

## Table of Contents

1. [Recovery Objectives](#recovery-objectives)
2. [Backup Strategy](#backup-strategy)
3. [Disaster Scenarios](#disaster-scenarios)
4. [Recovery Procedures](#recovery-procedures)
5. [Testing and Validation](#testing-and-validation)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Emergency Contacts](#emergency-contacts)
8. [Post-Recovery Procedures](#post-recovery-procedures)

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Critical Systems**: 2 hours
- **Standard Systems**: 4 hours
- **Non-critical Systems**: 8 hours

### Recovery Point Objective (RPO)
- **Critical Data**: 1 hour (maximum acceptable data loss)
- **Standard Data**: 4 hours
- **Non-critical Data**: 24 hours

## Backup Strategy

### Backup Types

1. **Full Backups**
   - Frequency: Daily at 2:00 AM EST
   - Retention: 30 days
   - Format: SQL with compression
   - Location: Primary backup storage + cloud storage

2. **Incremental Backups**
   - Frequency: Every 4 hours
   - Retention: 7 days
   - Format: JSON
   - Location: Primary backup storage

3. **Schema-Only Backups**
   - Frequency: Before each migration
   - Retention: 90 days
   - Format: SQL
   - Location: Primary backup storage

### Backup Locations

- **Primary**: `/opt/kitchen-pantry/backups/`
- **Secondary**: AWS S3 bucket `kitchen-pantry-backups`
- **Offsite**: Secondary datacenter (if applicable)

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
- Database queries returning errors
- Data inconsistencies
- Application unable to connect to database

**Immediate Actions:**
1. Stop all application services
2. Assess the extent of corruption
3. Identify the last known good backup
4. Initiate recovery procedure

### Scenario 2: Complete Server Failure

**Symptoms:**
- Server unresponsive
- Hardware failure
- Complete data loss on primary storage

**Immediate Actions:**
1. Activate backup server/infrastructure
2. Restore from most recent backup
3. Update DNS/load balancer configurations
4. Verify system functionality

### Scenario 3: Ransomware Attack

**Symptoms:**
- Files encrypted/corrupted
- Ransom demands
- System access restricted

**Immediate Actions:**
1. Isolate affected systems
2. Do not pay ransom
3. Restore from clean backups
4. Scan for vulnerabilities
5. Implement additional security measures

### Scenario 4: Natural Disaster

**Symptoms:**
- Primary datacenter unavailable
- Extended outage
- Infrastructure damage

**Immediate Actions:**
1. Activate disaster recovery site
2. Restore from offsite backups
3. Implement business continuity plan
4. Communicate with stakeholders

## Recovery Procedures

### Quick Recovery Checklist

```bash
# 1. Assess the situation
./backup-cli monitor health

# 2. List available backups
./backup-cli backup list

# 3. Validate backup integrity
./backup-cli backup validate <backup-id>

# 4. Create recovery plan
./backup-cli recovery plan <backup-id>

# 5. Execute recovery
./backup-cli recovery execute <backup-id>

# 6. Verify recovery
./backup-cli monitor health
```

### Detailed Recovery Steps

#### Step 1: Situation Assessment (5-15 minutes)

1. **Identify the problem:**
   ```bash
   # Check system status
   systemctl status postgresql
   systemctl status kitchen-pantry-api
   
   # Check logs
   journalctl -u postgresql -n 100
   journalctl -u kitchen-pantry-api -n 100
   
   # Run health check
   ./backup-cli monitor health
   ```

2. **Determine recovery scope:**
   - Which systems are affected?
   - What is the extent of data loss?
   - Are backups available and valid?

3. **Notify stakeholders:**
   - Send notification to emergency contacts
   - Update status page
   - Communicate estimated recovery time

#### Step 2: Backup Validation (5-10 minutes)

1. **List available backups:**
   ```bash
   ./backup-cli backup list -l 10
   ```

2. **Identify the most recent valid backup:**
   ```bash
   # Check backup integrity
   ./backup-cli backup validate <backup-id>
   ```

3. **Verify backup completeness:**
   - Check backup size and record count
   - Ensure backup includes all required tables
   - Verify backup timestamp is within RPO

#### Step 3: System Preparation (10-30 minutes)

1. **Stop all services:**
   ```bash
   systemctl stop kitchen-pantry-api
   systemctl stop kitchen-pantry-worker
   ```

2. **Backup current state (if possible):**
   ```bash
   # Create emergency backup of current state
   ./backup-cli backup create -n "emergency-$(date +%Y%m%d-%H%M%S)"
   ```

3. **Prepare recovery environment:**
   - Ensure sufficient disk space
   - Verify database connectivity
   - Check system permissions

#### Step 4: Recovery Execution (30-120 minutes)

1. **Create recovery plan:**
   ```bash
   ./backup-cli recovery plan <backup-id> -s replace
   ```

2. **Review recovery plan:**
   - Verify tables to be recovered
   - Check estimated duration
   - Assess risks and requirements

3. **Execute recovery:**
   ```bash
   # Full recovery
   ./backup-cli recovery execute <backup-id> -s replace
   
   # Partial recovery (specific tables)
   ./backup-cli recovery execute <backup-id> -t "organizations,users,contacts"
   ```

4. **Monitor recovery progress:**
   - Watch for errors in real-time
   - Verify record counts
   - Check for constraint violations

#### Step 5: System Verification (15-30 minutes)

1. **Database integrity check:**
   ```bash
   # Run health check
   ./backup-cli monitor health
   
   # Check database constraints
   sudo -u postgres psql -d kitchen_pantry -c "\\
     SELECT conname, contype, conrelid::regclass \\
     FROM pg_constraint \\
     WHERE NOT convalidated;"
   ```

2. **Application testing:**
   ```bash
   # Start services
   systemctl start kitchen-pantry-api
   systemctl start kitchen-pantry-worker
   
   # Test critical endpoints
   curl -X GET http://localhost:3000/api/v1/health
   curl -X GET http://localhost:3000/api/v1/organizations
   ```

3. **Data validation:**
   - Verify user login functionality
   - Check data integrity across related tables
   - Validate business-critical workflows

#### Step 6: System Restoration (10-20 minutes)

1. **Start all services:**
   ```bash
   systemctl start kitchen-pantry-api
   systemctl start kitchen-pantry-worker
   systemctl start nginx
   ```

2. **Update monitoring:**
   ```bash
   # Reset monitoring baselines
   ./backup-cli monitor health
   
   # Check for active alerts
   ./backup-cli monitor alerts
   ```

3. **Notify stakeholders:**
   - Confirm system restoration
   - Provide summary of recovery actions
   - Update status page

## Testing and Validation

### Recovery Testing Schedule

- **Monthly**: Test backup restoration in staging environment
- **Quarterly**: Full disaster recovery drill
- **Annually**: Complete business continuity test

### Recovery Test Checklist

```bash
# 1. Create test backup
./backup-cli backup create -n "test-$(date +%Y%m%d)"

# 2. Simulate failure in staging
# (Manually corrupt or remove database)

# 3. Execute recovery
./backup-cli recovery execute <test-backup-id>

# 4. Validate recovery
./backup-cli monitor health

# 5. Test application functionality
# (Run automated test suite)

# 6. Document results
# (Update recovery procedures if needed)
```

### Recovery Validation Criteria

- [ ] All critical tables restored
- [ ] Data integrity constraints satisfied
- [ ] User authentication working
- [ ] Core business workflows functional
- [ ] System performance within acceptable limits
- [ ] No data corruption detected

## Monitoring and Alerting

### Critical Alerts

1. **Backup Failure**
   - Trigger: Backup job fails
   - Action: Immediate investigation
   - Escalation: 15 minutes

2. **Backup Corruption**
   - Trigger: Backup validation fails
   - Action: Create new backup immediately
   - Escalation: 30 minutes

3. **Disk Space Low**
   - Trigger: <10GB available
   - Action: Clean up old backups
   - Escalation: 1 hour

4. **Schedule Missed**
   - Trigger: Backup schedule not executed
   - Action: Manual backup execution
   - Escalation: 2 hours

### Health Check Monitoring

```bash
# Continuous monitoring
./backup-cli monitor health

# Set up monitoring alerts
crontab -e
# Add: */30 * * * * /path/to/backup-cli monitor health --alert-on-failure
```

## Emergency Contacts

### Primary Response Team

| Role | Name | Phone | Email | Availability |
|------|------|-------|--------|--------------|
| Database Administrator | [Name] | [Phone] | [Email] | 24/7 |
| System Administrator | [Name] | [Phone] | [Email] | 24/7 |
| Development Lead | [Name] | [Phone] | [Email] | Business Hours |
| Operations Manager | [Name] | [Phone] | [Email] | Business Hours |

### Escalation Matrix

1. **Level 1** (0-30 minutes): Database Administrator
2. **Level 2** (30-60 minutes): System Administrator + Development Lead
3. **Level 3** (60+ minutes): Operations Manager + Executive Team

### External Contacts

- **Cloud Provider Support**: [Contact Info]
- **Backup Service Provider**: [Contact Info]
- **Security Team**: [Contact Info]
- **Legal/Compliance**: [Contact Info]

## Post-Recovery Procedures

### Immediate Actions (Within 2 hours)

1. **System Monitoring**
   - Enable enhanced monitoring
   - Check for recurring issues
   - Verify backup schedules

2. **Data Validation**
   - Run data integrity checks
   - Verify recent transactions
   - Check for data loss

3. **Performance Assessment**
   - Monitor system performance
   - Check for degradation
   - Optimize if necessary

### Short-term Actions (Within 24 hours)

1. **Incident Documentation**
   - Create incident report
   - Document recovery actions
   - Identify root cause

2. **Security Review**
   - Scan for vulnerabilities
   - Update security measures
   - Review access logs

3. **Communication**
   - Notify all stakeholders
   - Update customers if necessary
   - Prepare status report

### Long-term Actions (Within 1 week)

1. **Process Improvement**
   - Review recovery procedures
   - Update documentation
   - Improve monitoring

2. **Training**
   - Conduct post-incident review
   - Update team training
   - Practice recovery procedures

3. **Infrastructure**
   - Evaluate backup strategy
   - Improve redundancy
   - Update hardware if needed

## Recovery Commands Reference

### Backup Operations
```bash
# Create backup
./backup-cli backup create -n "manual-backup"

# List backups
./backup-cli backup list

# Validate backup
./backup-cli backup validate <backup-id>

# Delete backup
./backup-cli backup delete <backup-id> --force
```

### Recovery Operations
```bash
# Create recovery plan
./backup-cli recovery plan <backup-id>

# Execute recovery
./backup-cli recovery execute <backup-id>

# Dry run recovery
./backup-cli recovery execute <backup-id> --dry-run
```

### Monitoring Operations
```bash
# Health check
./backup-cli monitor health

# View alerts
./backup-cli monitor alerts

# View schedules
./backup-cli schedule list
```

### Database Operations
```bash
# Connect to database
sudo -u postgres psql -d kitchen_pantry

# Check database size
SELECT pg_database_size('kitchen_pantry');

# Check table sizes
SELECT schemaname, tablename, pg_total_relation_size(schemaname||'.'||tablename) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size DESC;
```

## Appendices

### Appendix A: Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| "Backup file not found" | Backup storage issue | Check backup location and permissions |
| "Checksum verification failed" | Backup corruption | Use previous backup or restore from offsite |
| "Database connection failed" | Database service down | Restart PostgreSQL service |
| "Insufficient disk space" | Storage full | Clean up old backups or add storage |

### Appendix B: Recovery Time Estimates

| Scenario | Database Size | Estimated Recovery Time |
|----------|---------------|-------------------------|
| Small (< 1GB) | < 1GB | 15-30 minutes |
| Medium (1-10GB) | 1-10GB | 30-60 minutes |
| Large (10-100GB) | 10-100GB | 1-3 hours |
| Very Large (> 100GB) | > 100GB | 3-8 hours |

### Appendix C: Network Configuration

```bash
# Database connection settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kitchen_pantry
DB_USER=kitchen_pantry_user

# API endpoints
API_URL=http://localhost:3000
HEALTH_CHECK_URL=http://localhost:3000/api/v1/health

# Backup locations
BACKUP_PRIMARY=/opt/kitchen-pantry/backups
BACKUP_SECONDARY=s3://kitchen-pantry-backups
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Date + 6 months]  
**Approved By**: [Name and Title]

*This document should be reviewed and updated regularly to ensure accuracy and effectiveness of disaster recovery procedures.*