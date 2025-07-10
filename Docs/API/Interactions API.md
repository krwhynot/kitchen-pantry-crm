# Interactions API

**Kitchen Pantry CRM Interaction Management Endpoints**

This module handles customer interaction logging, activity tracking, and follow-up management for sales teams.

---

## Interaction Overview

**Resource:** Customer interaction records including calls, meetings, emails, and demos  
**Types:** Call, Email, Meeting, Demo, Follow-up, Note  
**Features:** GPS location tracking, file attachments, automated follow-ups  

---

## Get All Interactions

### GET /interactions

**Purpose:** Retrieve paginated list of interactions with filtering and sorting options.

**Request Parameters:**
```typescript
interface GetInteractionsParams {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20, max: 100)
  customerId?: string;     // Filter by customer
  contactId?: string;      // Filter by contact
  userId?: string;         // Filter by user
  type?: InteractionType;  // Filter by interaction type
  dateFrom?: string;       // ISO date string
  dateTo?: string;         // ISO date string
  hasFollowUp?: boolean;   // Filter interactions with follow-ups
  sort?: 'date' | 'type' | 'customer' | 'duration';
  order?: 'asc' | 'desc';
}

type InteractionType = 'call' | 'email' | 'meeting' | 'demo' | 'follow_up' | 'note';
```

**Response Format:**
```typescript
interface GetInteractionsResponse {
  success: true;
  data: Interaction[];
  meta: PaginationMeta;
}

interface Interaction {
  id: string;
  type: InteractionType;
  subject: string;
  description: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  userId: string;
  userName: string;
  date: string;
  duration?: number;       // Duration in minutes
  outcome: 'positive' | 'neutral' | 'negative' | 'no_answer';
  nextAction?: string;
  followUpDate?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  attachments: Attachment[];
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/interactions?customerId=cust_123&type=meeting&dateFrom=2025-01-01', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data, meta } = await response.json();
console.log(`Found ${meta.total} interactions`);
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "int_1234567890",
      "type": "meeting",
      "subject": "Product Demo - New Menu Items",
      "description": "Demonstrated our new seasonal product line. Chef was very interested in the organic vegetables.",
      "customerId": "cust_1234567890",
      "customerName": "Acme Restaurant Group",
      "contactId": "cont_1234567890",
      "contactName": "John Smith",
      "userId": "usr_1234567890",
      "userName": "Sarah Johnson",
      "date": "2025-01-14T14:00:00Z",
      "duration": 45,
      "outcome": "positive",
      "nextAction": "Send pricing proposal for organic vegetables",
      "followUpDate": "2025-01-16T10:00:00Z",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "123 Main St, New York, NY 10001"
      },
      "attachments": [
        {
          "id": "att_1234567890",
          "name": "product_catalog.pdf",
          "url": "https://files.kitchenpantrycrm.com/att_1234567890",
          "size": 2048576,
          "type": "application/pdf"
        }
      ],
      "tags": ["demo", "organic", "high-priority"],
      "customFields": {
        "menuCategory": "vegetables",
        "seasonalInterest": true
      },
      "createdAt": "2025-01-14T14:45:00Z",
      "updatedAt": "2025-01-14T14:45:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasMore": false
  }
}
```

**Error Handling:**
- **400:** Invalid query parameters
- **401:** Authentication required
- **403:** Insufficient permissions

---

## Get Interaction by ID

### GET /interactions/{id}

**Purpose:** Retrieve detailed information for a specific interaction.

**Request Parameters:**
```typescript
interface GetInteractionParams {
  id: string;              // Interaction ID
}
```

**Response Format:**
```typescript
interface GetInteractionResponse {
  success: true;
  data: InteractionDetail;
}

interface InteractionDetail extends Interaction {
  customer: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  contact?: {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  relatedInteractions: Interaction[];
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/interactions/int_1234567890', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Interaction:', data.subject);
console.log('Customer:', data.customer.name);
```

**Error Handling:**
- **404:** Interaction not found
- **403:** No access to this interaction

---

## Create Interaction

### POST /interactions

**Purpose:** Log a new customer interaction with details and attachments.

**Request Parameters:**
```typescript
interface CreateInteractionRequest {
  type: InteractionType;
  subject: string;
  description: string;
  customerId: string;
  contactId?: string;
  date?: string;           // ISO date string, defaults to now
  duration?: number;       // Duration in minutes
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_answer';
  nextAction?: string;
  followUpDate?: string;   // ISO date string
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  attachmentIds?: string[]; // Pre-uploaded attachment IDs
  tags?: string[];
  customFields?: Record<string, any>;
}
```

**Response Format:**
```typescript
interface CreateInteractionResponse {
  success: true;
  data: Interaction;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/interactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'call',
    subject: 'Follow-up on pricing proposal',
    description: 'Called to discuss the pricing proposal sent last week. Customer needs time to review with their team.',
    customerId: 'cust_1234567890',
    contactId: 'cont_1234567890',
    duration: 15,
    outcome: 'neutral',
    nextAction: 'Call back next week for decision',
    followUpDate: '2025-01-22T10:00:00Z',
    tags: ['follow-up', 'pricing'],
    customFields: {
      callQuality: 'good',
      decisionTimeframe: '1-2 weeks'
    }
  })
});

const { data } = await response.json();
console.log('Created interaction:', data.id);
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "int_9876543210",
    "type": "call",
    "subject": "Follow-up on pricing proposal",
    "description": "Called to discuss the pricing proposal sent last week. Customer needs time to review with their team.",
    "customerId": "cust_1234567890",
    "customerName": "Acme Restaurant Group",
    "contactId": "cont_1234567890",
    "contactName": "John Smith",
    "userId": "usr_1234567890",
    "userName": "Sarah Johnson",
    "date": "2025-01-15T15:30:00Z",
    "duration": 15,
    "outcome": "neutral",
    "nextAction": "Call back next week for decision",
    "followUpDate": "2025-01-22T10:00:00Z",
    "attachments": [],
    "tags": ["follow-up", "pricing"],
    "customFields": {
      "callQuality": "good",
      "decisionTimeframe": "1-2 weeks"
    },
    "createdAt": "2025-01-15T15:30:00Z",
    "updatedAt": "2025-01-15T15:30:00Z"
  }
}
```

**Error Handling:**
- **400:** Invalid request data
- **404:** Customer or contact not found
- **422:** Validation errors

---

## Quick Log Interaction

### POST /interactions/quick-log

**Purpose:** Quickly log an interaction with minimal required fields (mobile-optimized).

**Request Parameters:**
```typescript
interface QuickLogRequest {
  type: InteractionType;
  customerId: string;
  notes: string;           // Brief interaction notes
  outcome?: 'positive' | 'neutral' | 'negative';
  autoLocation?: boolean;  // Capture GPS location
}
```

**Response Format:**
```typescript
interface QuickLogResponse {
  success: true;
  data: {
    id: string;
    message: string;
  };
}
```

**Example Usage:**
```typescript
// Mobile quick log
const response = await fetch('/api/v1/interactions/quick-log', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'meeting',
    customerId: 'cust_1234567890',
    notes: 'Quick check-in meeting. All going well, will order next week.',
    outcome: 'positive',
    autoLocation: true
  })
});
```

**Error Handling:**
- **400:** Missing required fields
- **404:** Customer not found

---

## Update Interaction

### PUT /interactions/{id}

**Purpose:** Update existing interaction details.

**Request Parameters:**
```typescript
interface UpdateInteractionRequest {
  subject?: string;
  description?: string;
  type?: InteractionType;
  duration?: number;
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_answer';
  nextAction?: string;
  followUpDate?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}
```

**Response Format:**
```typescript
interface UpdateInteractionResponse {
  success: true;
  data: Interaction;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/interactions/int_9876543210', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    outcome: 'positive',
    nextAction: 'Send contract for signature',
    followUpDate: '2025-01-18T14:00:00Z',
    customFields: {
      decisionMade: true,
      contractValue: 25000
    }
  })
});
```

**Error Handling:**
- **404:** Interaction not found
- **403:** No permission to update
- **422:** Validation errors

---

## Delete Interaction

### DELETE /interactions/{id}

**Purpose:** Delete an interaction record.

**Request Parameters:**
```typescript
interface DeleteInteractionParams {
  id: string;              // Interaction ID
}
```

**Response Format:**
```typescript
interface DeleteInteractionResponse {
  success: true;
  data: {
    message: string;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/interactions/int_9876543210', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Error Handling:**
- **404:** Interaction not found
- **403:** No permission to delete

---

## Get Customer Interactions

### GET /customers/{customerId}/interactions

**Purpose:** Get all interactions for a specific customer.

**Request Parameters:**
```typescript
interface GetCustomerInteractionsParams {
  customerId: string;
  page?: number;
  limit?: number;
  type?: InteractionType;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'date' | 'type';
  order?: 'asc' | 'desc';
}
```

**Response Format:**
```typescript
interface GetCustomerInteractionsResponse {
  success: true;
  data: {
    customer: {
      id: string;
      name: string;
    };
    interactions: Interaction[];
    summary: {
      totalInteractions: number;
      lastInteractionDate: string;
      interactionsByType: Record<InteractionType, number>;
      averageOutcome: string;
    };
  };
  meta: PaginationMeta;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers/cust_1234567890/interactions?limit=50&sort=date&order=desc', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log(`${data.customer.name} has ${data.summary.totalInteractions} interactions`);
```

**Error Handling:**
- **404:** Customer not found
- **403:** No access to customer interactions

---

## Upload Attachment

### POST /interactions/attachments

**Purpose:** Upload file attachment for interactions.

**Request Parameters:**
```typescript
interface UploadAttachmentRequest {
  file: File;              // File to upload
  description?: string;    // File description
}
```

**Response Format:**
```typescript
interface UploadAttachmentResponse {
  success: true;
  data: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  };
}
```

**Example Usage:**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'Product catalog for demo');

const response = await fetch('/api/v1/interactions/attachments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const { data } = await response.json();
console.log('Uploaded attachment:', data.id);
```

**Error Handling:**
- **400:** Invalid file type or size
- **413:** File too large (max 10MB)
- **422:** Missing file

This interaction management system provides comprehensive logging, tracking, and follow-up capabilities optimized for mobile sales teams in the food service industry.

