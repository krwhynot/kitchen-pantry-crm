# Core Database Entities

**Primary table definitions for Kitchen Pantry CRM core functionality.**

## Organizations Table

**Central hub for all business relationship data in the food service industry.**

### Table Definition

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry_segment VARCHAR(100),
    priority_level VARCHAR(1) CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    business_type VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    website_url VARCHAR(500),
    primary_phone VARCHAR(20),
    primary_email VARCHAR(255),
    billing_address JSONB,
    shipping_address JSONB,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2),
    account_status VARCHAR(20) DEFAULT 'active',
    assigned_user_id UUID REFERENCES users(id),
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    relationship_strength INTEGER CHECK (relationship_strength BETWEEN 1 AND 10),
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

### Key Features

- **Industry Classification:** Fine Dining, Fast Food, Healthcare, Education, Corporate Catering
- **Priority Levels:** A-D classification for account prioritization
- **Financial Tracking:** Revenue, credit limits, payment terms
- **Address Storage:** JSONB format for flexible address structures
- **Relationship Scoring:** 1-10 scale for relationship strength measurement

### Business Rules

- **Priority levels** must be A, B, C, or D
- **Relationship strength** scored 1-10 (10 = strongest)
- **Account status** defaults to 'active'
- **Soft deletion** preserves historical data

---

## Contacts Table

**Individual people within organizations with detailed relationship tracking.**

### Table Definition

```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    job_title VARCHAR(150),
    department VARCHAR(100),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    is_decision_maker BOOLEAN DEFAULT FALSE,
    authority_level INTEGER CHECK (authority_level BETWEEN 1 AND 5),
    email_primary VARCHAR(255),
    email_secondary VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    mobile_phone VARCHAR(20),
    preferred_contact_method VARCHAR(20) DEFAULT 'email',
    preferred_contact_time VARCHAR(50),
    linkedin_url VARCHAR(500),
    birthday DATE,
    anniversary DATE,
    communication_preferences JSONB,
    interests TEXT[],
    dietary_restrictions TEXT[],
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    relationship_score INTEGER CHECK (relationship_score BETWEEN 1 AND 10),
    influence_score INTEGER CHECK (influence_score BETWEEN 1 AND 10),
    engagement_level VARCHAR(20) DEFAULT 'medium',
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

### Key Features

- **Auto-generated full name** from first_name + last_name
- **Authority tracking** with 1-5 decision-making power scale
- **Influence scoring** separate from formal authority
- **Communication preferences** stored as flexible JSONB
- **Personal details** for relationship building (birthday, interests)

### Business Rules

- **Authority level** ranges 1-5 (5 = highest decision-making power)
- **Relationship and influence scores** both use 1-10 scale
- **Preferred contact method** defaults to 'email'
- **Cascading deletion** when parent organization is deleted

---

## Interactions Table

**Comprehensive activity tracking for all customer touchpoints.**

### Table Definition

```sql
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    subject VARCHAR(255),
    description TEXT,
    outcome VARCHAR(100),
    outcome_details TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    location VARCHAR(255),
    meeting_attendees TEXT[],
    documents_shared TEXT[],
    next_steps TEXT,
    sentiment_score INTEGER CHECK (sentiment_score BETWEEN 1 AND 5),
    opportunity_id UUID REFERENCES opportunities(id),
    parent_interaction_id UUID REFERENCES interactions(id),
    interaction_status VARCHAR(20) DEFAULT 'completed',
    priority_level VARCHAR(1) CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

### Key Features

- **Interaction types:** CALL, EMAIL, MEETING, VISIT, DEMO, PROPOSAL, FOLLOW_UP
- **Outcome tracking** with categorical outcomes and detailed descriptions
- **Follow-up management** with automated workflow triggers
- **Sentiment analysis** with 1-5 emotional context scoring
- **Hierarchical interactions** via parent_interaction_id

### Business Rules

- **Sentiment score** ranges 1-5 (1 = very negative, 5 = very positive)
- **Interaction status** defaults to 'completed'
- **Follow-up tracking** with dedicated boolean and date fields
- **Organization link required**, contact link optional

---

## Opportunities Table

**Sales pipeline management with comprehensive tracking.**

### Table Definition

```sql
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    primary_contact_id UUID REFERENCES contacts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    opportunity_name VARCHAR(255) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(50),
    stage VARCHAR(50) NOT NULL DEFAULT 'prospecting',
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    estimated_value DECIMAL(15,2),
    estimated_close_date DATE,
    actual_close_date DATE,
    sales_cycle_days INTEGER,
    lead_source VARCHAR(100),
    competitor_info TEXT,
    decision_criteria TEXT,
    decision_timeline VARCHAR(100),
    budget_confirmed BOOLEAN DEFAULT FALSE,
    authority_confirmed BOOLEAN DEFAULT FALSE,
    need_confirmed BOOLEAN DEFAULT FALSE,
    timeline_confirmed BOOLEAN DEFAULT FALSE,
    proposal_submitted BOOLEAN DEFAULT FALSE,
    proposal_date DATE,
    contract_terms TEXT,
    win_loss_reason TEXT,
    lessons_learned TEXT,
    priority_level VARCHAR(1) CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

### Key Features

- **Sales stages:** prospecting, qualification, proposal, negotiation, closed-won, closed-lost
- **BANT qualification** tracking (Budget, Authority, Need, Timeline)
- **Competitive intelligence** with competitor_info and decision_criteria
- **Win/loss analysis** with detailed reason tracking
- **Sales cycle calculation** from creation to close

### Business Rules

- **Probability** ranges 0-100 percent
- **Stage** defaults to 'prospecting'
- **BANT fields** track qualification progress
- **Sales cycle days** calculated automatically on close

---

## Users Table

**CRM system users with role-based access control.**

### Table Definition

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    job_title VARCHAR(150),
    department VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
    manager_id UUID REFERENCES users(id),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    office_location VARCHAR(255),
    hire_date DATE,
    employment_status VARCHAR(20) DEFAULT 'active',
    quota_annual DECIMAL(15,2),
    commission_rate DECIMAL(5,4),
    performance_metrics JSONB,
    preferences JSONB,
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features

- **Supabase Auth integration** via auth.users(id) reference
- **Role hierarchy:** admin, manager, sales_rep, read_only
- **Manager relationships** creating reporting structures
- **Performance tracking** with quotas and commission rates
- **Flexible preferences** stored as JSONB

### Business Rules

- **Role** defaults to 'sales_rep'
- **Employment status** defaults to 'active'
- **Manager relationships** create reporting hierarchy
- **Performance metrics** stored as flexible JSONB structure

## Entity Relationships

### Primary Relationships

- **Organizations** → **Contacts** (1:N, CASCADE DELETE)
- **Organizations** → **Interactions** (1:N, CASCADE DELETE)
- **Organizations** → **Opportunities** (1:N, CASCADE DELETE)
- **Contacts** → **Interactions** (1:N, SET NULL)
- **Users** → **Organizations** (1:N, SET NULL on user deletion)

### Key Constraints

- **Foreign keys** maintain referential integrity
- **Check constraints** enforce business rules
- **Unique constraints** prevent duplicate data
- **Generated columns** ensure data consistency

