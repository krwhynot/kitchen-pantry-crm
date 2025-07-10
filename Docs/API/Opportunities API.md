# Opportunities API

**Kitchen Pantry CRM Sales Opportunity Management Endpoints**

This module handles sales pipeline management, opportunity tracking, and revenue forecasting for food service sales teams.

---

## Opportunity Overview

**Resource:** Sales opportunity records with pipeline stages and revenue tracking  
**Pipeline:** Customizable sales stages from lead to closed-won/lost  
**Features:** Revenue forecasting, probability scoring, competitive analysis  

---

## Get All Opportunities

### GET /opportunities

**Purpose:** Retrieve paginated list of opportunities with filtering and pipeline analysis.

**Request Parameters:**
```typescript
interface GetOpportunitiesParams {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20, max: 100)
  search?: string;         // Search in title, description, customer name
  stage?: OpportunityStage;
  customerId?: string;     // Filter by customer
  assignedTo?: string;     // Filter by assigned user
  minValue?: number;       // Minimum opportunity value
  maxValue?: number;       // Maximum opportunity value
  probability?: number;    // Minimum probability percentage
  expectedCloseFrom?: string; // ISO date string
  expectedCloseTo?: string;   // ISO date string
  status?: 'open' | 'won' | 'lost' | 'on_hold';
  sort?: 'value' | 'probability' | 'expectedClose' | 'createdAt';
  order?: 'asc' | 'desc';
}

type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
```

**Response Format:**
```typescript
interface GetOpportunitiesResponse {
  success: true;
  data: Opportunity[];
  meta: PaginationMeta & {
    pipelineStats: {
      totalValue: number;
      weightedValue: number;
      averageDealSize: number;
      conversionRate: number;
    };
  };
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  stage: OpportunityStage;
  status: 'open' | 'won' | 'lost' | 'on_hold';
  value: number;
  probability: number;      // Percentage (0-100)
  expectedCloseDate: string;
  actualCloseDate?: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  assignedTo: string;
  assignedToName: string;
  products: OpportunityProduct[];
  competitors: Competitor[];
  activities: ActivitySummary;
  customFields: Record<string, any>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

interface OpportunityProduct {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  margin?: number;
}

interface Competitor {
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: number;
  status: 'active' | 'eliminated' | 'unknown';
}

interface ActivitySummary {
  totalActivities: number;
  lastActivityType: string;
  lastActivityDate: string;
  nextFollowUp?: string;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities?stage=proposal,negotiation&minValue=10000&sort=value&order=desc', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data, meta } = await response.json();
console.log(`Pipeline value: $${meta.pipelineStats.totalValue}`);
console.log(`Weighted value: $${meta.pipelineStats.weightedValue}`);
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "opp_1234567890",
      "title": "Q1 Seasonal Menu Expansion",
      "description": "Opportunity to supply organic vegetables and specialty ingredients for new spring menu launch",
      "stage": "proposal",
      "status": "open",
      "value": 75000,
      "probability": 70,
      "expectedCloseDate": "2025-02-15T00:00:00Z",
      "customerId": "cust_1234567890",
      "customerName": "Acme Restaurant Group",
      "contactId": "cont_1234567890",
      "contactName": "John Smith",
      "assignedTo": "usr_1234567890",
      "assignedToName": "Sarah Johnson",
      "products": [
        {
          "id": "opprod_1234567890",
          "productId": "prod_1234567890",
          "productName": "Organic Spring Vegetables Mix",
          "quantity": 500,
          "unitPrice": 120,
          "totalPrice": 60000,
          "margin": 25
        },
        {
          "id": "opprod_1234567891",
          "productId": "prod_1234567891",
          "productName": "Artisanal Herb Collection",
          "quantity": 100,
          "unitPrice": 150,
          "totalPrice": 15000,
          "margin": 30
        }
      ],
      "competitors": [
        {
          "id": "comp_1234567890",
          "name": "Fresh Foods Distributor",
          "strengths": ["Lower pricing", "Established relationship"],
          "weaknesses": ["Limited organic selection", "Inconsistent quality"],
          "pricing": 65000,
          "status": "active"
        }
      ],
      "activities": {
        "totalActivities": 8,
        "lastActivityType": "meeting",
        "lastActivityDate": "2025-01-14T14:00:00Z",
        "nextFollowUp": "2025-01-18T10:00:00Z"
      },
      "customFields": {
        "menuLaunchDate": "2025-03-01",
        "decisionMakers": ["Head Chef", "Purchasing Manager"],
        "budgetApproved": true
      },
      "tags": ["organic", "seasonal", "high-value"],
      "createdAt": "2024-12-15T10:00:00Z",
      "updatedAt": "2025-01-14T14:30:00Z",
      "lastActivityAt": "2025-01-14T14:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 23,
    "totalPages": 2,
    "hasMore": true,
    "pipelineStats": {
      "totalValue": 1250000,
      "weightedValue": 875000,
      "averageDealSize": 54348,
      "conversionRate": 68.5
    }
  }
}
```

**Error Handling:**
- **400:** Invalid query parameters
- **401:** Authentication required
- **403:** Insufficient permissions

---

## Get Opportunity by ID

### GET /opportunities/{id}

**Purpose:** Retrieve detailed information for a specific opportunity including full activity history.

**Request Parameters:**
```typescript
interface GetOpportunityParams {
  id: string;              // Opportunity ID
  include?: string[];      // Optional: ['activities', 'documents', 'quotes']
}
```

**Response Format:**
```typescript
interface GetOpportunityResponse {
  success: true;
  data: OpportunityDetail;
}

interface OpportunityDetail extends Opportunity {
  customer: CustomerSummary;
  contact?: ContactSummary;
  assignedUser: UserSummary;
  activities?: Activity[];
  documents?: Document[];
  quotes?: Quote[];
  stageHistory: StageChange[];
  notes: Note[];
}

interface StageChange {
  id: string;
  fromStage: OpportunityStage;
  toStage: OpportunityStage;
  changedBy: string;
  changedAt: string;
  reason?: string;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities/opp_1234567890?include=activities,documents', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Opportunity:', data.title);
console.log('Stage:', data.stage);
console.log('Activities:', data.activities?.length);
```

**Error Handling:**
- **404:** Opportunity not found
- **403:** No access to this opportunity

---

## Create Opportunity

### POST /opportunities

**Purpose:** Create a new sales opportunity with products and competitive information.

**Request Parameters:**
```typescript
interface CreateOpportunityRequest {
  title: string;           // Required: Opportunity title
  description: string;
  customerId: string;      // Required: Customer ID
  contactId?: string;      // Primary contact for opportunity
  value: number;           // Estimated opportunity value
  probability?: number;    // Win probability (default: 50)
  expectedCloseDate: string; // ISO date string
  stage?: OpportunityStage; // Default: 'lead'
  products?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  competitors?: Array<{
    name: string;
    strengths?: string[];
    weaknesses?: string[];
    pricing?: number;
  }>;
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
}
```

**Response Format:**
```typescript
interface CreateOpportunityResponse {
  success: true;
  data: Opportunity;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Summer Beverage Program',
    description: 'Opportunity to supply premium beverage ingredients for summer cocktail menu',
    customerId: 'cust_1234567890',
    contactId: 'cont_1234567890',
    value: 45000,
    probability: 60,
    expectedCloseDate: '2025-03-01T00:00:00Z',
    stage: 'qualified',
    products: [
      {
        productId: 'prod_2234567890',
        quantity: 200,
        unitPrice: 180
      },
      {
        productId: 'prod_2234567891',
        quantity: 50,
        unitPrice: 90
      }
    ],
    competitors: [
      {
        name: 'Premium Beverage Supply',
        strengths: ['Brand recognition', 'Marketing support'],
        weaknesses: ['Higher pricing', 'Limited customization'],
        pricing: 50000
      }
    ],
    customFields: {
      menuType: 'cocktails',
      seasonality: 'summer',
      volumeCommitment: '6 months'
    },
    tags: ['beverage', 'seasonal', 'premium'],
    notes: 'Customer is looking for unique ingredients to differentiate their summer menu'
  })
});

const { data } = await response.json();
console.log('Created opportunity:', data.id);
```

**Error Handling:**
- **400:** Invalid request data
- **404:** Customer or contact not found
- **422:** Validation errors

---

## Update Opportunity Stage

### PATCH /opportunities/{id}/stage

**Purpose:** Move opportunity to a different pipeline stage with reason and notes.

**Request Parameters:**
```typescript
interface UpdateStageRequest {
  stage: OpportunityStage;
  probability?: number;    // Update win probability
  reason?: string;         // Reason for stage change
  notes?: string;          // Additional notes
  expectedCloseDate?: string; // Update close date if needed
}
```

**Response Format:**
```typescript
interface UpdateStageResponse {
  success: true;
  data: {
    opportunity: Opportunity;
    stageChange: StageChange;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities/opp_1234567890/stage', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stage: 'negotiation',
    probability: 85,
    reason: 'Customer approved proposal, now negotiating terms',
    notes: 'They want to discuss volume discounts and delivery schedule',
    expectedCloseDate: '2025-02-10T00:00:00Z'
  })
});

const { data } = await response.json();
console.log('Stage updated to:', data.opportunity.stage);
```

**Error Handling:**
- **404:** Opportunity not found
- **400:** Invalid stage transition
- **403:** No permission to update stage

---

## Add Products to Opportunity

### POST /opportunities/{id}/products

**Purpose:** Add or update products associated with an opportunity.

**Request Parameters:**
```typescript
interface AddProductsRequest {
  products: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  replaceExisting?: boolean; // Replace all existing products
}
```

**Response Format:**
```typescript
interface AddProductsResponse {
  success: true;
  data: {
    products: OpportunityProduct[];
    totalValue: number;
    margin: number;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities/opp_1234567890/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    products: [
      {
        productId: 'prod_3234567890',
        quantity: 100,
        unitPrice: 250,
        notes: 'Premium grade requested'
      }
    ],
    replaceExisting: false
  })
});

const { data } = await response.json();
console.log('Total opportunity value:', data.totalValue);
```

**Error Handling:**
- **404:** Opportunity or product not found
- **400:** Invalid product data

---

## Generate Quote

### POST /opportunities/{id}/quotes

**Purpose:** Generate a formal quote document for the opportunity.

**Request Parameters:**
```typescript
interface GenerateQuoteRequest {
  validUntil: string;      // ISO date string
  terms?: string;          // Payment terms
  notes?: string;          // Additional notes
  includeProducts?: string[]; // Specific product IDs to include
  discountPercent?: number;
  template?: string;       // Quote template ID
}
```

**Response Format:**
```typescript
interface GenerateQuoteResponse {
  success: true;
  data: {
    quote: {
      id: string;
      quoteNumber: string;
      url: string;
      totalValue: number;
      discountAmount: number;
      finalValue: number;
      validUntil: string;
      status: 'draft' | 'sent' | 'accepted' | 'expired';
      createdAt: string;
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities/opp_1234567890/quotes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    validUntil: '2025-02-28T23:59:59Z',
    terms: 'Net 30 days',
    notes: 'Volume discount applied for 6-month commitment',
    discountPercent: 5
  })
});

const { data } = await response.json();
console.log('Quote generated:', data.quote.quoteNumber);
console.log('Quote URL:', data.quote.url);
```

**Error Handling:**
- **404:** Opportunity not found
- **400:** Invalid quote parameters

---

## Pipeline Analytics

### GET /opportunities/pipeline

**Purpose:** Get comprehensive pipeline analytics and forecasting data.

**Request Parameters:**
```typescript
interface GetPipelineParams {
  period?: 'month' | 'quarter' | 'year';
  startDate?: string;      // ISO date string
  endDate?: string;        // ISO date string
  userId?: string;         // Filter by user
  teamId?: string;         // Filter by team
  includeForecasting?: boolean;
}
```

**Response Format:**
```typescript
interface GetPipelineResponse {
  success: true;
  data: {
    summary: {
      totalOpportunities: number;
      totalValue: number;
      weightedValue: number;
      averageDealSize: number;
      averageSalesCycle: number; // Days
      conversionRate: number;
    };
    byStage: Array<{
      stage: OpportunityStage;
      count: number;
      value: number;
      averageAge: number;
      conversionRate: number;
    }>;
    forecast: {
      thisMonth: number;
      nextMonth: number;
      thisQuarter: number;
      confidence: 'high' | 'medium' | 'low';
    };
    trends: {
      velocityTrend: 'increasing' | 'decreasing' | 'stable';
      valueTrend: 'increasing' | 'decreasing' | 'stable';
      winRateTrend: 'increasing' | 'decreasing' | 'stable';
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/opportunities/pipeline?period=quarter&includeForecasting=true', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Pipeline value:', data.summary.totalValue);
console.log('Forecast confidence:', data.forecast.confidence);
```

**Error Handling:**
- **400:** Invalid date range or parameters
- **403:** No access to pipeline analytics

---

## Close Opportunity

### PATCH /opportunities/{id}/close

**Purpose:** Close an opportunity as won or lost with detailed outcome information.

**Request Parameters:**
```typescript
interface CloseOpportunityRequest {
  status: 'won' | 'lost';
  actualValue?: number;    // Final deal value (for won deals)
  closeDate?: string;      // ISO date string, defaults to now
  reason?: string;         // Win/loss reason
  competitorWon?: string;  // Competitor name (for lost deals)
  notes?: string;          // Additional notes
  nextSteps?: string;      // Future opportunities or follow-up
}
```

**Response Format:**
```typescript
interface CloseOpportunityResponse {
  success: true;
  data: {
    opportunity: Opportunity;
    outcome: {
      status: 'won' | 'lost';
      actualValue?: number;
      variance?: number;     // Difference from estimated value
      salesCycle: number;    // Days from creation to close
      reason?: string;
    };
  };
}
```

**Example Usage:**
```typescript
// Close as won
const response = await fetch('/api/v1/opportunities/opp_1234567890/close', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'won',
    actualValue: 72000,
    reason: 'Customer chose us for quality and service',
    notes: 'Signed 12-month contract with option to extend',
    nextSteps: 'Explore opportunities for other locations'
  })
});

const { data } = await response.json();
console.log('Deal closed:', data.outcome.status);
console.log('Final value:', data.outcome.actualValue);
```

**Error Handling:**
- **404:** Opportunity not found
- **400:** Invalid close status or data
- **409:** Opportunity already closed

This opportunity management system provides comprehensive sales pipeline tracking, forecasting, and analytics optimized for food service sales teams with complex product configurations and competitive landscapes.

