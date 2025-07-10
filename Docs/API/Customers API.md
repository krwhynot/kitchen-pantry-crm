# Customers API

**Kitchen Pantry CRM Customer Management Endpoints**

This module handles customer CRUD operations, search, filtering, and relationship management for food service businesses.

---

## Customer Overview

**Resource:** Customer records with business information, contacts, and interaction history  
**Permissions:** Based on user role (sales_rep, manager, admin)  
**Relationships:** Linked to contacts, interactions, and opportunities  

---

## Get All Customers

### GET /customers

**Purpose:** Retrieve paginated list of customers with optional filtering and sorting.

**Request Parameters:**
```typescript
interface GetCustomersParams {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20, max: 100)
  search?: string;         // Search in name, email, company
  status?: 'active' | 'inactive' | 'prospect' | 'archived';
  type?: 'restaurant' | 'distributor' | 'supplier' | 'other';
  industry?: string;       // Industry filter
  assignedTo?: string;     // User ID filter
  sort?: 'name' | 'createdAt' | 'lastInteraction' | 'revenue';
  order?: 'asc' | 'desc';  // Sort direction
}
```

**Response Format:**
```typescript
interface GetCustomersResponse {
  success: true;
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface Customer {
  id: string;
  name: string;
  type: 'restaurant' | 'distributor' | 'supplier' | 'other';
  status: 'active' | 'inactive' | 'prospect' | 'archived';
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address: Address;
  assignedTo: string;
  tags: string[];
  customFields: Record<string, any>;
  stats: {
    totalRevenue: number;
    totalInteractions: number;
    lastInteractionAt?: string;
    opportunitiesCount: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers?page=1&limit=20&status=active&sort=name', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data, meta } = await response.json();
console.log(`Found ${meta.total} customers`);
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust_1234567890",
      "name": "Acme Restaurant Group",
      "type": "restaurant",
      "status": "active",
      "industry": "Fine Dining",
      "website": "https://acmerestaurants.com",
      "phone": "+1-555-0123",
      "email": "info@acmerestaurants.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "assignedTo": "usr_1234567890",
      "tags": ["high-value", "chain"],
      "customFields": {
        "locations": 15,
        "preferredDeliveryDay": "Tuesday"
      },
      "stats": {
        "totalRevenue": 125000,
        "totalInteractions": 45,
        "lastInteractionAt": "2025-01-14T15:30:00Z",
        "opportunitiesCount": 3
      },
      "createdAt": "2024-06-15T10:00:00Z",
      "updatedAt": "2025-01-14T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasMore": true
  }
}
```

**Error Handling:**
- **400:** Invalid query parameters
- **401:** Authentication required
- **403:** Insufficient permissions

---

## Get Customer by ID

### GET /customers/{id}

**Purpose:** Retrieve detailed information for a specific customer.

**Request Parameters:**
```typescript
interface GetCustomerParams {
  id: string;              // Customer ID
  include?: string[];      // Optional: ['contacts', 'interactions', 'opportunities']
}
```

**Response Format:**
```typescript
interface GetCustomerResponse {
  success: true;
  data: CustomerDetail;
}

interface CustomerDetail extends Customer {
  contacts?: Contact[];
  interactions?: Interaction[];
  opportunities?: Opportunity[];
  notes: Note[];
  documents: Document[];
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers/cust_1234567890?include=contacts,interactions', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Customer:', data.name);
console.log('Contacts:', data.contacts?.length);
```

**Error Handling:**
- **404:** Customer not found
- **403:** No access to this customer

---

## Create Customer

### POST /customers

**Purpose:** Create a new customer record with business information.

**Request Parameters:**
```typescript
interface CreateCustomerRequest {
  name: string;            // Required: Customer name
  type: 'restaurant' | 'distributor' | 'supplier' | 'other';
  status?: 'active' | 'inactive' | 'prospect'; // Default: 'prospect'
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: Partial<Address>;
  assignedTo?: string;     // User ID, defaults to current user
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}
```

**Response Format:**
```typescript
interface CreateCustomerResponse {
  success: true;
  data: Customer;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Blue Ocean Bistro',
    type: 'restaurant',
    status: 'prospect',
    industry: 'Casual Dining',
    phone: '+1-555-0456',
    email: 'manager@blueoceanbistro.com',
    address: {
      street: '456 Ocean Ave',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139'
    },
    tags: ['new-prospect', 'seafood'],
    customFields: {
      seatingCapacity: 120,
      cuisineType: 'Seafood'
    }
  })
});

const { data } = await response.json();
console.log('Created customer:', data.id);
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust_9876543210",
    "name": "Blue Ocean Bistro",
    "type": "restaurant",
    "status": "prospect",
    "industry": "Casual Dining",
    "phone": "+1-555-0456",
    "email": "manager@blueoceanbistro.com",
    "address": {
      "street": "456 Ocean Ave",
      "city": "Miami",
      "state": "FL",
      "zipCode": "33139",
      "country": "US"
    },
    "assignedTo": "usr_1234567890",
    "tags": ["new-prospect", "seafood"],
    "customFields": {
      "seatingCapacity": 120,
      "cuisineType": "Seafood"
    },
    "stats": {
      "totalRevenue": 0,
      "totalInteractions": 0,
      "opportunitiesCount": 0
    },
    "createdAt": "2025-01-15T14:20:00Z",
    "updatedAt": "2025-01-15T14:20:00Z"
  }
}
```

**Error Handling:**
- **400:** Invalid request data, duplicate customer name
- **422:** Validation errors (invalid email, phone format)

---

## Update Customer

### PUT /customers/{id}

**Purpose:** Update existing customer information.

**Request Parameters:**
```typescript
interface UpdateCustomerRequest {
  name?: string;
  type?: 'restaurant' | 'distributor' | 'supplier' | 'other';
  status?: 'active' | 'inactive' | 'prospect' | 'archived';
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: Partial<Address>;
  assignedTo?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}
```

**Response Format:**
```typescript
interface UpdateCustomerResponse {
  success: true;
  data: Customer;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers/cust_9876543210', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'active',
    website: 'https://blueoceanbistro.com',
    customFields: {
      seatingCapacity: 150,
      cuisineType: 'Seafood',
      hasPrivateDining: true
    }
  })
});
```

**Error Handling:**
- **404:** Customer not found
- **403:** No permission to update this customer
- **409:** Conflict with existing data

---

## Delete Customer

### DELETE /customers/{id}

**Purpose:** Soft delete a customer (archives the record).

**Request Parameters:**
```typescript
interface DeleteCustomerParams {
  id: string;              // Customer ID
  force?: boolean;         // Hard delete (admin only)
}
```

**Response Format:**
```typescript
interface DeleteCustomerResponse {
  success: true;
  data: {
    message: string;
    deletedAt: string;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers/cust_9876543210', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log(data.message);
```

**Error Handling:**
- **404:** Customer not found
- **403:** No permission to delete
- **409:** Customer has active opportunities

---

## Search Customers

### GET /customers/search

**Purpose:** Advanced customer search with full-text search and filters.

**Request Parameters:**
```typescript
interface SearchCustomersParams {
  q: string;               // Search query
  filters?: {
    status?: string[];
    type?: string[];
    industry?: string[];
    tags?: string[];
    assignedTo?: string[];
    revenueMin?: number;
    revenueMax?: number;
    lastInteractionBefore?: string;
    lastInteractionAfter?: string;
  };
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

**Response Format:**
```typescript
interface SearchCustomersResponse {
  success: true;
  data: {
    customers: Customer[];
    highlights: Record<string, string[]>;
    suggestions: string[];
  };
  meta: PaginationMeta;
}
```

**Example Usage:**
```typescript
const searchParams = new URLSearchParams({
  q: 'restaurant miami',
  'filters[status]': 'active,prospect',
  'filters[type]': 'restaurant',
  page: '1',
  limit: '10'
});

const response = await fetch(`/api/v1/customers/search?${searchParams}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Error Handling:**
- **400:** Invalid search parameters
- **429:** Search rate limit exceeded

---

## Bulk Operations

### POST /customers/bulk

**Purpose:** Perform bulk operations on multiple customers.

**Request Parameters:**
```typescript
interface BulkCustomersRequest {
  operation: 'update' | 'delete' | 'assign' | 'tag';
  customerIds: string[];
  data?: {
    status?: string;
    assignedTo?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
}
```

**Response Format:**
```typescript
interface BulkCustomersResponse {
  success: true;
  data: {
    processed: number;
    failed: number;
    errors: Array<{
      customerId: string;
      error: string;
    }>;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/customers/bulk', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operation: 'assign',
    customerIds: ['cust_1', 'cust_2', 'cust_3'],
    data: {
      assignedTo: 'usr_9876543210'
    }
  })
});
```

**Error Handling:**
- **400:** Invalid operation or parameters
- **403:** Insufficient permissions for bulk operations
- **413:** Too many customers in single request (max 100)

This customer management system provides comprehensive CRUD operations with advanced search, filtering, and bulk operation capabilities optimized for food service sales teams.

